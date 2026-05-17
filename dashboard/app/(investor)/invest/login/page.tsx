'use client'
import { useState, useEffect, Suspense } from 'react'
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
  const [loading, setLoading]   = useState(true)

  // If already logged in, skip the form and go straight to redirect target
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        if (redirect.startsWith('http')) {
          const dest = new URL(redirect)
          if (dest.hostname.includes('lowi-dashboard')) {
            router.replace(dest.pathname + dest.search)
          } else {
            dest.searchParams.set('lowi_session', '1')
            window.location.href = dest.toString()
          }
        } else {
          router.replace(redirect)
        }
      } else {
        setLoading(false)
      }
    })
  }, [redirect, router])

  if (loading) return <div style={{ textAlign:'center', padding: 40, color:'var(--inv-muted)' }}>⏳ Vérification…</div>

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

    // External redirect (static site) → window.location with lowi_session flag
    // Same-domain redirect → router.push (preserves Supabase session in memory)
    if (redirect.startsWith('http')) {
      const dest = new URL(redirect)
      if (dest.hostname.includes('lowi-dashboard')) {
        // Same dashboard domain — use client-side navigation to keep session alive
        const path = dest.pathname + dest.search
        router.push(path)
      } else {
        // External: static GitHub Pages site — signal auth via lowi_session param
        dest.searchParams.set('lowi_session', '1')
        window.location.href = dest.toString()
      }
    } else {
      router.push(redirect)
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

        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button disabled style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 6,
            border: '1px solid var(--inv-border)',
            background: 'var(--inv-gray)', cursor: 'not-allowed',
            opacity: 0.55, fontSize: 14, fontWeight: 600, color: 'var(--inv-text)',
            fontFamily: 'inherit', width: '100%',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuer avec Google
            <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 500, color: 'var(--inv-muted)' }}>Bientôt</span>
          </button>
          <button disabled style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 6,
            border: '1px solid var(--inv-border)',
            background: 'var(--inv-gray)', cursor: 'not-allowed',
            opacity: 0.55, fontSize: 14, fontWeight: 600, color: 'var(--inv-text)',
            fontFamily: 'inherit', width: '100%',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Continuer avec Facebook
            <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 500, color: 'var(--inv-muted)' }}>Bientôt</span>
          </button>
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
