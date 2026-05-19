'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/app/(public)/_components/LangContext'

// Palette vitrine — indépendante des tokens inv-*
const C = {
  navy:    '#0a1628',
  gold:    '#c9a96e',
  bg:      '#f9f8f5',
  white:   '#ffffff',
  border:  '#e2e0db',
  text:    '#1a1a1a',
  muted:   '#7c7c7c',
  red:     '#dc2626',
  redbg:   '#fef2f2',
  redbdr:  '#fecaca',
}

const I18N = {
  fr: {
    loading: 'Chargement…',
    tagline: 'Investissement immobilier fractionné',
    titleLogin: 'Connexion',                       titleSignup: 'Créer un compte',
    subLogin: 'Accédez à votre espace investisseur', subSignup: 'Rejoignez la plateforme LOWI',
    email: 'Adresse email',                        emailPh: 'votre@email.com',
    password: 'Mot de passe',                      passwordPhSignup: 'Minimum 6 caractères', passwordPhLogin: '••••••••',
    btnLogin: 'Se connecter →',                    btnSignup: 'Créer mon compte →',
    btnLoading: 'Chargement…',
    errBadCreds: 'Email ou mot de passe incorrect.',
    or: 'ou',
    google: 'Continuer avec Google',               facebook: 'Continuer avec Facebook',
    soon: 'Bientôt',
    noAccount: 'Pas encore de compte ?',           hasAccount: 'Déjà inscrit ?',
    actionSignup: "S'inscrire",                    actionLogin: 'Se connecter',
    footer: 'Données sécurisées et chiffrées · RGPD',
  },
  en: {
    loading: 'Loading…',
    tagline: 'Fractional real estate investment',
    titleLogin: 'Log in',                          titleSignup: 'Create an account',
    subLogin: 'Access your investor dashboard',    subSignup: 'Join the LOWI platform',
    email: 'Email address',                        emailPh: 'you@email.com',
    password: 'Password',                          passwordPhSignup: 'Minimum 6 characters', passwordPhLogin: '••••••••',
    btnLogin: 'Log in →',                          btnSignup: 'Create my account →',
    btnLoading: 'Loading…',
    errBadCreds: 'Wrong email or password.',
    or: 'or',
    google: 'Continue with Google',                facebook: 'Continue with Facebook',
    soon: 'Soon',
    noAccount: 'No account yet?',                  hasAccount: 'Already registered?',
    actionSignup: 'Sign up',                       actionLogin: 'Log in',
    footer: 'Encrypted & secure · GDPR',
  },
  th: {
    loading: 'กำลังโหลด…',
    tagline: 'การลงทุนอสังหาฯ แบบแบ่งส่วน',
    titleLogin: 'เข้าสู่ระบบ',                       titleSignup: 'สร้างบัญชี',
    subLogin: 'เข้าสู่พื้นที่นักลงทุนของคุณ',          subSignup: 'เข้าร่วมแพลตฟอร์ม LOWI',
    email: 'อีเมล',                                  emailPh: 'you@email.com',
    password: 'รหัสผ่าน',                            passwordPhSignup: 'ขั้นต่ำ 6 ตัวอักษร', passwordPhLogin: '••••••••',
    btnLogin: 'เข้าสู่ระบบ →',                       btnSignup: 'สร้างบัญชี →',
    btnLoading: 'กำลังโหลด…',
    errBadCreds: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
    or: 'หรือ',
    google: 'ดำเนินการต่อด้วย Google',               facebook: 'ดำเนินการต่อด้วย Facebook',
    soon: 'เร็วๆ นี้',
    noAccount: 'ยังไม่มีบัญชี?',                     hasAccount: 'มีบัญชีแล้ว?',
    actionSignup: 'สมัคร',                          actionLogin: 'เข้าสู่ระบบ',
    footer: 'ข้อมูลปลอดภัยและเข้ารหัส · GDPR',
  },
} as const

function LoginForm() {
  const router  = useRouter()
  const params  = useSearchParams()
  const { lang } = useLang()
  const t = I18N[lang]

  const raw      = params.get('redirect') ?? ''
  const redirect = !raw || raw === '/' ? '/profile' : raw

  const [mode,     setMode]     = useState<'login' | 'signup'>('login')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace(redirect.startsWith('http') ? '/' : redirect)
      } else {
        setLoading(false)
      }
    })
  }, [redirect, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(t.errBadCreds); setLoading(false); return }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
    }

    router.push(redirect.startsWith('http') ? '/profile' : redirect)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 13, color: C.muted }}>{t.loading}</div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32px 16px',
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    }}>

      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-1px', color: C.navy, marginBottom: 6 }}>
          lowi
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.gold }}>
          {t.tagline}
        </div>
      </div>

      <div style={{
        width: '100%', maxWidth: 400,
        background: C.white, border: `1px solid ${C.border}`,
        borderRadius: 14, padding: '36px 32px',
        boxShadow: '0 4px 24px rgba(10,22,40,.07)',
      }}>
        <h1 style={{ fontSize: 19, fontWeight: 700, color: C.navy, margin: '0 0 4px', textAlign: 'center' }}>
          {mode === 'login' ? t.titleLogin : t.titleSignup}
        </h1>
        <p style={{ fontSize: 13, color: C.muted, textAlign: 'center', margin: '0 0 28px' }}>
          {mode === 'login' ? t.subLogin : t.subSignup}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6, letterSpacing: '0.03em' }}>
              {t.email}
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder={t.emailPh} required autoFocus
              style={{
                width: '100%', boxSizing: 'border-box', padding: '10px 12px',
                border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 14,
                color: C.text, background: C.white, outline: 'none', fontFamily: 'inherit',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6, letterSpacing: '0.03em' }}>
              {t.password}
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? t.passwordPhSignup : t.passwordPhLogin}
              required minLength={6}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '10px 12px',
                border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 14,
                color: C.text, background: C.white, outline: 'none', fontFamily: 'inherit',
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 12px',
              background: C.redbg, border: `1px solid ${C.redbdr}`,
              borderRadius: 8, fontSize: 13, color: C.red,
            }}>{error}</div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '12px',
              background: loading ? '#6b7280' : C.navy,
              color: '#fff', border: 'none',
              borderRadius: 8, fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'opacity .15s', marginTop: 4,
            }}
          >
            {loading ? t.btnLoading : mode === 'login' ? t.btnLogin : t.btnSignup}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{t.or}</span>
          <div style={{ flex: 1, height: 1, background: C.border }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: t.google, icon: (
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )},
            { label: t.facebook, icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            )},
          ].map(({ label, icon }) => (
            <button key={label} disabled style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 14px', borderRadius: 8, border: `1px solid ${C.border}`,
              background: C.bg, cursor: 'not-allowed', opacity: 0.6,
              fontSize: 13, fontWeight: 500, color: C.text, fontFamily: 'inherit', width: '100%',
            }}>
              {icon}
              {label}
              <span style={{ marginLeft: 'auto', fontSize: 10, color: C.muted }}>{t.soon}</span>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: C.muted }}>
          {mode === 'login' ? (
            <>{t.noAccount}{' '}
              <button onClick={() => { setMode('signup'); setError('') }} style={{
                background: 'none', border: 'none', color: C.navy,
                fontWeight: 600, cursor: 'pointer', fontSize: 13,
                padding: 0, fontFamily: 'inherit',
              }}>{t.actionSignup}</button>
            </>
          ) : (
            <>{t.hasAccount}{' '}
              <button onClick={() => { setMode('login'); setError('') }} style={{
                background: 'none', border: 'none', color: C.navy,
                fontWeight: 600, cursor: 'pointer', fontSize: 13,
                padding: 0, fontFamily: 'inherit',
              }}>{t.actionLogin}</button>
            </>
          )}
        </div>
      </div>

      <div style={{ marginTop: 28, fontSize: 11, color: C.muted, textAlign: 'center' }}>
        {t.footer}
      </div>
    </div>
  )
}

export default function InvestorLoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#f9f8f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 13, color: '#7c7c7c' }}>Loading…</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
