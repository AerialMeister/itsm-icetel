// Genera el código único de un ticket. Hay tres formatos:
//
//  1. Incidentes:                        DCSM-INC{AA}{MM}-{XXX}
//     AA = últimos 2 dígitos del año, MM = mes (01-12), XXX = correlativo
//     mensual de incidentes (parte en 001).
//
//  2. Eventos:                           DCSM-D{AA}{MM}-{XXX}
//     XXX = correlativo mensual de eventos (parte en 001).
//
//  3. Mant. Preventivo / Correctivo /    DCSM-{AAAA}-{DD}{NN}
//     Proyecto:
//     AAAA = año completo (ej: 2026), DD = día del mes de la fecha de inicio
//     (01-31), NN = correlativo que parte en 00 y aumenta +1 por cada ticket
//     de estos tipos creado el mismo día (00, 01, 02, …).

const TIPOS_FORMATO_DIA = [
  'mantenimiento_preventivo',
  'mantenimiento_correctivo',
  'proyecto',
]

export async function generarCodigo(supabase, tipo, fechaInicioISO) {
  const d = new Date(fechaInicioISO)
  const year = d.getFullYear()
  const month = d.getMonth() // 0-11
  const day = d.getDate()
  const AA = String(year).slice(-2)
  const MM = String(month + 1).padStart(2, '0')
  const DD = String(day).padStart(2, '0')

  // ── Formato 3: Mant. Preventivo / Correctivo / Proyecto ──
  if (TIPOS_FORMATO_DIA.includes(tipo)) {
    // Límites del día (hora local) para contar los del mismo día
    const dayStart = new Date(year, month, day).toISOString()
    const dayEnd = new Date(year, month, day + 1).toISOString()

    const { count } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .in('tipo_ticket', TIPOS_FORMATO_DIA)
      .gte('fecha_inicio', dayStart)
      .lt('fecha_inicio', dayEnd)

    const NN = String(count || 0).padStart(2, '0') // parte en 00
    return `DCSM-${year}-${DD}${NN}`
  }

  // ── Formatos 1 y 2: Incidente / Evento (correlativo mensual) ──
  const start = new Date(year, month, 1).toISOString()
  const end = new Date(year, month + 1, 1).toISOString()
  const esIncidente = tipo === 'incidente'

  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('tipo_ticket', esIncidente ? 'incidente' : 'evento')
    .gte('fecha_inicio', start)
    .lt('fecha_inicio', end)

  const corr = String((count || 0) + 1).padStart(3, '0')
  const prefix = esIncidente ? `DCSM-INC${AA}${MM}` : `DCSM-D${AA}${MM}`
  return `${prefix}-${corr}`
}
