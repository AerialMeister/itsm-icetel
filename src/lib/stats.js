import { TIPOS, CLASIFICACIONES_INCIDENTE } from '../constants'

const pad = (n) => String(n).padStart(2, '0')

// Clave YYYY-MM en hora local
export const monthKey = (iso) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// ¿La clave es un año completo (YYYY) en vez de un mes (YYYY-MM)?
export const isYearKey = (key) => /^\d{4}$/.test(String(key))

export const monthLabel = (key) => {
  const [y, m] = String(key).split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
}

// Etiqueta para cualquier período (mes o año completo)
export const periodLabel = (key) => (isYearKey(key) ? `Todo el año ${key}` : monthLabel(key))

// Lista de meses disponibles (más reciente primero) + el mes actual siempre
export const availableMonths = (tickets) => {
  const set = new Set(tickets.map((t) => monthKey(t.fecha_inicio)))
  const now = new Date()
  set.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
  return [...set].sort().reverse()
}

// Lista de períodos: por cada año presente, primero "Todo el año YYYY" y luego
// sus meses (más reciente primero). Años ordenados del más reciente al más antiguo.
export const availablePeriods = (tickets) => {
  const months = new Set(tickets.map((t) => monthKey(t.fecha_inicio)))
  const now = new Date()
  months.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
  const monthList = [...months]
  const years = [...new Set(monthList.map((m) => m.split('-')[0]))].sort().reverse()
  const out = []
  years.forEach((y) => {
    out.push({ key: y, label: `Todo el año ${y}`, isYear: true })
    monthList.filter((m) => m.startsWith(y + '-')).sort().reverse()
      .forEach((m) => out.push({ key: m, label: monthLabel(m), isYear: false }))
  })
  return out
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

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

// Mapeo de slug de sistema → área equivalente (para el gráfico "Tickets por área y tipo")
const SISTEMA_A_AREA = {
  'electrico':          'Energía',
  'mecanico':           'Clima',
  'arquitectonico':     'Servicios generales',
  'telecomunicaciones': 'Telecomunicaciones',
}

// Ranking genérico por campo
const rankBy = (lista, fn) => {
  const map = {}
  lista.forEach((t) => {
    const k = fn(t) || 'Sin información'
    map[k] = (map[k] || 0) + 1
  })
  return Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

export function computeStats(allTickets, key, rango) {
  const esRango = key === 'rango'
  const anual = !esRango && isYearKey(key)
  const rDesde = esRango && rango?.desde ? new Date(`${rango.desde}T00:00:00`) : null
  const rHasta = esRango && rango?.hasta ? new Date(`${rango.hasta}T23:59:59`) : null

  const tickets = allTickets.filter((t) => {
    const f = new Date(t.fecha_inicio)
    if (esRango) {
      if (rDesde && f < rDesde) return false
      if (rHasta && f > rHasta) return false
      return true
    }
    if (anual) return String(f.getFullYear()) === String(key)
    return monthKey(t.fecha_inicio) === key
  })

  // Conteo por tipo
  const porTipo = TIPOS.map((t) => ({
    value: t.value, label: t.label, color: t.color,
    count: tickets.filter((x) => x.tipo_ticket === t.value).length,
  }))

  const incidentes   = tickets.filter((t) => t.tipo_ticket === 'incidente')
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

  // Zonas y activos con más incidentes (solo tickets de tipo incidente)
  // Usa ubicacion_activo (viene de la CMDB via la función enriquecida)
  const porZona   = rankBy(incidentes, (t) => t.ubicacion_activo || '')
  const porActivo = rankBy(incidentes, (t) => t.activo)

  // Tickets por área derivada del sistema del activo
  // Agrupa usando SISTEMA_A_AREA; tickets sin sistema van a "Sin sistema"
  const areasUnicas = [...new Set([
    ...Object.values(SISTEMA_A_AREA),
    'Sin sistema',
  ])]

  const porArea = areasUnicas.map((areaLabel) => {
    const sub = tickets.filter((t) => {
      const a = SISTEMA_A_AREA[t.sistema_slug] || 'Sin sistema'
      return a === areaLabel
    })
    return {
      area:       areaLabel,
      evento:     sub.filter((t) => t.tipo_ticket === 'evento').length,
      incidente:  sub.filter((t) => t.tipo_ticket === 'incidente').length,
      preventivo: sub.filter((t) => t.tipo_ticket === 'mantenimiento_preventivo').length,
      correctivo: sub.filter((t) => t.tipo_ticket === 'mantenimiento_correctivo').length,
    }
  }).filter((a) => (a.evento + a.incidente + a.preventivo + a.correctivo) > 0)

  // MTTR
  const incidentesCerrados = incidentes.filter((t) => t.estado === 'cerrado' && t.fecha_cierre)
  let mttrMs = null
  if (incidentesCerrados.length > 0) {
    const total = incidentesCerrados.reduce(
      (acc, t) => acc + (new Date(t.fecha_cierre) - new Date(t.fecha_inicio)), 0)
    mttrMs = total / incidentesCerrados.length
  }

  // MTBF
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
      return { activo, incidentes: arr.length, mtbfMs: totalGap / (sorted.length - 1) }
    })
    .sort((a, b) => b.incidentes - a.incidentes)

  // Serie temporal (barras): por día o por mes según el período seleccionado
  let porDia, serieUnidad
  if (esRango) {
    // Límites efectivos: fechas del rango o, si faltan, el mín/máx de los tickets
    const fechas = tickets.map((t) => new Date(t.fecha_inicio))
    const lo = rDesde || (fechas.length ? new Date(Math.min(...fechas)) : new Date())
    const hi = rHasta || (fechas.length ? new Date(Math.max(...fechas)) : new Date())
    const spanDias = Math.floor((hi - lo) / 86400000) + 1
    const buckets = new Map()
    if (spanDias <= 62) {
      serieUnidad = 'dia'
      const cur = new Date(lo.getFullYear(), lo.getMonth(), lo.getDate())
      const fin = new Date(hi.getFullYear(), hi.getMonth(), hi.getDate())
      while (cur <= fin) { buckets.set(`${pad(cur.getDate())}/${pad(cur.getMonth() + 1)}`, 0); cur.setDate(cur.getDate() + 1) }
      tickets.forEach((t) => {
        const d = new Date(t.fecha_inicio)
        const k = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`
        if (buckets.has(k)) buckets.set(k, buckets.get(k) + 1)
      })
    } else {
      serieUnidad = 'mes'
      const cur = new Date(lo.getFullYear(), lo.getMonth(), 1)
      const fin = new Date(hi.getFullYear(), hi.getMonth(), 1)
      while (cur <= fin) { buckets.set(`${MESES_CORTOS[cur.getMonth()]}-${String(cur.getFullYear()).slice(-2)}`, 0); cur.setMonth(cur.getMonth() + 1) }
      tickets.forEach((t) => {
        const d = new Date(t.fecha_inicio)
        const k = `${MESES_CORTOS[d.getMonth()]}-${String(d.getFullYear()).slice(-2)}`
        if (buckets.has(k)) buckets.set(k, buckets.get(k) + 1)
      })
    }
    porDia = [...buckets].map(([dia, count]) => ({ dia, count }))
  } else if (anual) {
    serieUnidad = 'mes'
    porDia = MESES_CORTOS.map((nombre) => ({ dia: nombre, count: 0 }))
    tickets.forEach((t) => {
      const m = new Date(t.fecha_inicio).getMonth()
      if (porDia[m]) porDia[m].count++
    })
  } else {
    serieUnidad = 'dia'
    const [yy, mm] = key.split('-').map(Number)
    const diasMes = new Date(yy, mm, 0).getDate()
    porDia = Array.from({ length: diasMes }, (_, i) => ({ dia: String(i + 1), count: 0 }))
    tickets.forEach((t) => {
      const d = new Date(t.fecha_inicio).getDate()
      if (porDia[d - 1]) porDia[d - 1].count++
    })
  }

  return {
    total: tickets.length,
    anual,
    serieUnidad,
    porDia,
    porTipo,
    incidentesEstado,
    noIncidentesEstado,
    porClasificacion,
    porZona,
    porActivo,
    porArea,
    mttrMs,
    mttrCount: incidentesCerrados.length,
    mtbf,
  }
}
