import { useState, useRef, useEffect } from 'react'
import { supabase } from '../supabaseClient'

// Selector de activos contra la CMDB (función RPC cmdb_buscar_activos).
// - value: { id, nombre }  (id null => texto libre en 'nombre')
// - onChange({ id, nombre })
// - systemName: nombre del sistema seleccionado para filtrar (ej: 'Sistema Eléctrico')
// - tipoName: nombre del tipo/grupo seleccionado para filtrar (ej: 'UPS')
export default function AssetPicker({ value, onChange, systemName, tipoName, placeholder = 'Buscar activo en la CMDB…' }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [freeText, setFreeText] = useState(Boolean(value?.nombre && !value?.id))
  const ref = useRef(null)

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setQuery('') } }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    if (!open || freeText) return
    let cancel = false
    setLoading(true)
    const h = setTimeout(async () => {
      const { data, error } = await supabase.rpc('cmdb_buscar_activos', { p_query: query.trim() })
      if (cancel) return
      let filtered = error ? [] : (data || [])
      // Filtra por sistema si está seleccionado
      if (systemName && filtered.length) {
        filtered = filtered.filter((a) => a.sistema === systemName)
      }
      // Filtra por tipo/grupo si está seleccionado
      if (tipoName && filtered.length) {
        filtered = filtered.filter((a) => a.tipo === tipoName)
      }
      setResults(filtered)
      setLoading(false)
    }, 220)
    return () => { cancel = true; clearTimeout(h) }
  }, [query, open, freeText, systemName, tipoName])

  const pick = (a) => { onChange({ id: a.id, nombre: a.nombre }); setOpen(false); setQuery('') }
  const clear = () => onChange({ id: null, nombre: '' })

  if (freeText) {
    return (
      <div>
        <input
          type="text"
          value={value?.nombre || ''}
          placeholder="Texto libre (sin vincular a la CMDB)"
          onChange={(e) => onChange({ id: null, nombre: e.target.value })}
        />
        <div style={{ marginTop: 6 }}>
          <button type="button" className="btn-ghost" style={{ fontSize: 12, color: 'var(--brand-light)' }}
            onClick={() => { setFreeText(false); onChange({ id: null, nombre: '' }) }}>
            ← Buscar en la CMDB
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="combo" ref={ref}>
      <input
        className="combo-input"
        value={open ? query : (value?.nombre || '')}
        placeholder={value?.nombre || placeholder}
        onChange={(e) => { setQuery(e.target.value); if (!open) setOpen(true) }}
        onFocus={() => setOpen(true)}
      />
      {value?.id && !open && (
        <span style={{ position: 'absolute', right: 30, top: 9, fontSize: 11, color: 'var(--cerrado, #16a34a)' }} title="Vinculado a la CMDB">✓ CMDB</span>
      )}
      {open && (
        <div className="combo-list">
          {loading && <div className="combo-opt empty">Buscando…</div>}
          {!loading && results.length === 0 && <div className="combo-opt empty">Sin coincidencias en la CMDB</div>}
          {!loading && results.map((a) => (
            <div key={a.id} className="combo-opt"
              onMouseDown={(e) => { e.preventDefault(); pick(a) }}>
              <div>{a.nombre}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{a.sistema} · {a.tipo}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: 6, display: 'flex', gap: 14 }}>
        {value?.id && (
          <button type="button" className="btn-ghost" style={{ fontSize: 12 }} onClick={clear}>Quitar</button>
        )}
        <button type="button" className="btn-ghost" style={{ fontSize: 12, color: 'var(--muted)' }}
          onClick={() => { setFreeText(true); setOpen(false) }}>
          Usar texto libre
        </button>
      </div>
    </div>
  )
}
