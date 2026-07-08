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
//
// Para evitar choques con datos ya cargados, el correlativo se calcula a partir
// del MAYOR correlativo ya existente para ese prefijo (no contando filas).

const TIPOS_FORMATO_DIA = [
  'mantenimiento_preventivo',
  'mantenimiento_correctivo',
  'proyecto',
]

// Correlativo entero más alto entre los códigos que empiezan con `prefix`.
// `tail` = cuántos dígitos finales representan el correlativo (2 o 3).
async function maxCorrelativo(supabase, prefix, tail) {
  const { data } = await supabase
    .from('tickets')
    .select('codigo')
    .like('codigo', `${prefix}%`)

  let max = -1
  ;(data || []).forEach((r) => {
    const seg = String(r.codigo).split('-').pop()       // último segmento
    const n = parseInt(seg.slice(-tail), 10)            // últimos `tail` dígitos
    if (!isNaN(n) && n > max) max = n
  })
  return max
}

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
    const prefix = `DCSM-${year}-${DD}`          // seguido de NN (2 dígitos)
    const max = await maxCorrelativo(supabase, prefix, 2)
    const NN = String(max + 1).padStart(2, '0')  // parte en 00 si no hay ninguno
    return `${prefix}${NN}`
  }

  // ── Formatos 1 y 2: Incidente / Evento (correlativo mensual) ──
  const esIncidente = tipo === 'incidente'
  const prefix = esIncidente ? `DCSM-INC${AA}${MM}-` : `DCSM-D${AA}${MM}-`
  const max = await maxCorrelativo(supabase, prefix, 3)
  const corr = String(Math.max(max, 0) + 1).padStart(3, '0') // parte en 001
  return `${prefix}${corr}`
}
