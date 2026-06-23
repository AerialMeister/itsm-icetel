import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { TIPOS, CLASIFICACIONES_INCIDENTE, AREAS, SALAS } from '../constants'
import { TIPO_ICONS, IconX } from './Icons'
import Combobox from './Combobox'
import AssetPicker from './AssetPicker'
import DateTimePicker from './DateTimePicker'
import { generarCodigo } from '../lib/codigo'

const countWords = (s) => (s.trim() ? s.trim().split(/\s+/).length : 0)
const MAX_TITULO = 20
const MAX_DESC = 100

// Convierte un timestamp ISO a valor para <input datetime-local> (sin zona)
const toLocalInput = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function TicketForm({ initial, onClose, onSaved }) {
  const editing = Boolean(initial)
  const [tipo, setTipo] = useState(initial?.tipo_ticket || '')
  const [clasif, setClasif] = useState(initial?.clasificacion_incidente || '')
  const [titulo, setTitulo] = useState(initial?.titulo || '')
  const [descripcion, setDescripcion] = useState(initial?.descripcion || '')
  const [sala, setSala] = useState(initial?.sala || '')
  const [activo, setActivo] = useState({ id: initial?.activo_id || null, nombre: initial?.activo || '' })
  const [area, setArea] = useState(initial?.area || '')
  const [fechaInicio, setFechaInicio] = useState(toLocalInput(initial?.fecha_inicio) || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const tituloWords = countWords(titulo)
  const descWords = countWords(descripcion)

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
      tipo_ticket: tipo,
      clasificacion_incidente: tipo === 'incidente' ? clasif : null,
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || null,
      sala: sala || null,
      activo: activo?.nombre || null,   // snapshot/historial; el nombre vivo se resuelve al listar
      activo_id: activo?.id || null,    // vínculo estable con la CMDB
      area: area || null,
      fecha_inicio: new Date(fechaInicio).toISOString(),
    }

    let res
    if (editing) {
      // El código se mantiene estable; no se regenera al editar
      res = await supabase.from('tickets').update(payload).eq('id', initial.id)
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
          {/* a. Selector de tipo (4 cajones) */}
          <div className="field">
            <label>Tipo de ticket</label>
            <div className="tipo-grid">
              {TIPOS.map((t) => {
                const Ico = TIPO_ICONS[t.icon]
                const sel = tipo === t.value
                return (
                  <button
                    type="button"
                    key={t.value}
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

          {/* a. Clasificación solo para incidente */}
          {tipo === 'incidente' && (
            <div className="field">
              <label>Clasificación del incidente</label>
              <div className="clasif-grid">
                {CLASIFICACIONES_INCIDENTE.map((c) => (
                  <button
                    type="button"
                    key={c.value}
                    className={'clasif-card' + (clasif === c.value ? ' selected' : '')}
                    onClick={() => setClasif(c.value)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* b. Título */}
          <div className="field">
            <label>Título <span className="hint">({tituloWords}/{MAX_TITULO} palabras)</span></label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className={tituloWords > MAX_TITULO ? 'invalid' : ''}
              placeholder="Ej: Falla de UPS en sala principal"
            />
          </div>

          {/* c. Descripción */}
          <div className="field">
            <label>Descripción <span className="hint">({descWords}/{MAX_DESC} palabras)</span></label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className={descWords > MAX_DESC ? 'invalid' : ''}
              placeholder="Detalle del evento o incidencia…"
            />
          </div>

          {/* d. Sala (combobox con búsqueda) */}
          <div className="field">
            <label>Sala</label>
            <Combobox options={SALAS} value={sala} onChange={setSala} placeholder="Buscar sala…" />
          </div>

          {/* e. Activo (selector contra la CMDB) */}
          <div className="field">
            <label>Activo <span className="hint">(desde la CMDB)</span></label>
            <AssetPicker value={activo} onChange={setActivo} />
          </div>

          {/* f. Área */}
          <div className="field">
            <label>Área</label>
            <select value={area} onChange={(e) => setArea(e.target.value)}>
              <option value="">Selecciona un área…</option>
              {AREAS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>

          {/* g. Fecha y hora de inicio (calendario + hora 24h) */}
          <div className="field">
            <label>Fecha y hora de inicio</label>
            <DateTimePicker value={fechaInicio} onChange={setFechaInicio} />
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
