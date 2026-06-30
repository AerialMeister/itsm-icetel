// Catálogos y constantes del portal ITSM Icetel

export const TIPOS = [
  { value: 'evento',                   label: 'Evento',                   color: '#2563eb', icon: 'bell' },
  { value: 'proyecto',                 label: 'Proyecto',                 color: '#14b8a6', icon: 'project' },
  { value: 'mantenimiento_preventivo', label: 'Mant. Preventivo',         color: '#16a34a', icon: 'shield' },
  { value: 'mantenimiento_correctivo', label: 'Mant. Correctivo',         color: '#eab308', icon: 'wrench' },
  { value: 'incidente',                label: 'Incidente',                color: '#dc2626', icon: 'alert' },
]

// Ordenadas de menor a mayor urgencia (izquierda a derecha)
export const CLASIFICACIONES_INCIDENTE = [
  { value: 'averia',     label: 'Avería' },
  { value: 'no_urgente', label: 'No urgente' },
  { value: 'urgente',    label: 'Urgente' },
  { value: 'critico',    label: 'Crítico' },
]

// Clasificación para tickets de tipo Evento
export const CLASIFICACIONES_EVENTO = [
  { value: 'ronda_inspeccion', label: 'Ronda de inspección' },
  { value: 'otros_eventos',    label: 'Otros eventos' },
]

// Clasificación (nivel de riesgo) para tickets de tipo Proyecto.
// box = color de fondo del cajón, text = color de las letras.
export const CLASIFICACIONES_PROYECTO = [
  { value: 'riesgo_alto',  label: 'A (Alto riesgo)',    box: '#dc2626', text: '#ffffff' },
  { value: 'riesgo_medio', label: 'B (Mediano riesgo)', box: '#ea580c', text: '#ffffff' },
  { value: 'riesgo_bajo',  label: 'C (Bajo riesgo)',    box: '#16a34a', text: '#ffffff' },
]

export const AREAS = [
  { value: 'energia',             label: 'Energía' },
  { value: 'clima',               label: 'Clima' },
  { value: 'servicios_generales', label: 'Servicios generales' },
]

// La "Especialidad" usa el mismo catálogo que las áreas (Energía, Clima, Servicios generales)
export const ESPECIALIDADES = AREAS

// Jornada de trabajo para proyectos y mantenimientos
export const JORNADAS = [
  { value: 'diurna',   label: 'Diurna',   icon: 'sol' },
  { value: 'nocturna', label: 'Nocturna', icon: 'luna' },
]

// Catálogos de ejemplo (se reemplazarán con el detalle real de Icetel)
export const SALAS = ['Sala 1', 'Sala 2', 'Sala 3', 'No aplica']

export const ACTIVOS = ['Activo 1', 'Activo 2', 'Activo 3', 'Instalaciones en general']

// Todas las clasificaciones (incidente + evento + proyecto) para resolver etiquetas
const TODAS_CLASIFICACIONES = [
  ...CLASIFICACIONES_INCIDENTE,
  ...CLASIFICACIONES_EVENTO,
  ...CLASIFICACIONES_PROYECTO,
]

// Helpers de etiqueta
export const tipoLabel = (v) => TIPOS.find((t) => t.value === v)?.label ?? v
export const tipoColor = (v) => TIPOS.find((t) => t.value === v)?.color ?? '#64748b'
export const clasifLabel = (v) => TODAS_CLASIFICACIONES.find((c) => c.value === v)?.label ?? v
export const areaLabel = (v) => AREAS.find((a) => a.value === v)?.label ?? (v ?? '—')
export const jornadaLabel = (v) => JORNADAS.find((j) => j.value === v)?.label ?? (v ?? '—')
