import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from './auth/AuthContext'
import { useAuth } from './auth/AuthContext'
import App from './App'
import Login from './components/Login'
import './styles.css'

function Root() {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f3d6b 0%, #1a5a9a 50%, #0f3d6b 100%)',
    }}>
      <div style={{ color: '#fff', fontSize: 16 }}>Cargando…</div>
    </div>
  )
  return user ? <App /> : <Login />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </React.StrictMode>
)
