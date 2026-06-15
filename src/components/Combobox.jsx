import { useState, useRef, useEffect } from 'react'

// Select con búsqueda rápida por texto.
// options: string[]  |  value/onChange: string
export default function Combobox({ options, value, onChange, placeholder = 'Selecciona o escribe…' }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setQuery('') } }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const filtered = options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()))

  const pick = (val) => { onChange(val); setOpen(false); setQuery('') }

  const onKey = (e) => {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtered[active]) pick(filtered[active]) }
    else if (e.key === 'Escape') { setOpen(false) }
  }

  return (
    <div className="combo" ref={ref}>
      <input
        className="combo-input"
        value={open ? query : (value || '')}
        placeholder={value || placeholder}
        onChange={(e) => { setQuery(e.target.value); setActive(0); if (!open) setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
      />
      {open && (
        <div className="combo-list">
          {filtered.length === 0 && <div className="combo-opt empty">Sin coincidencias</div>}
          {filtered.map((o, i) => (
            <div
              key={o}
              className={'combo-opt' + (i === active ? ' active' : '')}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => { e.preventDefault(); pick(o) }}
            >
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
