import { useState, useEffect, useCallback } from 'react'
import { supabase, supabaseConfigured } from './supabaseClient'
import TicketsTab from './components/TicketsTab'
import StatsTab from './components/StatsTab'

export default function App() {
  const [tab, setTab] = useState('tickets')
  const [tickets, setTickets] = useState([])
  const [commentCounts, setCommentCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const reload = useCallback(async () => {
    if (!supabaseConfigured) { setLoading(false); return }
    setLoading(true)
    const { data: tk, error } = await supabase
      .from('tickets')
      .select('*')
      .order('fecha_inicio', { ascending: false })

    if (error) { setLoadError(error.message); setLoading(false); return }
    setTickets(tk || [])

    // Conteo de comentarios por ticket (para el ícono de nota)
    const { data: cm } = await supabase.from('ticket_comentarios').select('ticket_id')
    const counts = {}
    ;(cm || []).forEach((c) => { counts[c.ticket_id] = (counts[c.ticket_id] || 0) + 1 })
    setCommentCounts(counts)
    setLoadError('')
    setLoading(false)
  }, [])

  useEffect(() => { reload() }, [reload])

  return (
    <>
      <header className="app-header">
        <div className="logo">ITSM <span>Icetel</span></div>
        <nav className="tabs">
          <button className={'tab' + (tab === 'tickets' ? ' active' : '')} onClick={() => setTab('tickets')}>
            Tickets
          </button>
          <button className={'tab' + (tab === 'stats' ? ' active' : '')} onClick={() => setTab('stats')}>
            Estadísticas
          </button>
        </nav>
      </header>

      {!supabaseConfigured && (
        <div className="container">
          <div className="banner">
            <b>Supabase no está configurado.</b> Crea un archivo <code>.env</code> (ver <code>.env.example</code>)
            con <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code>, y reinicia el servidor.
          </div>
        </div>
      )}

      {loadError && (
        <div className="container">
          <div className="banner">Error al cargar datos: {loadError}</div>
        </div>
      )}

      {tab === 'tickets'
        ? <TicketsTab tickets={tickets} commentCounts={commentCounts} loading={loading} reload={reload} />
        : <StatsTab tickets={tickets} />}
    </>
  )
}
