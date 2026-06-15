import { useState, useMemo } from 'react'
import { TIPOS, tipoLabel, tipoColor, clasifLabel, areaLabel } from '../constants'
import { TIPO_ICONS, IconPencil, IconNote, IconPlus, IconLock } from './Icons'
import TicketForm from './TicketForm'
import CommentsModal from './CommentsModal'
import CloseTicketModal from './CloseTicketModal'

const fmt = (iso) => (iso ? new Date(iso).toLocaleString('es-CL', { hour12: false, dateStyle: 'short', timeStyle: 'short' }) : '—')

export default function TicketsTab({ tickets, commentCounts, loading, reload }) {
  const [showForm, setShowForm] = useState(false)
  const [editTicket, setEditTicket] = useState(null)
  const [commentTicket, setCommentTicket] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [showClose, setShowClose] = useState(false)

  const [search, setSearch] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (filtroTipo && t.tipo_ticket !== filtroTipo) return false
      if (filtroEstado && t.estado !== filtroEstado) return false
      if (search) {
        const s = search.toLowerCase()
        const hay = [t.titulo, t.descripcion, t.sala, t.activo].filter(Boolean).join(' ').toLowerCase()
        if (!hay.includes(s)) return false
      }
      return true
    })
  }, [tickets, search, filtroTipo, filtroEstado])

  const toggleSel = (id) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  // Solo se pueden cerrar tickets abiertos
  const selectedOpen = tickets.filter((t) => selected.has(t.id) && t.estado === 'abierto')

  const afterSave = () => { setShowForm(false); setEditTicket(null); reload() }
  const afterClose = () => { setShowClose(false); setSelected(new Set()); reload() }

  return (
    <div className="container">
      <div className="toolbar">
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <IconPlus size={16} /> Ingresar nuevo ticket
        </button>

        <input className="search-input" placeholder="Buscar título, sala, activo…"
          value={search} onChange={(e) => setSearch(e.target.value)} style={{ minWidth: 230 }} />

        <select className="filter-select" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>

        <select className="filter-select" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="abierto">Abierto</option>
          <option value="cerrado">Cerrado</option>
        </select>

        <div className="spacer" />

        <button className="btn btn-danger" disabled={selectedOpen.length === 0} onClick={() => setShowClose(true)}>
          <IconLock size={16} /> Cerrar ticket{selectedOpen.length > 1 ? 's' : ''}{selectedOpen.length ? ` (${selectedOpen.length})` : ''}
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="cell-check"></th>
              <th>Tipo</th>
              <th>Título</th>
              <th>Sala</th>
              <th>Activo</th>
              <th>Área</th>
              <th>Inicio</th>
              <th>Cierre</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={10} className="empty">Cargando tickets…</td></tr>}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={10} className="empty">No hay tickets que mostrar.</td></tr>
            )}
            {!loading && filtered.map((t) => {
              const Ico = TIPO_ICONS[TIPOS.find((x) => x.value === t.tipo_ticket)?.icon] || (() => null)
              const nComments = commentCounts[t.id] || 0
              return (
                <tr key={t.id}>
                  <td className="cell-check">
                    <input type="checkbox"
                      checked={selected.has(t.id)}
                      disabled={t.estado === 'cerrado'}
                      onChange={() => toggleSel(t.id)} />
                  </td>
                  <td>
                    <span className="tipo-badge" style={{ background: tipoColor(t.tipo_ticket) }}>
                      <Ico size={13} /> {tipoLabel(t.tipo_ticket)}
                    </span>
                    {t.tipo_ticket === 'incidente' && t.clasificacion_incidente && (
                      <span className="clasif-tag">{clasifLabel(t.clasificacion_incidente)}</span>
                    )}
                  </td>
                  <td>{t.titulo}</td>
                  <td>{t.sala || '—'}</td>
                  <td>{t.activo || '—'}</td>
                  <td>{areaLabel(t.area)}</td>
                  <td>{fmt(t.fecha_inicio)}</td>
                  <td>{fmt(t.fecha_cierre)}</td>
                  <td>
                    <span className={t.estado === 'abierto' ? 'estado-abierto' : 'estado-cerrado'}>
                      {t.estado === 'abierto' ? 'Abierto' : 'Cerrado'}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="btn-ghost" title="Editar" onClick={() => setEditTicket(t)}>
                        <IconPencil size={16} />
                      </button>
                      <button className="btn-ghost" title="Observaciones" onClick={() => setCommentTicket(t)}>
                        <span style={{ position: 'relative', display: 'inline-flex' }}>
                          <IconNote size={16} className={nComments ? 'icon-note' : ''} />
                          {nComments > 0 && (
                            <span style={{
                              position: 'absolute', top: -6, right: -8, background: '#1d4ed8', color: '#fff',
                              borderRadius: 999, fontSize: 10, fontWeight: 700, padding: '0 4px', lineHeight: '14px',
                            }}>{nComments}</span>
                          )}
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showForm && <TicketForm onClose={() => setShowForm(false)} onSaved={afterSave} />}
      {editTicket && <TicketForm initial={editTicket} onClose={() => setEditTicket(null)} onSaved={afterSave} />}
      {commentTicket && <CommentsModal ticket={commentTicket} onClose={() => setCommentTicket(null)} onChanged={reload} />}
      {showClose && <CloseTicketModal tickets={selectedOpen} onClose={() => setShowClose(false)} onClosed={afterClose} />}
    </div>
  )
}
