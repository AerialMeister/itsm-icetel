// Íconos de sistemas (mismos que la CMDB) para el selector del formulario de ticket
const S = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }

export const IconRayo     = (p) => <svg {...S} {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></svg>
export const IconClima    = (p) => <svg {...S} {...p}><rect x="2" y="4" width="20" height="9" rx="2"/><path d="M6 17v2M10 17v3M14 17v2M18 17v3"/></svg>
export const IconEdificio = (p) => <svg {...S} {...p}><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h.01M12 7h.01M15 7h.01M9 11h.01M12 11h.01M15 11h.01M10 21v-4h4v4"/></svg>
export const IconSistema  = (p) => <svg {...S} {...p}><rect x="3" y="4" width="18" height="6" rx="1"/><rect x="3" y="14" width="18" height="6" rx="1"/><path d="M7 7h.01M7 17h.01"/></svg>
