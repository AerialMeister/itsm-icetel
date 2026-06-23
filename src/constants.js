// Catálogos y constantes del portal ITSM Icetel

export const TIPOS = [
  { value: 'evento',                   label: 'Evento',                   color: '#2563eb', icon: 'bell' },
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

export const AREAS = [
  { value: 'energia',             label: 'Energía' },
  { value: 'clima',               label: 'Clima' },
  { value: 'servicios_generales', label: 'Servicios generales' },
]

// Catálogos de ejemplo (se reemplazarán con el detalle real de Icetel)
export const SALAS = ['Sala 1', 'Sala 2', 'Sala 3', 'No aplica']

export const ACTIVOS = ['Activo 1', 'Activo 2', 'Activo 3', 'Instalaciones en general']

// Helpers de etiqueta
export const tipoLabel = (v) => TIPOS.find((t) => t.value === v)?.label ?? v
export const tipoColor = (v) => TIPOS.find((t) => t.value === v)?.color ?? '#64748b'
export const clasifLabel = (v) => CLASIFICACIONES_INCIDENTE.find((c) => c.value === v)?.label ?? v
export const areaLabel = (v) => AREAS.find((a) => a.value === v)?.label ?? (v ?? '—')
