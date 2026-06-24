import { createContext, useContext, useEffect, useState } from 'react'
import { sbDcsm } from '../supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null)   // Supabase Auth user
  const [perfil, setPerfil] = useState(null)   // fila de tabla perfiles
  const [loading, setLoading] = useState(true)

  const cargarPerfil = async (authUser) => {
    if (!authUser) { setPerfil(null); return }
    const { data } = await sbDcsm.from('perfiles').select('*').eq('id', authUser.id).single()
    setPerfil(data || null)
  }

  useEffect(() => {
    sbDcsm.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user || null
      setUser(u)
      await cargarPerfil(u)
      setLoading(false)
    })

    const { data: { subscription } } = sbDcsm.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user || null
      setUser(u)
      await cargarPerfil(u)
    })
    return () => subscription.unsubscribe()
  }, [])

  const login = async (email, password) => {
    const { error } = await sbDcsm.auth.signInWithPassword({ email, password })
    return error
  }

  const logout = async () => {
    await sbDcsm.auth.signOut()
    setUser(null)
    setPerfil(null)
  }

  return (
    <AuthContext.Provider value={{ user, perfil, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
