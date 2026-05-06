'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      router.push('/')
    } else {
      setError('סיסמה שגויה')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4ff' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 48, width: 360, boxShadow: '0 8px 40px rgba(45,106,255,0.10)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f1f3d', margin: 0 }}>AirPak</h1>
          <p style={{ color: '#9baabe', fontSize: 14, marginTop: 6 }}>מערכת ניהול הזמנות</p>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#4a5f80', display: 'block', marginBottom: 6 }}>סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="הכנס סיסמה"
              autoFocus
              required
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e0e9ff', borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box', direction: 'ltr' }}
            />
          </div>
          {error && <p style={{ color: '#e11d48', fontSize: 13, textAlign: 'center', margin: 0 }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{ background: 'linear-gradient(135deg, #2d6aff, #5c8cff)', color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'מתחבר...' : 'כניסה'}
          </button>
        </form>
      </div>
    </div>
  )
}
