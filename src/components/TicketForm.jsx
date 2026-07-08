import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../auth/AuthContext'
import {
  TIPOS,
  CLASIFICACIONES_INCIDENTE,
  CLASIFICACIONES_EVENTO,
  CLASIFICACIONES_PROYECTO,
  ESPECIALIDADES,
  JORNADAS,
} from '../constants'
import { TIPO_ICONS, IconX, IconSol, IconLuna } from './Icons'
import { IconRayo, IconClima, IconEdificio, IconSistema, IconOtros } from './SystemIcons'
import AssetPicker from './AssetPicker'
import DateTimePicker from './DateTimePicker'
import { generarCodigo } from '../lib/codigo'

const countWords = (s) => (s.trim() ? s.trim().split(/\s+/).length : 0)
const MAX_TITULO = 20
const MAX_DESC = 200

const SISTEMA_OTROS_ID = '__otros__'

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
  otros:    IconOtros,
}

const JORNADA_ICONS = { sol: IconSol, luna: IconLuna }

export default function TicketForm({ initial, onClose, onSaved }) {
  const { user, perfil } = useAuth()
  const editing = Boolean(initial)

  const [tipo, setTipo]         = useState(initial?.tipo_ticket || '')
  const [clasif, setClasif]     = useState(initial?.clasificacion_incidente || '')
  const [titulo, setTitulo]     = useState(initial?.titulo || '')
  const [descripcion, setDesc]  = useState(initial?.descripcion || '')
  const [activo, setActivo]     = useState({ id: initial?.activo_id || null, nombre: initial?.activo || '' })
  const [especialidad, setEsp]  = useState(initial?.area || '')
  const [jornada, setJornada]   = useState(initial?.jornada || '')
  const [fechaInicio, setFecha] = useState(toLocalInput(initial?.fecha_inicio) || '')
  // Fecha de fin/término: para Proyecto y Mantenimientos se guarda como fecha_cierre
  // (esos tickets nacen cerrados). Se lee de fecha_fin (legado) o fecha_cierre.
  const [fechaFin, setFechaFin] = useState(toLocalInput(initial?.fecha_fin || initial?.fecha_cierre) || '')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  const [sistemas, setSistemas]          = useState([])
  const [selectedSistema, setSelSistema] = useState(null)
  const [grupos, setGrupos]              = useState([])
  const [selectedGrupo, setSelGrupo]     = useState(null)

  const tituloWords = countWords(titulo)
  const descWords   = countWords(descripcion)

  // Banderas según el tipo de ticket
  const esProyecto      = tipo === 'proyecto'
  const esMantenimiento = tipo === 'mantenimiento_preventivo' || tipo === 'mantenimiento_correctivo'
  const mostrarEspecialidad = esProyecto || esMantenimiento
  const mostrarJornada      = esProyecto || esMantenimiento
  // Estos tipos declaran fecha de término inmediatamente (que se usa como cierre)
  const declaraTermino      = esProyecto || esMantenimiento
  // Proyecto reemplaza Sistema/Activo por Especialidad; el resto los mantiene
  const mostrarSistemaActivo = !esProyecto

  useEffect(() => {
    supabase.rpc('cmdb_listar_sistemas').then(({ data }) => setSistemas(data || []))
  }, [])

  useEffect(() => {
    // "Otros" o sin sistema => no se cargan grupos desde la CMDB
    if (!selectedSistema || selectedSistema.id === SISTEMA_OTROS_ID) {
      setGrupos([]); setSelGrupo(null); return
    }
    supabase.rpc('cmdb_listar_tipos', { p_system_id: selectedSistema.id })
      .then(({ data }) => setGrupos(data || []))
    setSelGrupo(null)
    setActivo({ id: null, nombre: '' })
  }, [selectedSistema])

  useEffect(() => {
    setActivo({ id: null, nombre: '' })
  }, [selectedGrupo])

  // Lista de sistemas + opción sintética "Otros"
  const sistemasUI = [
    ...sistemas,
    { id: SISTEMA_OTROS_ID, name: 'Otros', icon: 'otros', slug: '' },
  ]

  const validar = () => {
    if (!tipo) return 'Selecciona el tipo de ticket.'
    if (tipo === 'incidente' && !clasif) return 'Selecciona la clasificación del incidente.'
    if (tipo === 'evento' && !clasif) return 'Selecciona la clasificación del evento.'
    if ((esProyecto || esMantenimiento) && !clasif) return 'Selecciona el nivel de riesgo.'
    if (!titulo.trim()) return 'Ingresa un título.'
    if (tituloWords > MAX_TITULO) return `El título supera las ${MAX_TITULO} palabras.`
    if (descWords > MAX_DESC) return `La descripción supera las ${MAX_DESC} palabras.`
    if (esProyecto && !especialidad) return 'Selecciona la especialidad.'
    if (esProyecto && !jornada) return 'Selecciona la jornada.'
    if (!fechaInicio) return 'Ingresa la fecha y hora de inicio.'
    if (esProyecto && !fechaFin) return 'Ingresa la fecha y hora de fin.'
    if (declaraTermino && fechaFin && fechaInicio && new Date(fechaFin) < new Date(fechaInicio)) {
      return 'La fecha de fin no puede ser anterior a la de inicio.'
    }
    return ''
  }

  const submit = async () => {
    const v = validar()
    if (v) { setError(v); return }
    setError('')
    setSaving(true)

    const payload = {
      tipo_ticket:              tipo,
      clasificacion_incidente:  clasif || null,
      titulo:                   titulo.trim(),
      descripcion:              descripcion.trim() || null,
      sala:                     null,
      activo:                   mostrarSistemaActivo ? (activo?.nombre || null) : null,
      activo_id:                mostrarSistemaActivo ? (activo?.id || null) : null,
      area:                     mostrarEspecialidad ? (especialidad || null) : null,
      jornada:                  mostrarJornada ? (jornada || null) : null,
      fecha_inicio:             new Date(fechaInicio).toISOString(),
      registrado_por:           user?.id || null,
      registrado_por_nombre:    perfil?.nombre || user?.email || null,
    }

    // Proyecto y Mantenimientos: la fecha de término es la fecha de cierre y
    // el ticket nace cerrado (queda como registro/testimonio del trabajo).
    // Para Evento/Incidente no tocamos estado ni cierre (los maneja el flujo normal).
    if (declaraTermino) {
      const cierreISO = fechaFin ? new Date(fechaFin).toISOString() : null
      payload.fecha_cierre = cierreISO
      payload.estado = cierreISO ? 'cerrado' : 'abierto'
    }

    let res
    if (editing) {
      // Al editar no sobreescribimos quién lo registró originalmente
      const { registrado_por, registrado_por_nombre, ...editPayload } = payload
      res = await supabase.from('tickets').update(editPayload).eq('id', initial.id)
    } else {
      // Genera el código y, si justo choca con otro (código duplicado),
      // reintenta: al recalcular tomará el siguiente correlativo libre.
      let intento = 0
      do {
        const codigo = await generarCodigo(supabase, tipo, payload.fecha_inicio)
        res = await supabase.from('tickets').insert({ ...payload, estado: payload.estado || 'abierto', codigo })
        intento++
      } while (
        res.error &&
        /uq_tickets_codigo|duplicate key|23505/i.test(res.error.message || '') &&
        intento < 6
      )
    }

    setSaving(false)
    if (res.error) { setError('Error al guardar: ' + res.error.message); return }
    onSaved()
  }

  // Cambia el tipo y limpia campos que no aplican
  const cambiarTipo = (value) => {
    setTipo(value)
    setClasif('')
    if (value === 'proyecto') {
      // Proyecto no usa Sistema/Activo
      setSelSistema(null); setSelGrupo(null); setActivo({ id: null, nombre: '' })
    }
    if (value === 'evento' || value === 'incidente') {
      setEsp(''); setJornada(''); setFechaFin('')
    }
  }

  return (
    <div className="modal-overlay" >
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
                    onClick={() => cambiarTipo(t.value)}
                  >
                    <span className="tipo-ico"><Ico size={26} /></span>
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Clasificación: Incidente */}
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

          {/* Clasificación: Evento */}
          {tipo === 'evento' && (
            <div className="field">
              <label>Clasificación del evento</label>
              <div className="clasif-grid clasif-grid-2">
                {CLASIFICACIONES_EVENTO.map((c) => (
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

          {/* Clasificación: Proyecto y Mantenimientos (nivel de riesgo, con colores) */}
          {(esProyecto || esMantenimiento) && (
            <div className="field">
              <label>Nivel de riesgo</label>
              <div className="clasif-grid">
                {CLASIFICACIONES_PROYECTO.map((c) => {
                  const sel = clasif === c.value
                  return (
                    <button type="button" key={c.value}
                      className={'clasif-card riesgo-card' + (sel ? ' selected' : '')}
                      style={{ background: c.box, borderColor: c.box, color: c.text }}
                      onClick={() => setClasif(c.value)}
                    >
                      {c.label}
                    </button>
                  )
                })}
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

          {/* Especialidad (Proyecto y Mantenimientos) — reemplaza al Sistema en Proyecto */}
          {mostrarEspecialidad && (
            <div className="field">
              <label>Especialidad</label>
              <div className="clasif-grid">
                {ESPECIALIDADES.map((e) => (
                  <button type="button" key={e.value}
                    className={'clasif-card' + (especialidad === e.value ? ' selected' : '')}
                    onClick={() => setEsp(especialidad === e.value ? '' : e.value)}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Jornada (Proyecto y Mantenimientos) */}
          {mostrarJornada && (
            <div className="field">
              <label>Jornada</label>
              <div className="jornada-grid">
                {JORNADAS.map((j) => {
                  const JIco = JORNADA_ICONS[j.icon]
                  const sel = jornada === j.value
                  return (
                    <button type="button" key={j.value}
                      className={'jornada-card' + (sel ? ` selected ${j.value}` : '')}
                      onClick={() => setJornada(sel ? '' : j.value)}
                    >
                      <span className="tipo-ico"><JIco size={24} /></span>
                      {j.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Sistema (todos menos Proyecto) */}
          {mostrarSistemaActivo && (
            <div className="field">
              <label>Sistema</label>
              {sistemas.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Cargando sistemas…</div>}
              <div className="tipo-grid">
                {sistemasUI.map((s) => {
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
          )}

          {/* Grupo */}
          {mostrarSistemaActivo && selectedSistema && selectedSistema.id !== SISTEMA_OTROS_ID && grupos.length > 0 && (
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
          {mostrarSistemaActivo && (
            <div className="field">
              <label>Activo <span className="hint">(desde la CMDB)</span></label>
              <AssetPicker value={activo} onChange={setActivo}
                sistemaSlug={selectedSistema && selectedSistema.id !== SISTEMA_OTROS_ID ? (selectedSistema?.slug || '') : ''}
                tipoSlug={selectedGrupo?.slug || ''} />
            </div>
          )}

          {/* Fecha y hora de inicio */}
          <div className="field">
            <label>Fecha y hora de inicio</label>
            <DateTimePicker value={fechaInicio} onChange={setFecha} />
          </div>

          {/* Fecha y hora de fin (Proyecto y Mantenimientos) — actúa como cierre */}
          {declaraTermino && (
            <div className="field">
              <label>Fecha y hora de fin <span className="hint">(al indicarla, el ticket queda cerrado)</span></label>
              <DateTimePicker value={fechaFin} onChange={setFechaFin} />
            </div>
          )}

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
