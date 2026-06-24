import { createClient } from '@supabase/supabase-js'

// Cliente ITSM (base de datos de tickets y CMDB)
const itsmUrl    = import.meta.env.VITE_SUPABASE_URL
const itsmAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!itsmUrl || !itsmAnonKey) {
  console.error('[ITSM] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env')
}

export const supabase = createClient(itsmUrl || 'http://localhost', itsmAnonKey || 'public-anon-key')
export const supabaseConfigured = Boolean(itsmUrl && itsmAnonKey)

// Cliente DCSM (base de datos de autenticación compartida con horas-extra)
const dcsmUrl    = import.meta.env.VITE_DCSM_SUPABASE_URL
const dcsmAnonKey = import.meta.env.VITE_DCSM_SUPABASE_ANON_KEY

if (!dcsmUrl || !dcsmAnonKey) {
  console.error('[DCSM] Faltan VITE_DCSM_SUPABASE_URL o VITE_DCSM_SUPABASE_ANON_KEY en .env')
}

export const sbDcsm = createClient(dcsmUrl || 'http://localhost', dcsmAnonKey || 'public-anon-key', {
  auth: { storageKey: 'dcsm-itsm-auth' }
})
