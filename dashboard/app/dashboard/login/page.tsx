'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/app/(public)/_components/LangContext'

// Palette staff dashboard — navy + gold accent
const C = {
  bg:        '#0a1628',      // navy fond
  bgDeep:    '#050b14',
  card:      '#101e34',
  cardLight: '#1a2a44',
  gold:      '#c9a96e',
  goldLight: '#e8d5b0',
  text:      '#f5f5f3',
  muted:     '#8a93a4',
  border:    '#1f2d47',
  red:       '#ef4444',
  redBg:     'rgba(239,68,68,.1)',
  redBdr:    'rgba(239,68,68,.3)',
}

const I18N = {
  fr: {
    loading: 'Chargement…',
    badge: 'Espace staff',
    title: 'Dashboard LOWI',
    subtitle: 'Connexion réservée à l\'équipe',
    email: 'Email',         emailPh: 'staff@lowi.platform',
    password: 'Mot de passe', passwordPh: '••••••••',
    submit: 'Se connecter',
    submitting: 'Connexion en cours…',
    errBad: 'Email ou mot de passe incorrect.',
    backToSite: '← Retour au site',
    requestAccess: 'Demande d\'accès',
    footer: 'Accès restreint · Authentification chiffrée',
  },
  en: {
    loading: 'Loading…',
    badge: 'Staff area',
    title: 'LOWI Dashboard',
    subtitle: 'Team access only',
    email: 'Email',         emailPh: 'staff@lowi.platform',
    password: 'Password',   passwordPh: '••••••••',
    submit: 'Sign in',
    submitting: 'Signing in…',
    errBad: 'Wrong email or password.',
    backToSite: '← Back to site',
    requestAccess: 'Request access',
    footer: 'Restricted access · Encrypted authentication',
  },
  th: {
    loading: 'กำลังโหลด…',
    badge: 'พื้นที่ทีมงาน',
    title: 'แดชบอร์ด LOWI',
    subtitle: 'เฉพาะทีมงานเท่านั้น',
    email: 'อีเมล',          emailPh: 'staff@lowi.platform',
    password: 'รหัสผ่าน',     passwordPh: '••••••••',
    submit: 'เข้าสู่ระบบ',
    submitting: 'กำลังเข้าสู่ระบบ…',
    errBad: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
    backToSite: '← กลับไปเว็บไซต์',
    requestAccess: 'ขอสิทธิ์เข้าถึง',
    footer: 'การเข้าถึงจำกัด · การยืนยันตัวตนแบบเข้ารหัส',
  },
} as const

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { lang } = useLang()
  const t = I18N[lang]

  const raw      = params.get('redirect') ?? ''
  const fallback = '/admin/properties'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Auto-redirect si déjà loggé
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      // Détermine la destination selon rôle
      let dest = '/users'
      const { data: profile } = await supabase
        .from('profiles').select('is_superadmin').eq('id', user.id).single()
      if (profile?.is_superadmin) dest = raw && raw !== '/' ? raw : fallback
      router.replace(dest)
    })
  }, [router, raw])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const supabase = createClient()
    const { error: signErr, data } = await supabase.auth.signInWithPassword({ email, password })

    if (signErr) {
      setError(t.errBad)
      setSubmitting(false)
      return
    }

    // Determine destination — superadmin → admin properties, sinon /users
    let dest = '/users'
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles').select('is_superadmin').eq('id', data.user.id).single()
      if (profile?.is_superadmin) dest = raw && raw !== '/' ? raw : fallback
    }
    router.push(dest)
    router.refresh()
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: C.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: C.muted, fontSize: 13, fontFamily: 'Segoe UI, system-ui, sans-serif',
      }}>
        {t.loading}
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `radial-gradient(ellipse at top, ${C.bgDeep} 0%, ${C.bg} 60%)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32px 16px',
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      color: C.text,
    }}>

      {/* Brand */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          fontSize: 36, fontWeight: 900, letterSpacing: '-1.5px',
          color: C.text, marginBottom: 4, lineHeight: 1,
        }}>
          lowi
        </div>
        <div style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.2em',
          textTransform: 'uppercase', color: C.gold,
        }}>
          {t.badge}
        </div>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 380,
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: '36px 32px',
        boxShadow: '0 24px 48px rgba(0,0,0,.4), 0 0 0 1px rgba(201,169,110,.08)',
      }}>
        <h1 style={{
          fontSize: 20, fontWeight: 700, color: C.text,
          margin: '0 0 4px', textAlign: 'center',
        }}>
          {t.title}
        </h1>
        <p style={{ fontSize: 12, color: C.muted, textAlign: 'center', margin: '0 0 28px' }}>
          {t.subtitle}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 700,
              color: C.muted, marginBottom: 6, letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              {t.email}
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder={t.emailPh} required autoFocus
              style={{
                width: '100%', boxSizing: 'border-box', padding: '11px 14px',
                background: C.bgDeep, color: C.text,
                border: `1.5px solid ${C.border}`, borderRadius: 8,
                fontSize: 14, outline: 'none', fontFamily: 'inherit',
                transition: 'border-color .15s',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = C.gold)}
              onBlur={e => (e.currentTarget.style.borderColor = C.border)}
            />
          </div>

          <div>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 700,
              color: C.muted, marginBottom: 6, letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              {t.password}
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder={t.passwordPh} required minLength={6}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '11px 14px',
                background: C.bgDeep, color: C.text,
                border: `1.5px solid ${C.border}`, borderRadius: 8,
                fontSize: 14, outline: 'none', fontFamily: 'inherit',
                transition: 'border-color .15s',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = C.gold)}
              onBlur={e => (e.currentTarget.style.borderColor = C.border)}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 12px',
              background: C.redBg, border: `1px solid ${C.redBdr}`,
              borderRadius: 8, fontSize: 12, color: C.red,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              ⚠ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%', padding: '12px',
              background: submitting ? C.cardLight : C.gold,
              color: submitting ? C.muted : C.bgDeep,
              border: 'none', borderRadius: 8,
              fontSize: 14, fontWeight: 800, letterSpacing: '0.02em',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'background .15s, transform .1s',
              marginTop: 8,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
            onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = C.goldLight }}
            onMouseLeave={e => { if (!submitting) e.currentTarget.style.background = C.gold }}
          >
            {submitting && <span className="lowi-spinner" />}
            {submitting ? t.submitting : t.submit}
          </button>
        </form>

        {/* Liens secondaires */}
        <div style={{
          marginTop: 24, paddingTop: 18, borderTop: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: 12,
        }}>
          <Link href="/" style={{ color: C.muted, textDecoration: 'none' }}>
            {t.backToSite}
          </Link>
          <Link href="/signup" style={{ color: C.gold, textDecoration: 'none', fontWeight: 600 }}>
            {t.requestAccess}
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 32, fontSize: 11, color: C.muted, textAlign: 'center', letterSpacing: '0.05em' }}>
        {t.footer}
      </div>
    </div>
  )
}

export default function DashboardLoginPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh', background: '#0a1628',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#8a93a4', fontSize: 13, fontFamily: 'Segoe UI, sans-serif',
      }}>
        Loading…
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
