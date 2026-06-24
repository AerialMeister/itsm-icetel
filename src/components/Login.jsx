import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'

const NEXTSTREAM_SVG = `<svg xmlns="http://www.w3.org/2000/svg" id="Capa_2" viewBox="0 0 558.7 60.5"><defs><style>.st0{fill:#277ffb;}</style></defs><g id="Capa_1-2"><g><polygon class="st0" points="116.4 .8 125.9 .8 154.6 45.9 154.9 45.9 154.9 .8 163.6 .8 163.6 59.6 153.9 59.6 125.4 14.9 125.2 14.9 125.2 59.6 116.4 59.6 116.4 .8"></polygon><path class="st0" d="M171,37.8c0-16.1,9.6-22.8,20.9-22.8s19.9,6.8,19.9,22.1,0,2.4-.2,3.3h-32.4c.7,9.2,5.3,13.4,13.1,13.4s9.5-1.9,11.4-7.1h7.6c-2.6,9.8-10.1,13.7-19,13.7s-21.2-6.9-21.2-22.6M203.7,34.1c-.2-7.6-4.5-12.4-11.9-12.4s-11.8,4-12.5,12.4h24.5,0Z"></path><polygon class="st0" points="229.2 37.5 214.3 15.9 223.6 15.9 233.9 31.3 244.2 15.9 253.6 15.9 238.7 37.5 254.2 59.6 244.8 59.6 233.9 43.7 222.9 59.6 213.7 59.6 229.2 37.5"></polygon><path class="st0" d="M265.3,48.5v-25.9h-7.1v-6.7h7.1V4.9h8.5v11h8.7v6.7h-8.7v24.5c0,4.3,1.4,6.2,6.1,6.2s1.8,0,3.1-.2v6.4c-1.6.4-3.5.7-5.5.7-7.3,0-12.3-3.1-12.3-11.7"></path><path class="st0" d="M288.6,41.8h8.9c.3,6.3,4.5,11.3,14.3,11.3s13.3-3.9,13.3-9.9-4.1-8.2-10.6-9.5l-7.9-1.6c-10-2-16.3-6.7-16.3-15.8s7.8-16.2,21.1-16.2,21.2,6.1,21.2,16.5h-8.9c0-5.6-4.4-9.1-12.5-9.1s-11.9,3.9-11.9,8.8,2.5,7.3,9.5,8.8l7.6,1.5c11.8,2.4,17.8,7.2,17.8,16.6s-9,17.4-22.5,17.4-23.1-7.3-23.1-18.7"></path><path class="st0" d="M345.9,48.5v-25.9h-7.1v-6.7h7.1V4.9h8.5v11h8.7v6.7h-8.7v24.5c0,4.3,1.4,6.2,6.1,6.2s1.8,0,3.1-.2v6.4c-1.6.4-3.5.7-5.5.7-7.3,0-12.3-3.1-12.3-11.7"></path><path class="st0" d="M370.5,15.9h8.5v10.1h.2c1.3-5.1,5.4-10.6,13.4-10.6s2.3,0,3.3.4v7.1c-1.1-.2-2.1-.2-3.2-.2-8.2,0-13.7,5.3-13.7,15.1v21.9h-8.5V15.9Z"></path><path class="st0" d="M399,37.8c0-16.1,9.6-22.8,20.9-22.8s19.9,6.8,19.9,22.1,0,2.4-.2,3.3h-32.4c.7,9.2,5.3,13.4,13.1,13.4s9.5-1.9,11.4-7.1h7.6c-2.6,9.8-10.1,13.7-19,13.7s-21.2-6.9-21.2-22.6M431.7,34.1c-.2-7.6-4.5-12.4-11.9-12.4s-11.8,4-12.5,12.4h24.5,0Z"></path><path class="st0" d="M445,48.2c0-8.4,6.1-11.9,14-12.8l10.9-1.3c4-.5,5.4-1.3,5.4-2.6v-1.2c0-7-3.6-8.8-9.8-8.8s-9.8,1.9-9.8,7.4v1h-8.2v-1.8c0-8.8,6.1-13.1,18.2-13.1s18.1,4.6,18.1,15.2v29.4h-8v-7.1h-.3c-.8,1.7-5,7.9-15.7,7.9s-14.6-3.6-14.6-12.3M461.8,53.8c9.2,0,13.5-5.7,13.5-10.4v-4.8c-.6.9-1.7,1.5-6,2l-8.2,1.1c-5.5.7-7.5,2.6-7.5,6.1s3,6.1,8.2,6.1"></path><path class="st0" d="M540.8,22.2c-6.1,0-10.4,4.3-10.4,12.1v25.3h-8.5v-25.3c0-7.8-3.1-12.1-9.4-12.1s-10.4,4.3-10.4,12.1v25.3h-8.5V15.9h8.5v8.8h.2c.7-3.3,4.9-9.6,13.5-9.6s11.4,2.9,13.5,9.9c1-3.5,5.3-9.9,14.5-9.9s14.9,5,14.9,17.3v27.2h-8.5v-25.3c0-7.8-3-12.1-9.4-12.1"></path><path class="st0" d="M101.1,26.9h-27c-4.7,0-9.3-1.1-13.6-3.2l-21.3-10.6c-3.9-2-8.3-3-12.7-3H0V.8h27c4.7,0,9.4,1.1,13.6,3.2l21.3,10.6c3.9,2,8.3,3,12.7,3h26.6s0,9.4,0,9.4ZM101.1,34.3h-26.6c-4.4,0-8.7-1-12.7-3l-21.3-10.6c-4.2-2.1-8.9-3.2-13.6-3.2H0v9.4h26.6c4.4,0,8.7,1,12.7,3l21.3,10.6c4.2,2.1,8.9,3.2,13.6,3.2h27v-9.4h0ZM101.1,51.1h-26.6c-4.4,0-8.7-1-12.7-3l-21.3-10.6c-4.2-2.1-8.9-3.2-13.6-3.2H0v9.4h26.6c4.4,0,8.7,1,12.7,3l21.3,10.6c4.2,2.1,8.9,3.2,13.6,3.2h27v-9.4ZM37.5,60.5l-12.5-6.2c-4.2-2.1-8.9-3.2-13.6-3.2H0v9.4h37.5ZM63.6.8l12.5,6.2c4.2,2.1,8.9,3.2,13.6,3.2h11.5V.8h-37.5Z"></path></g></g></svg>`

const ICETEL_SRC = 'data:image/png;base64,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'

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
        background: '#fff', borderRadius: 16, padding: '48px 40px', width: '100%', maxWidth: 440,
        boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Logos */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 32 }}>
          <img src={ICETEL_SRC} alt="Icetel" style={{ height: 52, objectFit: 'contain', flexShrink: 0 }} />
          <div style={{ width: 1, height: 44, background: '#e2e8f0', flexShrink: 0 }} />
          <div
            dangerouslySetInnerHTML={{ __html: NEXTSTREAM_SVG }}
            style={{ width: 160, flexShrink: 0, display: 'flex', alignItems: 'center' }}
          />
        </div>

        {/* Título */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: '#0f3d6b', lineHeight: 1.3 }}>
            Sistema de registro de tickets
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 17, fontWeight: 700, color: '#1a5a9a', letterSpacing: 2 }}>
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
