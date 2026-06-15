import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { IconX } from './Icons'

// Cierre de uno o varios tickets. Exige fecha y hora de cierre.
export default function CloseTicketModal({ tickets, onClose, onClosed }) {
  const [fechaCierre, setFechaCierre] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // El cierre no puede ser anterior al inicio más reciente de la selección
  const minInicio = tickets.reduce((max, t) => (t.fecha_inicio > max ? t.fecha_inicio : max), '')

  const cerrar = async () => {
    if (!fechaCierre) { setError('Debes ingresar la fecha y hora de cierre.'); return }
    const cierreISO = new Date(fechaCierre).toISOString()
    if (minInicio && cierreISO < minInicio) {
      setError('La fecha de cierre no puede ser anterior a la fecha de inicio del ticket.')
      return
    }
    setError('')
    setSaving(true)
    const ids = tickets.map((t) => t.id)
    const { error } = await supabase
      .from('tickets')
      .update({ estado: 'cerrado', fecha_cierre: cierreISO })
      .in('id', ids)
    setSaving(false)
    if (error) { setError('Error al cerrar: ' + error.message); return }
    onClosed()
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal modal-sm">
        <div className="modal-head">
          <h3>Cerrar {tickets.length > 1 ? `${tickets.length} tickets` : 'ticket'}</h3>
          <button className="btn-ghost" onClick={onClose}><IconX /></button>
        </div>
        <div className="modal-body">
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>
            El cierre es obligatorio: ingresa la fecha y hora en que se resolvió.
          </p>
          <div className="field">
            <label>Fecha y hora de cierre</label>
            <input type="datetime-local" value={fechaCierre} onChange={(e) => setFechaCierre(e.target.value)} />
          </div>
          {error && <div className="error-text">{error}</div>}
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-danger" onClick={cerrar} disabled={saving || !fechaCierre}>
            {saving ? 'Cerrando…' : 'Cerrar ticket'}
          </button>
        </div>
      </div>
    </div>
  )
}
