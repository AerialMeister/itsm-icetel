import { useState, useEffect, useCallback } from 'react'
import { supabase, supabaseConfigured } from './supabaseClient'
import TicketsTab from './components/TicketsTab'
import StatsTab from './components/StatsTab'

export default function App() {
  const [tab, setTab] = useState('tickets')
  const [tickets, setTickets] = useState([])
  const [commentCounts, setCommentCounts] = useState({})
  const [attachmentCounts, setAttachmentCounts] = useState({})
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

    // Resuelve el nombre ACTUAL de los activos vinculados a la CMDB.
    // Así, si un activo se renombra en la CMDB, el ITSM lo refleja al instante.
    let lista = tk || []
    const ids = [...new Set(lista.map((t) => t.activo_id).filter(Boolean))]
    if (ids.length) {
      try {
        const { data: nombres } = await supabase.rpc('cmdb_asset_names', { p_ids: ids })
        const mapa = {}
        ;(nombres || []).forEach((n) => { mapa[n.id] = n.nombre })
        lista = lista.map((t) =>
          t.activo_id && mapa[t.activo_id] ? { ...t, activo: mapa[t.activo_id] } : t)
      } catch { /* CMDB no disponible: se usa el nombre guardado (snapshot) */ }
    }
    setTickets(lista)

    // Conteo de comentarios por ticket (para el ícono de nota)
    const { data: cm } = await supabase.from('ticket_comentarios').select('ticket_id')
    const counts = {}
    ;(cm || []).forEach((c) => { counts[c.ticket_id] = (counts[c.ticket_id] || 0) + 1 })
    setCommentCounts(counts)

    // Conteo de adjuntos por ticket (para el ícono de clip)
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
        ? <TicketsTab tickets={tickets} commentCounts={commentCounts} attachmentCounts={attachmentCounts} loading={loading} reload={reload} />
        : <StatsTab tickets={tickets} />}
    </>
  )
}
