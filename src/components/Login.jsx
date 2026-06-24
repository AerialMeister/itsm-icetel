import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'

const ICETEL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 550 200" width="140" height="50">
  <rect x="40" y="40" width="380" height="120" rx="8" fill="#2d4a9e"/>
  <text x="230" y="125" font-family="Arial Black,Arial,sans-serif" font-size="72" font-weight="900" fill="white" text-anchor="middle" letter-spacing="8">ICETEL</text>
  <ellipse cx="230" cy="100" rx="210" ry="85" fill="none" stroke="#c0392b" stroke-width="22" transform="rotate(-20 230 100)"/>
</svg>`

const NEXTSTREAM_SVG = `<svg xmlns="http://www.w3.org/2000/svg" id="Capa_2" viewBox="0 0 558.7 60.5"><defs><style>.st0{fill:#277ffb;}</style></defs><g id="Capa_1-2"><g><polygon class="st0" points="116.4 .8 125.9 .8 154.6 45.9 154.9 45.9 154.9 .8 163.6 .8 163.6 59.6 153.9 59.6 125.4 14.9 125.2 14.9 125.2 59.6 116.4 59.6 116.4 .8"></polygon><path class="st0" d="M171,37.8c0-16.1,9.6-22.8,20.9-22.8s19.9,6.8,19.9,22.1,0,2.4-.2,3.3h-32.4c.7,9.2,5.3,13.4,13.1,13.4s9.5-1.9,11.4-7.1h7.6c-2.6,9.8-10.1,13.7-19,13.7s-21.2-6.9-21.2-22.6M203.7,34.1c-.2-7.6-4.5-12.4-11.9-12.4s-11.8,4-12.5,12.4h24.5,0Z"></path><polygon class="st0" points="229.2 37.5 214.3 15.9 223.6 15.9 233.9 31.3 244.2 15.9 253.6 15.9 238.7 37.5 254.2 59.6 244.8 59.6 233.9 43.7 222.9 59.6 213.7 59.6 229.2 37.5"></polygon><path class="st0" d="M265.3,48.5v-25.9h-7.1v-6.7h7.1V4.9h8.5v11h8.7v6.7h-8.7v24.5c0,4.3,1.4,6.2,6.1,6.2s1.8,0,3.1-.2v6.4c-1.6.4-3.5.7-5.5.7-7.3,0-12.3-3.1-12.3-11.7"></path><path class="st0" d="M288.6,41.8h8.9c.3,6.3,4.5,11.3,14.3,11.3s13.3-3.9,13.3-9.9-4.1-8.2-10.6-9.5l-7.9-1.6c-10-2-16.3-6.7-16.3-15.8s7.8-16.2,21.1-16.2,21.2,6.1,21.2,16.5h-8.9c0-5.6-4.4-9.1-12.5-9.1s-11.9,3.9-11.9,8.8,2.5,7.3,9.5,8.8l7.6,1.5c11.8,2.4,17.8,7.2,17.8,16.6s-9,17.4-22.5,17.4-23.1-7.3-23.1-18.7"></path><path class="st0" d="M345.9,48.5v-25.9h-7.1v-6.7h7.1V4.9h8.5v11h8.7v6.7h-8.7v24.5c0,4.3,1.4,6.2,6.1,6.2s1.8,0,3.1-.2v6.4c-1.6.4-3.5.7-5.5.7-7.3,0-12.3-3.1-12.3-11.7"></path><path class="st0" d="M370.5,15.9h8.5v10.1h.2c1.3-5.1,5.4-10.6,13.4-10.6s2.3,0,3.3.4v7.1c-1.1-.2-2.1-.2-3.2-.2-8.2,0-13.7,5.3-13.7,15.1v21.9h-8.5V15.9Z"></path><path class="st0" d="M399,37.8c0-16.1,9.6-22.8,20.9-22.8s19.9,6.8,19.9,22.1,0,2.4-.2,3.3h-32.4c.7,9.2,5.3,13.4,13.1,13.4s9.5-1.9,11.4-7.1h7.6c-2.6,9.8-10.1,13.7-19,13.7s-21.2-6.9-21.2-22.6M431.7,34.1c-.2-7.6-4.5-12.4-11.9-12.4s-11.8,4-12.5,12.4h24.5,0Z"></path><path class="st0" d="M445,48.2c0-8.4,6.1-11.9,14-12.8l10.9-1.3c4-.5,5.4-1.3,5.4-2.6v-1.2c0-7-3.6-8.8-9.8-8.8s-9.8,1.9-9.8,7.4v1h-8.2v-1.8c0-8.8,6.1-13.1,18.2-13.1s18.1,4.6,18.1,15.2v29.4h-8v-7.1h-.3c-.8,1.7-5,7.9-15.7,7.9s-14.6-3.6-14.6-12.3M461.8,53.8c9.2,0,13.5-5.7,13.5-10.4v-4.8c-.6.9-1.7,1.5-6,2l-8.2,1.1c-5.5.7-7.5,2.6-7.5,6.1s3,6.1,8.2,6.1"></path><path class="st0" d="M540.8,22.2c-6.1,0-10.4,4.3-10.4,12.1v25.3h-8.5v-25.3c0-7.8-3.1-12.1-9.4-12.1s-10.4,4.3-10.4,12.1v25.3h-8.5V15.9h8.5v8.8h.2c.7-3.3,4.9-9.6,13.5-9.6s11.4,2.9,13.5,9.9c1-3.5,5.3-9.9,14.5-9.9s14.9,5,14.9,17.3v27.2h-8.5v-25.3c0-7.8-3-12.1-9.4-12.1"></path><path class="st0" d="M101.1,26.9h-27c-4.7,0-9.3-1.1-13.6-3.2l-21.3-10.6c-3.9-2-8.3-3-12.7-3H0V.8h27c4.7,0,9.4,1.1,13.6,3.2l21.3,10.6c3.9,2,8.3,3,12.7,3h26.6s0,9.4,0,9.4ZM101.1,34.3h-26.6c-4.4,0-8.7-1-12.7-3l-21.3-10.6c-4.2-2.1-8.9-3.2-13.6-3.2H0v9.4h26.6c4.4,0,8.7,1,12.7,3l21.3,10.6c4.2,2.1,8.9,3.2,13.6,3.2h27v-9.4h0ZM101.1,51.1h-26.6c-4.4,0-8.7-1-12.7-3l-21.3-10.6c-4.2-2.1-8.9-3.2-13.6-3.2H0v9.4h26.6c4.4,0,8.7,1,12.7,3l21.3,10.6c4.2,2.1,8.9,3.2,13.6,3.2h27v-9.4ZM37.5,60.5l-12.5-6.2c-4.2-2.1-8.9-3.2-13.6-3.2H0v9.4h37.5ZM63.6.8l12.5,6.2c4.2,2.1,8.9,3.2,13.6,3.2h11.5V.8h-37.5Z"></path></g></g></svg>`

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const submit = async () => {
    if (!email || !password) { setError('Ingresa tu correo y contraseña.'); return }
    setError('')
    setLoading(true)
    const err = await login(email, password)
    setLoading(false)
    if (err) setError('Credenciales incorrectas. Verifica tu correo y contraseña.')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f3d6b 0%, #1a5a9a 50%, #0f3d6b 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '48px 40px', width: '100%', maxWidth: 420,
        boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Logos */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 32 }}>
          <div dangerouslySetInnerHTML={{ __html: ICETEL_SVG }} style={{ width: 100, flexShrink: 0 }} />
          <div style={{ width: 1, height: 40, background: '#e2e8f0' }} />
          <div dangerouslySetInnerHTML={{ __html: NEXTSTREAM_SVG }} style={{ width: 140, flexShrink: 0 }} />
        </div>

        {/* Título */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f3d6b', lineHeight: 1.3 }}>
            Sistema de registro de tickets
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 16, fontWeight: 600, color: '#1a5a9a', letterSpacing: 1 }}>
            DCSM
          </p>
        </div>

        {/* Formulario */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="usuario@empresa.cl"
              style={{
                width: '100%', border: '1px solid #d1d5db', borderRadius: 8,
                padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="••••••••"
              style={{
                width: '100%', border: '1px solid #d1d5db', borderRadius: 8,
                padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#b91c1c' }}>
              {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading}
            style={{
              background: '#0f3d6b', color: '#fff', border: 'none', borderRadius: 8,
              padding: '12px', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, marginTop: 4, fontFamily: 'inherit',
            }}
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </div>
      </div>
    </div>
  )
}
