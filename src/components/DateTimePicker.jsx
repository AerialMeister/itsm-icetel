// Selector de fecha (calendario) + hora y minutos en formato 24h.
// value / onChange usan el formato "YYYY-MM-DDTHH:mm" (igual que datetime-local)
const pad = (n) => String(n).padStart(2, '0')
const HORAS = Array.from({ length: 24 }, (_, i) => pad(i))
const MINUTOS = Array.from({ length: 60 }, (_, i) => pad(i))

export default function DateTimePicker({ value, onChange }) {
  const [fecha = '', hora = ''] = (value || '').split('T')
  const hh = hora.split(':')[0] || ''
  const mm = hora.split(':')[1] || ''

  const emit = (nFecha, nHh, nMm) => {
    if (!nFecha) { onChange(''); return }
    onChange(`${nFecha}T${nHh || '00'}:${nMm || '00'}`)
  }

  return (
    <div className="dt-picker">
      <input
        type="date"
        className="dt-date"
        value={fecha}
        onChange={(e) => emit(e.target.value, hh, mm)}
      />
      <div className="dt-time">
        <select value={hh} onChange={(e) => emit(fecha, e.target.value, mm)}>
          <option value="" disabled>hh</option>
          {HORAS.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
        <span className="dt-sep">:</span>
        <select value={mm} onChange={(e) => emit(fecha, hh, e.target.value)}>
          <option value="" disabled>mm</option>
          {MINUTOS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <span className="dt-h24">24h</span>
      </div>
    </div>
  )
}
