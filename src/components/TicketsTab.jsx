import { useState, useMemo, useRef } from 'react'
import * as XLSX from 'xlsx-js-style'
import {
  TIPOS, ESPECIALIDADES, JORNADAS,
  CLASIFICACIONES_INCIDENTE, CLASIFICACIONES_EVENTO, CLASIFICACIONES_PROYECTO,
  tipoLabel, tipoColor, clasifLabel, areaLabel, jornadaLabel,
} from '../constants'
import { TIPO_ICONS, IconPencil, IconNote, IconPlus, IconLock, IconClip, IconDownload, IconAlertClock } from './Icons'
import { supabase } from '../supabaseClient'
import TicketForm from './TicketForm'
import CommentsModal from './CommentsModal'
import CloseTicketModal from './CloseTicketModal'
import AttachmentsModal from './AttachmentsModal'

const fmt = (iso) => (iso ? new Date(iso).toLocaleString('es-CL', { hour12: false, dateStyle: 'short', timeStyle: 'short' }) : '—')
const fmtFull = (iso) => (iso ? new Date(iso).toLocaleString('es-CL', { hour12: false }) : '')

// Duración entre dos fechas en formato compacto (ej: "2d 5h 30m")
const fmtDuracion = (inicioIso, cierreIso) => {
  if (!inicioIso || !cierreIso) return ''
  let ms = new Date(cierreIso).getTime() - new Date(inicioIso).getTime()
  if (isNaN(ms) || ms < 0) return ''
  const totalMin = Math.floor(ms / 60000)
  const d = Math.floor(totalMin / 1440)
  const h = Math.floor((totalMin % 1440) / 60)
  const m = totalMin % 60
  const parts = []
  if (d) parts.push(`${d}d`)
  if (h) parts.push(`${h}h`)
  if (m || (!d && !h)) parts.push(`${m}m`)
  return parts.join(' ')
}

// Etiqueta de "tiempo abierto" para la tabla
const tiempoAbierto = (t) => {
  if (t.estado === 'cerrado') return fmtDuracion(t.fecha_inicio, t.fecha_cierre) || '—'
  return 'En curso'
}

// Convierte un valor de celda (texto es-CL, ISO, Date o serial de Excel) a ISO
const parseFecha = (v) => {
  if (v === null || v === undefined || String(v).trim() === '') return null
  if (v instanceof Date) return isNaN(v) ? null : v.toISOString()
  if (typeof v === 'number') {
    const d = new Date(Math.round((v - 25569) * 86400 * 1000)) // serial Excel
    return isNaN(d) ? null : d.toISOString()
  }
  const s = String(v).trim()
  // Formato es-CL: DD-MM-YYYY [HH:mm[:ss]]  (o con /)
  const m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/)
  if (m) {
    const [, dd, mm, yyyy, hh = '0', mi = '0', ss = '0'] = m
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(mi), Number(ss))
    return isNaN(d) ? null : d.toISOString()
  }
  const d = new Date(s) // ISO u otros formatos reconocidos
  return isNaN(d) ? null : d.toISOString()
}

// Mapa etiqueta/valor -> valor (para reimportar desde el Excel exportado)
const revMap = (arr) => {
  const o = {}
  arr.forEach((x) => { o[String(x.label).toLowerCase()] = x.value; o[String(x.value).toLowerCase()] = x.value })
  return o
}
const TIPO_VALUES    = revMap(TIPOS)
const CLASIF_VALUES  = { ...revMap(CLASIFICACIONES_INCIDENTE), ...revMap(CLASIFICACIONES_EVENTO), ...revMap(CLASIFICACIONES_PROYECTO) }
const AREA_VALUES    = revMap(ESPECIALIDADES)
const JORNADA_VALUES = revMap(JORNADAS)
const ESTADO_VALUES  = { abierto: 'abierto', cerrado: 'cerrado' }
const mapVal = (map, cell, def = null) => {
  if (cell === null || cell === undefined || String(cell).trim() === '') return def
  return map[String(cell).trim().toLowerCase()] || def
}

const estaVencido = (ticket) => {
  if (ticket.estado !== 'abierto') return false
  const HORA_MS = 60 * 60 * 1000
  const ref = new Date(ticket.updated_at || ticket.created_at || ticket.fecha_inicio).getTime()
  return (Date.now() - ref) > HORA_MS
}

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

// Modal de confirmación de importación
function ImportConfirmModal({ file, onConfirm, onCancel, loading }) {
  return (
    <div className="modal-overlay">
      <div className="modal modal-sm">
        <div className="modal-head">
          <h3>⚠️ Confirmar importación</h3>
        </div>
        <div className="modal-body">
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            Estás a punto de importar el archivo <b>{file?.name}</b> a la base de datos.
          </p>
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 14px', marginTop: 12, fontSize: 13, color: '#92400e' }}>
            <b>Advertencia:</b> Esta operación ingresará y/o sobreescribirá datos en la base de datos. Los tickets existentes con el mismo código serán actualizados. Los tickets nuevos serán insertados. Esta acción no se puede deshacer fácilmente.
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 13, color: '#64748b' }}>
            ¿Deseas continuar?
          </p>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onCancel} disabled={loading}>Cancelar</button>
          <button className="btn btn-primary" onClick={onConfirm} disabled={loading}
            style={{ background: '#dc2626', borderColor: '#dc2626' }}>
            {loading ? 'Importando…' : 'Sí, importar datos'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TicketsTab({ tickets, commentCounts, attachmentCounts, loading, reload, perfil }) {
  const [showForm, setShowForm] = useState(false)
  const [editTicket, setEditTicket] = useState(null)
  const [commentTicket, setCommentTicket] = useState(null)
  const [attachTicket, setAttachTicket] = useState(null)
  const [closeTicket, setCloseTicket] = useState(null)

  const [search, setSearch] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('')
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('')
  const [scope, setScope] = useState('todos')

  // Importación
  const fileInputRef = useRef(null)
  const [importFile, setImportFile] = useState(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importMsg, setImportMsg] = useState('')

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
      if (filtroFechaDesde) {
        const desde = new Date(filtroFechaDesde)
        if (new Date(t.fecha_inicio) < desde) return false
      }
      if (filtroFechaHasta) {
        const hasta = new Date(filtroFechaHasta)
        hasta.setHours(23, 59, 59)
        if (new Date(t.fecha_inicio) > hasta) return false
      }
      if (search) {
        const s = search.toLowerCase()
        const hay = [t.codigo, t.titulo, t.descripcion, t.activo].filter(Boolean).join(' ').toLowerCase()
        if (!hay.includes(s)) return false
      }
      return true
    })
  }, [tickets, search, filtroTipo, filtroEstado, filtroFechaDesde, filtroFechaHasta, scope])

  const afterSave = () => { setShowForm(false); setEditTicket(null); reload() }
  const afterClose = () => { setCloseTicket(null); reload() }

  // ── Descarga XLSX formateada ──
  const descargarXLSX = () => {
    const AZUL_OSCURO = '0F3D6B'
    const AZUL_MEDIO  = '1D4ED8'
    const GRIS_CLARO  = 'F1F5F9'
    const BLANCO      = 'FFFFFF'

    const headers = ['Código', 'Tipo', 'Clasificación', 'Título', 'Descripción', 'Activo', 'Sistema', 'Especialidad', 'Jornada', 'Ubicación', 'Registrado por', 'Inicio', 'Fin', 'Cierre', 'Tiempo abierto', 'Estado']
    const rows = filtered.map((t) => [
      t.codigo || '',
      tipoLabel(t.tipo_ticket),
      t.clasificacion_incidente ? clasifLabel(t.clasificacion_incidente) : '',
      t.titulo || '',
      t.descripcion || '',
      t.activo || '',
      t.sistema || '',
      t.area ? areaLabel(t.area) : '',
      t.jornada ? jornadaLabel(t.jornada) : '',
      t.ubicacion_activo || '',
      t.registrado_por_nombre || '',
      fmtFull(t.fecha_inicio),
      fmtFull(t.fecha_fin),
      fmtFull(t.fecha_cierre),
      tiempoAbierto(t),
      t.estado === 'abierto' ? 'Abierto' : 'Cerrado',
    ])

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])

    // Anchos de columna
    ws['!cols'] = [
      { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 30 }, { wch: 40 },
      { wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 12 }, { wch: 25 }, { wch: 22 },
      { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 10 },
    ]

    // Estilo encabezado
    const headerStyle = {
      font: { bold: true, color: { rgb: BLANCO }, name: 'Arial', sz: 11 },
      fill: { fgColor: { rgb: AZUL_OSCURO }, patternType: 'solid' },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        top:    { style: 'thin', color: { rgb: BLANCO } },
        bottom: { style: 'thin', color: { rgb: BLANCO } },
        left:   { style: 'thin', color: { rgb: BLANCO } },
        right:  { style: 'thin', color: { rgb: BLANCO } },
      },
    }

    headers.forEach((_, ci) => {
      const cell = XLSX.utils.encode_cell({ r: 0, c: ci })
      if (ws[cell]) ws[cell].s = headerStyle
    })

    // Estilo filas alternas
    rows.forEach((row, ri) => {
      const esPar = ri % 2 === 0
      row.forEach((_, ci) => {
        const cell = XLSX.utils.encode_cell({ r: ri + 1, c: ci })
        if (!ws[cell]) return

        // Color especial para Estado (última columna)
        const esEstado = ci === headers.length - 1
        const val = ws[cell].v
        let fontColor = '0F172A'
        if (esEstado && val === 'Abierto')  fontColor = 'EA580C'
        if (esEstado && val === 'Cerrado')  fontColor = '16A34A'

        ws[cell].s = {
          font: { name: 'Arial', sz: 10, bold: esEstado, color: { rgb: fontColor } },
          fill: { fgColor: { rgb: esPar ? GRIS_CLARO : BLANCO }, patternType: 'solid' },
          alignment: { vertical: 'center', wrapText: ci === 4 },
          border: {
            top:    { style: 'hair', color: { rgb: 'E2E8F0' } },
            bottom: { style: 'hair', color: { rgb: 'E2E8F0' } },
            left:   { style: 'hair', color: { rgb: 'E2E8F0' } },
            right:  { style: 'hair', color: { rgb: 'E2E8F0' } },
          },
        }
      })
    })

    // Fila de totales
    const totalesData = new Array(headers.length).fill('')
    totalesData[0] = `Total: ${rows.length} ticket(s)`
    XLSX.utils.sheet_add_aoa(ws, [totalesData], { origin: { r: rows.length + 1, c: 0 } })
    const totalCell = XLSX.utils.encode_cell({ r: rows.length + 1, c: 0 })
    if (ws[totalCell]) ws[totalCell].s = {
      font: { bold: true, name: 'Arial', sz: 10, color: { rgb: AZUL_MEDIO } },
      fill: { fgColor: { rgb: 'EFF6FF' }, patternType: 'solid' },
    }

    // Altura de fila encabezado
    ws['!rows'] = [{ hpt: 30 }]

    XLSX.utils.book_append_sheet(wb, ws, 'Tickets DCSM')
    XLSX.writeFile(wb, `tickets_dcsm_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  // ── Importación XLSX ──
  const onFileSelected = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setImportFile(f)
    setImportMsg('')
    e.target.value = ''
  }

  const ejecutarImport = async () => {
    if (!importFile) return
    setImportLoading(true)
    setImportMsg('')

    try {
      const buf = await importFile.arrayBuffer()
      const wb  = XLSX.read(buf, { type: 'array', cellDates: true })
      const ws  = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 })

      // Detectar fila de encabezado
      const headerRow = rows[0]
      const codigoIdx = headerRow.findIndex(h => String(h).toLowerCase().includes('código') || String(h).toLowerCase().includes('codigo'))
      if (codigoIdx === -1) throw new Error('No se encontró columna "Código" en el archivo.')

      const low = (h) => String(h).toLowerCase()
      const tipoIdx    = headerRow.findIndex(h => low(h) === 'tipo')
      const clasifIdx  = headerRow.findIndex(h => low(h).includes('clasificación') || low(h).includes('clasificacion'))
      const tituloIdx  = headerRow.findIndex(h => low(h) === 'título' || low(h) === 'titulo')
      const descIdx    = headerRow.findIndex(h => low(h).includes('descripción') || low(h).includes('descripcion'))
      const activoIdx  = headerRow.findIndex(h => low(h) === 'activo')
      const espIdx     = headerRow.findIndex(h => low(h).includes('especialidad'))
      const jornIdx    = headerRow.findIndex(h => low(h).includes('jornada'))
      const regIdx     = headerRow.findIndex(h => low(h).includes('registrado'))
      const inicioIdx  = headerRow.findIndex(h => low(h) === 'inicio' || low(h).includes('fecha inicio') || low(h).includes('fecha de inicio'))
      const finIdx     = headerRow.findIndex(h => low(h) === 'fin' || low(h).includes('fecha fin') || low(h).includes('fecha de fin'))
      const cierreIdx  = headerRow.findIndex(h => low(h) === 'cierre')
      const estadoIdx  = headerRow.findIndex(h => low(h) === 'estado')

      const cell = (row, idx) => (idx >= 0 ? row[idx] : undefined)

      const dataRows = rows.slice(1).filter(r => r[codigoIdx] && String(r[codigoIdx]).trim())

      let insertados = 0
      let actualizados = 0
      let errores = 0

      for (const row of dataRows) {
        const codigo = String(row[codigoIdx]).trim()
        if (!codigo || codigo.startsWith('Total:')) continue

        const payload = {
          codigo,
          tipo_ticket:             mapVal(TIPO_VALUES, cell(row, tipoIdx), 'evento'),
          clasificacion_incidente: mapVal(CLASIF_VALUES, cell(row, clasifIdx)),
          titulo:                  cell(row, tituloIdx) || '',
          descripcion:             cell(row, descIdx) || null,
          activo:                  cell(row, activoIdx) || null,
          area:                    mapVal(AREA_VALUES, cell(row, espIdx)),
          jornada:                 mapVal(JORNADA_VALUES, cell(row, jornIdx)),
          registrado_por_nombre:   cell(row, regIdx) || null,
          fecha_inicio:            parseFecha(cell(row, inicioIdx)),
          fecha_fin:               parseFecha(cell(row, finIdx)),
          fecha_cierre:            parseFecha(cell(row, cierreIdx)),
          estado:                  mapVal(ESTADO_VALUES, cell(row, estadoIdx), 'abierto'),
        }
        // Respeta la regla de la BD: si está abierto, no puede tener fecha de cierre
        if (payload.estado === 'abierto') payload.fecha_cierre = null

        // Verificar si existe por código
        const { data: existe } = await supabase.from('tickets').select('id').eq('codigo', codigo).maybeSingle()

        if (existe) {
          const { error } = await supabase.from('tickets').update(payload).eq('id', existe.id)
          if (error) errores++
          else actualizados++
        } else {
          const { error } = await supabase.from('tickets').insert(payload)
          if (error) errores++
          else insertados++
        }
      }

      setImportFile(null)
      setImportMsg(`✅ Importación completada: ${insertados} insertado(s), ${actualizados} actualizado(s)${errores ? `, ${errores} error(es)` : ''}.`)
      reload()
    } catch (err) {
      setImportMsg(`❌ Error: ${err.message}`)
    }

    setImportLoading(false)
  }

  return (
    <div className="container-fluid">
      <div className="toolbar">
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <IconPlus size={16} /> Ingresar nuevo ticket
        </button>

        <div className="seg">
          <button className={'seg-btn' + (scope === 'hoy' ? ' active' : '')} onClick={() => setScope('hoy')}>Hoy</button>
          <button className={'seg-btn' + (scope === 'todos' ? ' active' : '')} onClick={() => setScope('todos')}>Todos</button>
        </div>

        <input className="search-input" placeholder="Buscar código, título, activo…"
          value={search} onChange={(e) => setSearch(e.target.value)} style={{ minWidth: 200 }} />

        <select className="filter-select" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>

        <select className="filter-select" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="abierto">Abierto</option>
          <option value="cerrado">Cerrado</option>
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Desde</span>
          <input type="date" className="filter-select" value={filtroFechaDesde}
            onChange={(e) => setFiltroFechaDesde(e.target.value)} />
          <span style={{ fontSize: 13, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Hasta</span>
          <input type="date" className="filter-select" value={filtroFechaHasta}
            onChange={(e) => setFiltroFechaHasta(e.target.value)} />
          {(filtroFechaDesde || filtroFechaHasta) && (
            <button className="btn-ghost" style={{ fontSize: 12, color: 'var(--muted)' }}
              onClick={() => { setFiltroFechaDesde(''); setFiltroFechaHasta('') }}>✕</button>
          )}
        </div>

        <div className="spacer" />

        <button className="btn" onClick={descargarXLSX} disabled={filtered.length === 0}
          title="Descargar tickets visibles como Excel (.xlsx)">
          <IconDownload size={16} /> Descargar Excel
        </button>

        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
          onChange={onFileSelected} />
        <button className="btn" onClick={() => fileInputRef.current?.click()}
          title="Importar tickets desde Excel (.xlsx)">
          ↑ Importar Excel
        </button>
      </div>

      {importMsg && (
        <div style={{
          margin: '0 0 12px', padding: '10px 16px', borderRadius: 8, fontSize: 13,
          background: importMsg.startsWith('✅') ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${importMsg.startsWith('✅') ? '#bbf7d0' : '#fecaca'}`,
          color: importMsg.startsWith('✅') ? '#166534' : '#b91c1c',
        }}>
          {importMsg}
        </div>
      )}

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
              <th>Tiempo abierto</th>
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
              const nFiles = attachmentCounts[t.id] || 0
              const vencido = estaVencido(t)
              return (
                <tr key={t.id}>
                  <td className="codigo-cell">{t.codigo || '—'}</td>
                  <td>
                    <span className="tipo-badge" style={{ background: tipoColor(t.tipo_ticket) }}>
                      <Ico size={13} /> {tipoLabel(t.tipo_ticket)}
                    </span>
                    {t.clasificacion_incidente && (
                      <span className="clasif-tag">{clasifLabel(t.clasificacion_incidente)}</span>
                    )}
                  </td>
                  <td>{t.titulo}</td>
                  <td className="desc-cell" title={t.descripcion || ''}>{t.descripcion || '—'}</td>
                  <td>{t.activo || '—'}</td>
                  <td>{fmt(t.fecha_inicio)}</td>
                  <td>{fmt(t.fecha_cierre)}</td>
                  <td>{tiempoAbierto(t)}</td>
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
                        <span title="Ticket abierto hace más de 1 hora sin actividad"
                          style={{ color: '#f59e0b', display: 'inline-flex', alignItems: 'center' }}>
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
      {importFile && (
        <ImportConfirmModal
          file={importFile}
          onConfirm={ejecutarImport}
          onCancel={() => { setImportFile(null) }}
          loading={importLoading}
        />
      )}
    </div>
  )
}
