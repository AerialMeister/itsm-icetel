import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../auth/AuthContext'
import { TIPOS, CLASIFICACIONES_INCIDENTE } from '../constants'
import { TIPO_ICONS, IconX } from './Icons'
import { IconRayo, IconClima, IconEdificio, IconSistema } from './SystemIcons'
import AssetPicker from './AssetPicker'
import DateTimePicker from './DateTimePicker'
import { generarCodigo } from '../lib/codigo'

const countWords = (s) => (s.trim() ? s.trim().split(/\s+/).length : 0)
const MAX_TITULO = 20
const MAX_DESC = 100

const toLocalInput = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const SYSTEM_ICONS = {
  rayo:     IconRayo,
  clima:    IconClima,
  edificio: IconEdificio,
  sistema:  IconSistema,
}

export default function TicketForm({ initial, onClose, onSaved }) {
  const { user, perfil } = useAuth()
  const editing = Boolean(initial)

  const [tipo, setTipo]         = useState(initial?.tipo_ticket || '')
  const [clasif, setClasif]     = useState(initial?.clasificacion_incidente || '')
  const [titulo, setTitulo]     = useState(initial?.titulo || '')
  const [descripcion, setDesc]  = useState(initial?.descripcion || '')
  const [activo, setActivo]     = useState({ id: initial?.activo_id || null, nombre: initial?.activo || '' })
  const [fechaInicio, setFecha] = useState(toLocalInput(initial?.fecha_inicio) || '')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  const [sistemas, setSistemas]          = useState([])
  const [selectedSistema, setSelSistema] = useState(null)
  const [grupos, setGrupos]              = useState([])
  const [selectedGrupo, setSelGrupo]     = useState(null)

  const tituloWords = countWords(titulo)
  const descWords   = countWords(descripcion)

  useEffect(() => {
    supabase.rpc('cmdb_listar_sistemas').then(({ data }) => setSistemas(data || []))
  }, [])

  useEffect(() => {
    if (!selectedSistema) { setGrupos([]); setSelGrupo(null); return }
    supabase.rpc('cmdb_listar_tipos', { p_system_id: selectedSistema.id })
      .then(({ data }) => setGrupos(data || []))
    setSelGrupo(null)
    setActivo({ id: null, nombre: '' })
  }, [selectedSistema])

  useEffect(() => {
    setActivo({ id: null, nombre: '' })
  }, [selectedGrupo])

  const validar = () => {
    if (!tipo) return 'Selecciona el tipo de ticket.'
    if (tipo === 'incidente' && !clasif) return 'Selecciona la clasificación del incidente.'
    if (!titulo.trim()) return 'Ingresa un título.'
    if (tituloWords > MAX_TITULO) return `El título supera las ${MAX_TITULO} palabras.`
    if (descWords > MAX_DESC) return `La descripción supera las ${MAX_DESC} palabras.`
    if (!fechaInicio) return 'Ingresa la fecha y hora de inicio.'
    return ''
  }

  const submit = async () => {
    const v = validar()
    if (v) { setError(v); return }
    setError('')
    setSaving(true)

    const payload = {
      tipo_ticket:              tipo,
      clasificacion_incidente:  tipo === 'incidente' ? clasif : null,
      titulo:                   titulo.trim(),
      descripcion:              descripcion.trim() || null,
      sala:                     null,
      activo:                   activo?.nombre || null,
      activo_id:                activo?.id || null,
      area:                     null,
      fecha_inicio:             new Date(fechaInicio).toISOString(),
      registrado_por:           user?.id || null,
      registrado_por_nombre:    perfil?.nombre || user?.email || null,
    }

    let res
    if (editing) {
      // Al editar no sobreescribimos quién lo registró originalmente
      const { registrado_por, registrado_por_nombre, ...editPayload } = payload
      res = await supabase.from('tickets').update(editPayload).eq('id', initial.id)
    } else {
      const codigo = await generarCodigo(supabase, tipo, payload.fecha_inicio)
      res = await supabase.from('tickets').insert({ ...payload, estado: 'abierto', codigo })
    }

    setSaving(false)
    if (res.error) { setError('Error al guardar: ' + res.error.message); return }
    onSaved()
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-head">
          <h3>{editing ? 'Editar ticket' : 'Ingresar nuevo ticket'}</h3>
          <button className="btn-ghost" onClick={onClose}><IconX /></button>
        </div>

        <div className="modal-body">

          {/* Tipo de ticket */}
          <div className="field">
            <label>Tipo de ticket</label>
            <div className="tipo-grid">
              {TIPOS.map((t) => {
                const Ico = TIPO_ICONS[t.icon]
                const sel = tipo === t.value
                return (
                  <button type="button" key={t.value}
                    className={'tipo-card' + (sel ? ' selected' : '')}
                    style={sel ? { background: t.color, borderColor: t.color } : { color: t.color }}
                    onClick={() => { setTipo(t.value); if (t.value !== 'incidente') setClasif('') }}
                  >
                    <span className="tipo-ico"><Ico size={26} /></span>
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Clasificación (solo incidente) */}
          {tipo === 'incidente' && (
            <div className="field">
              <label>Clasificación del incidente</label>
              <div className="clasif-grid">
                {CLASIFICACIONES_INCIDENTE.map((c) => (
                  <button type="button" key={c.value}
                    className={'clasif-card' + (clasif === c.value ? ' selected' : '')}
                    onClick={() => setClasif(c.value)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Título */}
          <div className="field">
            <label>Título <span className="hint">({tituloWords}/{MAX_TITULO} palabras)</span></label>
            <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)}
              className={tituloWords > MAX_TITULO ? 'invalid' : ''}
              placeholder="Ej: Falla de UPS en sala principal" />
          </div>

          {/* Descripción */}
          <div className="field">
            <label>Descripción <span className="hint">({descWords}/{MAX_DESC} palabras)</span></label>
            <textarea value={descripcion} onChange={(e) => setDesc(e.target.value)}
              className={descWords > MAX_DESC ? 'invalid' : ''}
              placeholder="Detalle del evento o incidencia…" />
          </div>

          {/* Sistema */}
          <div className="field">
            <label>Sistema</label>
            {sistemas.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Cargando sistemas…</div>}
            <div className="tipo-grid">
              {sistemas.map((s) => {
                const Ico = SYSTEM_ICONS[s.icon] || IconSistema
                const sel = selectedSistema?.id === s.id
                return (
                  <button type="button" key={s.id}
                    className={'tipo-card' + (sel ? ' selected' : '')}
                    style={sel ? { background: '#475569', borderColor: '#475569' } : {}}
                    onClick={() => setSelSistema(sel ? null : s)}
                  >
                    <span className="tipo-ico"><Ico size={26} /></span>
                    {s.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Grupo */}
          {selectedSistema && grupos.length > 0 && (
            <div className="field">
              <label>Grupo</label>
              <div className="clasif-grid">
                {grupos.map((g) => (
                  <button type="button" key={g.id}
                    className={'clasif-card' + (selectedGrupo?.id === g.id ? ' selected' : '')}
                    onClick={() => setSelGrupo(selectedGrupo?.id === g.id ? null : g)}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Activo */}
          <div className="field">
            <label>Activo <span className="hint">(desde la CMDB)</span></label>
            <AssetPicker value={activo} onChange={setActivo}
              sistemaSlug={selectedSistema?.slug || ''}
              tipoSlug={selectedGrupo?.slug || ''} />
          </div>

          {/* Fecha y hora */}
          <div className="field">
            <label>Fecha y hora de inicio</label>
            <DateTimePicker value={fechaInicio} onChange={setFecha} />
          </div>

          {error && <div className="error-text">{error}</div>}
        </div>

        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? 'Guardando…' : (editing ? 'Guardar cambios' : 'Crear ticket')}
          </button>
        </div>
      </div>
    </div>
  )
}
