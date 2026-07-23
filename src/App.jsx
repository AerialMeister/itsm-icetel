import { useState, useEffect, useCallback } from 'react'
import { supabase, supabaseConfigured } from './supabaseClient'
import { useAuth } from './auth/AuthContext'
import TicketsTab from './components/TicketsTab'
import StatsTab from './components/StatsTab'

export default function App() {
  const { perfil, logout } = useAuth()
  const [tab, setTab] = useState('tickets')
  const [tickets, setTickets] = useState([])
  const [commentCounts, setCommentCounts] = useState({})
  const [attachmentCounts, setAttachmentCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const reload = useCallback(async () => {
    if (!supabaseConfigured) { setLoading(false); return }
    setLoading(true)

    const { data: tk, error } = await supabase.rpc('itsm_tickets_enriquecidos')
    if (error) { setLoadError(error.message); setLoading(false); return }
    // La función enriquecida puede no traer `area` (especialidad); la completamos
    // desde la tabla para poder mostrar el ícono de especialidad en la lista.
    const { data: areas } = await supabase.from('tickets').select('id, area')
    const areaPorId = {}
    ;(areas || []).forEach((a) => { areaPorId[a.id] = a.area })
    setTickets((tk || []).map((t) => ({ ...t, area: t.area ?? areaPorId[t.id] })))

    const { data: cm } = await supabase.from('ticket_comentarios').select('ticket_id')
    const counts = {}
    ;(cm || []).forEach((c) => { counts[c.ticket_id] = (counts[c.ticket_id] || 0) + 1 })
    setCommentCounts(counts)

    const { data: ad } = await supabase.from('ticket_adjuntos').select('ticket_id')
    const aCounts = {}
    ;(ad || []).forEach((a) => { aCounts[a.ticket_id] = (aCounts[a.ticket_id] || 0) + 1 })
    setAttachmentCounts(aCounts)

    setLoadError('')
    setLoading(false)
  }, [])

  useEffect(() => { reload() }, [reload])

  return (
    <>
      <header className="app-header">
        <div className="logo">ITSM <span>DCSM</span></div>
        <nav className="tabs">
          <button className={'tab' + (tab === 'tickets' ? ' active' : '')} onClick={() => setTab('tickets')}>
            Tickets
          </button>
          <button className={'tab' + (tab === 'stats' ? ' active' : '')} onClick={() => setTab('stats')}>
            Estadísticas
          </button>
        </nav>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          {perfil && (
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
              👤 {perfil.nombre}
            </span>
          )}
          <button
            onClick={logout}
            style={{
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff', borderRadius: 8, padding: '6px 14px', fontSize: 13,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {!supabaseConfigured && (
        <div className="container">
          <div className="banner">
            <b>Supabase no está configurado.</b> Revisa las variables de entorno en <code>.env</code>.
          </div>
        </div>
      )}

      {loadError && (
        <div className="container">
          <div className="banner">Error al cargar datos: {loadError}</div>
        </div>
      )}

      {tab === 'tickets'
        ? <TicketsTab tickets={tickets} commentCounts={commentCounts} attachmentCounts={attachmentCounts} loading={loading} reload={reload} perfil={perfil} />
        : <StatsTab tickets={tickets} />}
    </>
  )
}
