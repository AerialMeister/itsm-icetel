// Genera el código único de un ticket.
//  - Incidentes:   DCSM-INC{AA}{MM}-{XXX}
//  - No incidentes: DCSM-D{AA}{MM}-{XXX}
// AA = últimos 2 dígitos del año, MM = mes (01-12) de la fecha de inicio.
// XXX = correlativo mensual por categoría, partiendo en 001.
export async function generarCodigo(supabase, tipo, fechaInicioISO) {
  const d = new Date(fechaInicioISO)
  const year = d.getFullYear()
  const month = d.getMonth() // 0-11
  const AA = String(year).slice(-2)
  const MM = String(month + 1).padStart(2, '0')

  // Límites del mes (hora local) para contar los del mismo período
  const start = new Date(year, month, 1).toISOString()
  const end = new Date(year, month + 1, 1).toISOString()

  const esIncidente = tipo === 'incidente'

  let q = supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .gte('fecha_inicio', start)
    .lt('fecha_inicio', end)
  q = esIncidente ? q.eq('tipo_ticket', 'incidente') : q.neq('tipo_ticket', 'incidente')

  const { count } = await q
  const corr = String((count || 0) + 1).padStart(3, '0')
  const prefix = esIncidente ? `DCSM-INC${AA}${MM}` : `DCSM-D${AA}${MM}`
  return `${prefix}-${corr}`
}
