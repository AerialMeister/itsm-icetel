import { useState, useMemo } from 'react'
import { TIPOS, tipoLabel, tipoColor, clasifLabel } from '../constants'
import { TIPO_ICONS, IconPencil, IconNote, IconPlus, IconLock, IconClip, IconDownload, IconAlertClock } from './Icons'
import TicketForm from './TicketForm'
import CommentsModal from './CommentsModal'
import CloseTicketModal from './CloseTicketModal'
import AttachmentsModal from './AttachmentsModal'

const fmt = (iso) => (iso ? new Date(iso).toLocaleString('es-CL', { hour12: false, dateStyle: 'short', timeStyle: 'short' }) : '—')

// Devuelve true si el ticket está abierto y han pasado más de 60 min
// desde su creación o desde el último comentario (updated_at lo refleja via trigger)
const estaVencido = (ticket) => {
  if (ticket.estado !== 'abierto') return false
  const HORA_MS = 60 * 60 * 1000
  const ref = new Date(ticket.updated_at || ticket.created_at || ticket.fecha_inicio).getTime()
  return (Date.now() - ref) > HORA_MS
}

// Pequeño badge con contador reutilizable (observaciones / adjuntos)
function CountBadge({ children, count }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      {children}
      {count > 0 && (
        <span style={{
          position: 'absolute', top: -6, right: -8, background: '#1d4ed8', color: '#fff',
          borderRadius: 999, fontSize: 10, fontWeight: 700, padding: '0 4px', lineHeight: '14px',
        }}>{count}</span>
      )}
    </span>
  )
}

export default function TicketsTab({ tickets, commentCounts, attachmentCounts, loading, reload }) {
  const [showForm, setShowForm] = useState(false)
  const [editTicket, setEditTicket] = useState(null)
  const [commentTicket, setCommentTicket] = useState(null)
  const [attachTicket, setAttachTicket] = useState(null)
  const [closeTicket, setCloseTicket] = useState(null)

  const [search, setSearch] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [scope, setScope] = useState('todos') // 'todos' | 'hoy'

  const esHoy = (iso) => {
    if (!iso) return false
    const d = new Date(iso); const n = new Date()
    return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate()
  }

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (scope === 'hoy' && !esHoy(t.fecha_inicio)) return false
      if (filtroTipo && t.tipo_ticket !== filtroTipo) return false
      if (filtroEstado && t.estado !== filtroEstado) return false
      if (search) {
        const s = search.toLowerCase()
        const hay = [t.codigo, t.titulo, t.descripcion, t.activo].filter(Boolean).join(' ').toLowerCase()
        if (!hay.includes(s)) return false
      }
      return true
    })
  }, [tickets, search, filtroTipo, filtroEstado, scope])

  const afterSave = () => { setShowForm(false); setEditTicket(null); reload() }
  const afterClose = () => { setCloseTicket(null); reload() }

  // Exporta los tickets visibles (con filtros aplicados) a CSV compatible con Excel
  const descargarCSV = () => {
    const headers = ['Código', 'Tipo', 'Clasificación', 'Título', 'Descripción', 'Activo', 'Inicio', 'Cierre', 'Estado']
    const cell = (iso) => (iso ? new Date(iso).toLocaleString('es-CL', { hour12: false }) : '')
    const rows = filtered.map((t) => [
      t.codigo || '',
      tipoLabel(t.tipo_ticket),
      t.clasificacion_incidente ? clasifLabel(t.clasificacion_incidente) : '',
      t.titulo || '',
      t.descripcion || '',
      t.activo || '',
      cell(t.fecha_inicio),
      cell(t.fecha_cierre),
      t.estado === 'abierto' ? 'Abierto' : 'Cerrado',
    ])
    const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"'
    const csv = [headers, ...rows].map((r) => r.map(esc).join(';')).join('\r\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tickets_icetel_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container-fluid">
      <div className="toolbar">
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <IconPlus size={16} /> Ingresar nuevo ticket
        </button>

        <div className="seg">
          <button className={'seg-btn' + (scope === 'hoy' ? ' active' : '')} onClick={() => setScope('hoy')}>Hoy</button>
          <button className={'seg-btn' + (scope === 'todos' ? ' active' : '')} onClick={() => setScope('todos')}>Todos los tickets</button>
        </div>

        <input className="search-input" placeholder="Buscar código, título, activo…"
          value={search} onChange={(e) => setSearch(e.target.value)} style={{ minWidth: 250 }} />

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

        <button className="btn" onClick={descargarCSV} disabled={filtered.length === 0} title="Descargar los tickets visibles en CSV">
          <IconDownload size={16} /> Descargar CSV
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Tipo</th>
              <th>Título</th>
              <th>Descripción</th>
              <th>Activo</th>
              <th>Inicio</th>
              <th>Cierre</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={9} className="empty">Cargando tickets…</td></tr>}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={9} className="empty">No hay tickets que mostrar.</td></tr>
            )}
            {!loading && filtered.map((t) => {
              const Ico = TIPO_ICONS[TIPOS.find((x) => x.value === t.tipo_ticket)?.icon] || (() => null)
              const nComments = commentCounts[t.id] || 0
              const nFiles = attachmentCounts[t.id] || 0
              const vencido = estaVencido(t)
              return (
                <tr key={t.id}>
                  <td className="codigo-cell">{t.codigo || '—'}</td>
                  <td>
                    <span className="tipo-badge" style={{ background: tipoColor(t.tipo_ticket) }}>
                      <Ico size={13} /> {tipoLabel(t.tipo_ticket)}
                    </span>
                    {t.tipo_ticket === 'incidente' && t.clasificacion_incidente && (
                      <span className="clasif-tag">{clasifLabel(t.clasificacion_incidente)}</span>
                    )}
                  </td>
                  <td>{t.titulo}</td>
                  <td className="desc-cell" title={t.descripcion || ''}>{t.descripcion || '—'}</td>
                  <td>{t.activo || '—'}</td>
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
                        <CountBadge count={nComments}>
                          <IconNote size={16} className={nComments ? 'icon-note' : ''} />
                        </CountBadge>
                      </button>
                      <button className="btn-ghost" title="Informes adjuntos" onClick={() => setAttachTicket(t)}>
                        <CountBadge count={nFiles}>
                          <IconClip size={16} className={nFiles ? 'icon-clip' : ''} />
                        </CountBadge>
                      </button>
                      {t.estado === 'abierto' && (
                        <button className="btn-ghost" title="Cerrar ticket" style={{ color: '#dc2626' }}
                          onClick={() => setCloseTicket(t)}>
                          <IconLock size={16} />
                        </button>
                      )}
                      {vencido && (
                        <span
                          title="Ticket abierto hace más de 1 hora sin actividad"
                          style={{ color: '#f59e0b', display: 'inline-flex', alignItems: 'center' }}
                        >
                          <IconAlertClock size={16} />
                        </span>
                      )}
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
      {attachTicket && <AttachmentsModal ticket={attachTicket} onClose={() => setAttachTicket(null)} onChanged={reload} />}
      {closeTicket && <CloseTicketModal tickets={[closeTicket]} onClose={() => setCloseTicket(null)} onClosed={afterClose} />}
    </div>
  )
}
