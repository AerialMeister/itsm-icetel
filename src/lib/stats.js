import { TIPOS, AREAS, CLASIFICACIONES_INCIDENTE } from '../constants'

// Clave YYYY-MM en hora local
export const monthKey = (iso) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export const monthLabel = (key) => {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
}

// Lista de meses disponibles (más reciente primero) + el mes actual siempre
export const availableMonths = (tickets) => {
  const set = new Set(tickets.map((t) => monthKey(t.fecha_inicio)))
  const now = new Date()
  set.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
  return [...set].sort().reverse()
}

// Formatea una duración en ms a "Xd Yh Zm"
export const formatDuration = (ms) => {
  if (ms == null || isNaN(ms)) return '—'
  const totalMin = Math.round(ms / 60000)
  const d = Math.floor(totalMin / 1440)
  const h = Math.floor((totalMin % 1440) / 60)
  const m = totalMin % 60
  const parts = []
  if (d) parts.push(`${d}d`)
  if (h) parts.push(`${h}h`)
  if (m || parts.length === 0) parts.push(`${m}m`)
  return parts.join(' ')
}

const TIPOS_NO_INCIDENTE = ['evento', 'mantenimiento_preventivo', 'mantenimiento_correctivo']

export function computeStats(allTickets, mKey) {
  const tickets = allTickets.filter((t) => monthKey(t.fecha_inicio) === mKey)

  // Conteo por tipo
  const porTipo = TIPOS.map((t) => ({
    value: t.value, label: t.label, color: t.color,
    count: tickets.filter((x) => x.tipo_ticket === t.value).length,
  }))

  const incidentes = tickets.filter((t) => t.tipo_ticket === 'incidente')
  const noIncidentes = tickets.filter((t) => TIPOS_NO_INCIDENTE.includes(t.tipo_ticket))

  const incidentesEstado = {
    abierto: incidentes.filter((t) => t.estado === 'abierto').length,
    cerrado: incidentes.filter((t) => t.estado === 'cerrado').length,
  }
  const noIncidentesEstado = {
    abierto: noIncidentes.filter((t) => t.estado === 'abierto').length,
    cerrado: noIncidentes.filter((t) => t.estado === 'cerrado').length,
  }

  // Clasificación de incidentes
  const porClasificacion = CLASIFICACIONES_INCIDENTE.map((c) => ({
    label: c.label,
    count: incidentes.filter((t) => t.clasificacion_incidente === c.value).length,
  }))

  // Eventos e incidentes por sala / activo (ranking)
  const eventosEIncidentes = tickets.filter((t) => t.tipo_ticket === 'evento' || t.tipo_ticket === 'incidente')
  const rank = (campo) => {
    const map = {}
    eventosEIncidentes.forEach((t) => {
      const k = t[campo] || 'Sin asignar'
      map[k] = (map[k] || 0) + 1
    })
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
  }
  const porSala = rank('sala')
  const porActivo = rank('activo')

  // Por área: conteo de cada tipo
  const porArea = AREAS.map((a) => {
    const sub = tickets.filter((t) => t.area === a.value)
    return {
      area: a.label,
      evento: sub.filter((t) => t.tipo_ticket === 'evento').length,
      incidente: sub.filter((t) => t.tipo_ticket === 'incidente').length,
      preventivo: sub.filter((t) => t.tipo_ticket === 'mantenimiento_preventivo').length,
      correctivo: sub.filter((t) => t.tipo_ticket === 'mantenimiento_correctivo').length,
    }
  })

  // MTTR: promedio (cierre - inicio) de incidentes cerrados del mes
  const incidentesCerrados = incidentes.filter((t) => t.estado === 'cerrado' && t.fecha_cierre)
  let mttrMs = null
  if (incidentesCerrados.length > 0) {
    const total = incidentesCerrados.reduce(
      (acc, t) => acc + (new Date(t.fecha_cierre) - new Date(t.fecha_inicio)), 0)
    mttrMs = total / incidentesCerrados.length
  }

  // MTBF: activos con más de un incidente en el mes
  const porActivoInc = {}
  incidentes.forEach((t) => {
    const k = t.activo || 'Sin asignar'
    ;(porActivoInc[k] = porActivoInc[k] || []).push(t)
  })
  const mtbf = Object.entries(porActivoInc)
    .filter(([, arr]) => arr.length > 1)
    .map(([activo, arr]) => {
      const sorted = [...arr].sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio))
      let totalGap = 0
      for (let i = 1; i < sorted.length; i++) {
        totalGap += new Date(sorted[i].fecha_inicio) - new Date(sorted[i - 1].fecha_inicio)
      }
      const gaps = sorted.length - 1
      return { activo, incidentes: arr.length, mtbfMs: totalGap / gaps }
    })
    .sort((a, b) => b.incidentes - a.incidentes)

  // Tickets generados por día del mes
  const [yy, mm] = mKey.split('-').map(Number)
  const diasMes = new Date(yy, mm, 0).getDate()
  const porDia = Array.from({ length: diasMes }, (_, i) => ({ dia: String(i + 1), count: 0 }))
  tickets.forEach((t) => {
    const d = new Date(t.fecha_inicio).getDate()
    if (porDia[d - 1]) porDia[d - 1].count++
  })

  return {
    total: tickets.length,
    porDia,
    porTipo,
    incidentesEstado,
    noIncidentesEstado,
    porClasificacion,
    porSala,
    porActivo,
    porArea,
    mttrMs,
    mttrCount: incidentesCerrados.length,
    mtbf,
  }
}
