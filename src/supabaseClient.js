import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Aviso claro en consola si faltan las variables de entorno
if (!url || !anonKey) {
  console.error(
    '[ITSM Icetel] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. ' +
    'Crea un archivo .env (ver .env.example) con los datos de tu proyecto Supabase.'
  )
}

export const supabase = createClient(url || 'http://localhost', anonKey || 'public-anon-key')

// true cuando hay credenciales configuradas
export const supabaseConfigured = Boolean(url && anonKey)
