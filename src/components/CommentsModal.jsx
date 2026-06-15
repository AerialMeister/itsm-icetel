import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { IconX } from './Icons'

const fmt = (iso) => new Date(iso).toLocaleString('es-CL', { hour12: false })

export default function CommentsModal({ ticket, onClose, onChanged }) {
  const [items, setItems] = useState([])
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('ticket_comentarios')
      .select('*')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true })
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => { cargar() }, [ticket.id])

  const agregar = async () => {
    if (!texto.trim()) return
    setSaving(true)
    const { error } = await supabase
      .from('ticket_comentarios')
      .insert({ ticket_id: ticket.id, comentario: texto.trim() })
    setSaving(false)
    if (!error) { setTexto(''); cargar(); onChanged && onChanged() }
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal modal-sm">
        <div className="modal-head">
          <h3>Observaciones · {ticket.titulo}</h3>
          <button className="btn-ghost" onClick={onClose}><IconX /></button>
        </div>
        <div className="modal-body">
          <div className="comment-list">
            {loading && <div className="empty">Cargando…</div>}
            {!loading && items.length === 0 && <div className="empty">Sin observaciones aún.</div>}
            {items.map((c) => (
              <div className="comment" key={c.id}>
                <div className="meta">{fmt(c.created_at)}</div>
                <div>{c.comentario}</div>
              </div>
            ))}
          </div>
          <div className="field">
            <label>Nueva observación</label>
            <textarea value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Anota un evento u observación…" />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cerrar</button>
          <button className="btn btn-primary" onClick={agregar} disabled={saving || !texto.trim()}>
            {saving ? 'Guardando…' : 'Agregar observación'}
          </button>
        </div>
      </div>
    </div>
  )
}
