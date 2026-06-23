import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { IconX, IconClip } from './Icons'

const BUCKET = 'adjuntos'
const fmt = (iso) => new Date(iso).toLocaleString('es-CL', { hour12: false })

export default function AttachmentsModal({ ticket, onClose, onChanged }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('ticket_adjuntos')
      .select('*')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true })
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => { cargar() }, [ticket.id])

  const subir = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    const path = `${ticket.id}/${Date.now()}_${file.name}`
    const up = await supabase.storage.from(BUCKET).upload(path, file)
    if (up.error) { setError('Error al subir: ' + up.error.message); setUploading(false); return }
    const ins = await supabase
      .from('ticket_adjuntos')
      .insert({ ticket_id: ticket.id, nombre: file.name, path })
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
    if (ins.error) { setError('Error al registrar: ' + ins.error.message); return }
    cargar(); onChanged && onChanged()
  }

  const eliminar = async (item) => {
    await supabase.storage.from(BUCKET).remove([item.path])
    await supabase.from('ticket_adjuntos').delete().eq('id', item.id)
    cargar(); onChanged && onChanged()
  }

  const urlDe = (path) => supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal modal-sm">
        <div className="modal-head">
          <h3>Informes adjuntos · {ticket.titulo}</h3>
          <button className="btn-ghost" onClick={onClose}><IconX /></button>
        </div>
        <div className="modal-body">
          <div className="file-list">
            {loading && <div className="empty">Cargando…</div>}
            {!loading && items.length === 0 && <div className="empty">Sin archivos adjuntos.</div>}
            {items.map((f) => (
              <div className="file-row" key={f.id}>
                <IconClip size={16} className="icon-clip" />
                <span className="fname">
                  <a href={urlDe(f.path)} target="_blank" rel="noreferrer">{f.nombre}</a>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{fmt(f.created_at)}</div>
                </span>
                <button className="btn-ghost fdel" title="Eliminar" onClick={() => eliminar(f)}><IconX size={15} /></button>
              </div>
            ))}
          </div>

          <div className="field">
            <label>Adjuntar informe</label>
            <input ref={fileRef} type="file" onChange={subir} disabled={uploading} />
            {uploading && <span className="hint">Subiendo…</span>}
          </div>
          {error && <div className="error-text">{error}</div>}
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}
