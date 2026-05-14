'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const router      = useRouter()
  const params      = useSearchParams()
  const redirect    = params.get('redirect') ?? '/invest/kyc'

  const [mode, setMode]         = useState<'login' | 'signup'>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError('Email ou mot de passe incorrect.'); setLoading(false); return }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
    }

    // External redirect (back to static site) or internal
    if (redirect.startsWith('http')) {
      const dest = new URL(redirect)
      dest.searchParams.set('lowi_session', '1')
      window.location.href = dest.toString()
    } else {
      router.push(redirect)
      router.refresh()
    }
  }

  function fillDemo() {
    setEmail('demo@lowi-invest.com')
    setPassword('demo1234')
  }

  return (
    <div style={{ width: '100%', maxWidth: 420 }}>

      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--inv-navy)', color: 'var(--inv-gold)',
          padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 12,
        }}>
          🏝 Chalok Baan Kao Pool Villa
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--inv-navy)', marginBottom: 4 }}>
          {mode === 'login' ? 'Connectez-vous' : 'Créer un compte'}
        </div>
        <div style={{ fontSize: 14, color: 'var(--inv-muted)' }}>
          {mode === 'login' ? 'Accédez à votre espace investisseur' : 'Rejoignez la plateforme LOWI'}
        </div>
      </div>

      <div className="inv-card" style={{ padding: 28 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="inv-label">Adresse email</label>
            <input type="email" className="inv-input" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" required autoFocus />
          </div>
          <div>
            <label className="inv-label">Mot de passe</label>
            <input type="password" className="inv-input" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'Minimum 6 caractères' : '••••••••'}
              required minLength={6} />
          </div>

          {error && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--inv-radius)', fontSize: 13, color: 'var(--inv-red)' }}>
              ⚠ {error}
            </div>
          )}

          <button type="submit" className="inv-btn inv-btn-gold" disabled={loading} style={{ width: '100%', padding: '12px' }}>
            {loading ? '⏳ Chargement...' : mode === 'login' ? 'Se connecter →' : 'Créer mon compte →'}
          </button>
        </form>

        <hr className="inv-divider" />

        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--inv-muted)' }}>
          {mode === 'login' ? (
            <>Pas encore de compte ?{' '}
              <button onClick={() => setMode('signup')} style={{ background: 'none', border: 'none', color: 'var(--inv-navy)', fontWeight: 600, cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>
                Créer un compte
              </button>
            </>
          ) : (
            <>Déjà inscrit ?{' '}
              <button onClick={() => setMode('login')} style={{ background: 'none', border: 'none', color: 'var(--inv-navy)', fontWeight: 600, cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>
                Se connecter
              </button>
            </>
          )}
        </div>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button onClick={fillDemo} style={{
            background: 'none', border: '1px dashed var(--inv-border)',
            borderRadius: 'var(--inv-radius)', padding: '6px 14px',
            fontSize: 12, color: 'var(--inv-muted)', cursor: 'pointer', width: '100%',
          }}>
            🧪 Remplir avec le compte démo (John Doe)
          </button>
        </div>

        <div style={{
          marginTop: 16, padding: '8px 12px', background: 'var(--inv-gray)',
          borderRadius: 'var(--inv-radius)', fontSize: 11, color: 'var(--inv-muted)', textAlign: 'center',
        }}>
          🔒 Connexion Google et Facebook disponible prochainement
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: 'var(--inv-muted)' }}>
        Vos données sont sécurisées et chiffrées · RGPD compliant
      </div>
    </div>
  )
}

export default function InvestorLoginPage() {
  return (
    <div style={{
      minHeight: 'calc(100vh - 120px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px', background: 'var(--inv-gray)',
    }}>
      <Suspense fallback={<div style={{ color: 'var(--inv-muted)' }}>Chargement...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
