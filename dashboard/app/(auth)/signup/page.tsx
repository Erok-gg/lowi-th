'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail]   = useState('')
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')

    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const data = await res.json()

    if (res.ok) {
      setStatus('success')
    } else {
      setStatus('error')
      setMessage(data.error || 'An error occurred.')
    }
  }

  if (status === 'success') {
    return (
      <div style={{ width: 340 }}>
        <div className="win-panel">
          <div className="win-titlebar">
            <span>✉ Request Received</span>
          </div>
          <div style={{ padding: '20px 18px' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 32 }}>📋</div>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: 6 }}>Access request submitted</div>
                <div style={{ fontSize: 12, color: 'var(--win-text-muted)', lineHeight: 1.5 }}>
                  Your request for <strong>{email}</strong> has been added to the waitlist.
                  An administrator will review it and send you your access code by email.
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: 'var(--win-text-muted)' }}>
                  Requests expire after 30 days if not reviewed.
                </div>
              </div>
            </div>
            <hr className="win-divider" style={{ marginTop: 14 }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <Link href="/login">
                <button className="win-btn win-btn-primary">OK</button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: 320 }}>
      <div className="win-panel">
        <div className="win-titlebar">
          <span>📋 LOWI Admin — Request Access</span>
          <div style={{ display: 'flex', gap: 2 }}>
            <button className="win-titlebar-btn">×</button>
          </div>
        </div>

        <form onSubmit={handleSignup} style={{ padding: '20px 18px 14px' }}>

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14 }}>
            <div style={{ fontSize: 28 }}>🔐</div>
            <div style={{ fontSize: 12, color: 'var(--win-text-muted)', lineHeight: 1.5 }}>
              Access to LOWI Admin is restricted. Submit your email address to request access.
              An administrator will review your request.
            </div>
          </div>

          <hr className="win-divider" />

          <div style={{ marginTop: 12 }}>
            <label className="win-label" htmlFor="email">Email address:</label>
            <input
              id="email"
              type="email"
              className="win-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="your@email.com"
            />
          </div>

          {/* Honeypot — hidden from real users */}
          <input
            type="text"
            name="_trap"
            style={{ display: 'none' }}
            tabIndex={-1}
            autoComplete="off"
          />

          {status === 'error' && (
            <div style={{
              marginTop: 10, padding: '4px 8px',
              background: '#ffc0c0', border: '1px solid var(--win-red)',
              fontSize: 12, color: 'var(--win-red)'
            }}>
              ⚠ {message}
            </div>
          )}

          <hr className="win-divider" style={{ marginTop: 14 }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <Link href="/login" style={{ fontSize: 12, color: 'var(--win-navy)' }}>
              ← Back to login
            </Link>
            <button
              type="submit"
              className="win-btn win-btn-primary"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Please wait...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
