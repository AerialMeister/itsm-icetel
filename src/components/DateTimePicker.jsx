// Selector de fecha (formato fijo dd/mm/aaaa para todos los usuarios,
// sin depender del idioma del navegador) + hora y minutos en formato 24h.
// value / onChange usan el formato "YYYY-MM-DDTHH:mm" (igual que datetime-local)
import { useRef, useState, useEffect } from 'react'

const pad = (n) => String(n).padStart(2, '0')
const HORAS = Array.from({ length: 24 }, (_, i) => pad(i))
const MINUTOS = Array.from({ length: 60 }, (_, i) => pad(i))

// ISO (yyyy-mm-dd) -> texto visible (dd/mm/aaaa)
const isoToDisplay = (iso) => {
  if (!iso) return ''
  const [y, mo, d] = iso.split('-')
  if (!y || !mo || !d) return ''
  return `${d}/${mo}/${y}`
}

// texto dd/mm/aaaa -> ISO (yyyy-mm-dd); null si no es una fecha válida y completa
const displayToIso = (s) => {
  const m = String(s).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return null
  const d = Number(m[1]), mth = Number(m[2]), y = Number(m[3])
  if (mth < 1 || mth > 12 || d < 1 || d > 31) return null
  const dt = new Date(y, mth - 1, d)
  if (dt.getFullYear() !== y || dt.getMonth() !== mth - 1 || dt.getDate() !== d) return null
  return `${y}-${pad(mth)}-${pad(d)}`
}

const IconCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

export default function DateTimePicker({ value, onChange }) {
  const [fecha = '', hora = ''] = (value || '').split('T') // fecha en ISO yyyy-mm-dd
  const hh = hora.split(':')[0] || ''
  const mm = hora.split(':')[1] || ''

  const dateRef = useRef(null)
  const [texto, setTexto] = useState(isoToDisplay(fecha))

  // Mantiene el texto visible sincronizado con el valor externo
  useEffect(() => { setTexto(isoToDisplay(fecha)) }, [fecha])

  const emit = (isoFecha, nHh, nMm) => {
    if (!isoFecha) { onChange(''); return }
    onChange(`${isoFecha}T${nHh || '00'}:${nMm || '00'}`)
  }

  // Escritura manual: solo dígitos, insertando las barras automáticamente
  const onTextChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8)
    let v = digits
    if (digits.length > 4) v = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
    else if (digits.length > 2) v = `${digits.slice(0, 2)}/${digits.slice(2)}`
    setTexto(v)
    if (v === '') { onChange(''); return }
    const iso = displayToIso(v)
    if (iso) emit(iso, hh, mm)
  }

  // Al salir del campo, si quedó incompleto/ inválido, vuelve al último valor válido
  const onTextBlur = () => setTexto(isoToDisplay(fecha))

  const abrirCalendario = () => {
    const el = dateRef.current
    if (!el) return
    if (typeof el.showPicker === 'function') { try { el.showPicker() } catch { el.focus() } }
    else el.focus()
  }

  return (
    <div className="dt-picker">
      <div className="dt-datebox">
        <input
          type="text"
          inputMode="numeric"
          className="dt-date"
          placeholder="dd/mm/aaaa"
          value={texto}
          onChange={onTextChange}
          onBlur={onTextBlur}
          style={{ paddingRight: 34 }}
        />
        <button type="button" className="dt-cal-btn" title="Abrir calendario" onClick={abrirCalendario}>
          <IconCalendar />
        </button>
        {/* Calendario nativo oculto: solo se usa su selector emergente */}
        <input
          ref={dateRef}
          type="date"
          className="dt-native-hidden"
          tabIndex={-1}
          value={fecha}
          onChange={(e) => emit(e.target.value, hh, mm)}
        />
      </div>
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
