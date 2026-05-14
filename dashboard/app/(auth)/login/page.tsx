'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div style={{ width: 320 }}>
      {/* Window */}
      <div className="win-panel">
        {/* Title bar */}
        <div className="win-titlebar">
          <span>🖥 LOWI Admin — Sign In</span>
          <div style={{ display: 'flex', gap: 2 }}>
            <button className="win-titlebar-btn">_</button>
            <button className="win-titlebar-btn">□</button>
            <button className="win-titlebar-btn">×</button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleLogin} style={{ padding: '20px 18px 14px' }}>

          {/* Icon + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{
              width: 40, height: 40, background: 'var(--win-navy)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, border: '2px solid var(--win-border-dk)'
            }}>🔑</div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 13 }}>LOWI Admin</div>
              <div style={{ fontSize: 11, color: 'var(--win-text-muted)' }}>Enter your credentials to continue</div>
            </div>
          </div>

          <hr className="win-divider" />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            <div>
              <label className="win-label" htmlFor="email">Email address:</label>
              <input
                id="email"
                type="email"
                className="win-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="win-label" htmlFor="password">Password:</label>
              <input
                id="password"
                type="password"
                className="win-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {error && (
            <div style={{
              marginTop: 10, padding: '4px 8px',
              background: '#ffc0c0', border: '1px solid var(--win-red)',
              fontSize: 12, color: 'var(--win-red)'
            }}>
              ⚠ {error}
            </div>
          )}

          <hr className="win-divider" style={{ marginTop: 14 }} />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 10 }}>
            <button
              type="submit"
              className="win-btn win-btn-primary"
              disabled={loading}
            >
              {loading ? 'Please wait...' : 'OK'}
            </button>
            <Link href="/signup">
              <button type="button" className="win-btn">Sign Up</button>
            </Link>
          </div>

        </form>
      </div>

      <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: 'var(--win-text-muted)' }}>
        LOWI Admin v1.0 · Access restricted
      </div>
    </div>
  )
}
