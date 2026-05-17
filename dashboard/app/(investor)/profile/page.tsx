'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Profile = {
  id: string
  email: string
  display_name: string | null
  first_name: string | null
  last_name: string | null
  nationality: string | null
  public_id: string | null
  email_confirmed_at: string | null
}

const NATIONALITIES = [
  'Française', 'Belge', 'Suisse', 'Canadienne', 'Américaine',
  'Britannique', 'Allemande', 'Italienne', 'Espagnole', 'Néerlandaise',
  'Luxembourgeoise', 'Portugaise', 'Polonaise', 'Suédoise', 'Norvégienne',
  'Danoise', 'Finlandaise', 'Australienne', 'Néo-Zélandaise', 'Singapourienne',
  'Japonaise', 'Coréenne', 'Thaïlandaise', 'Autre',
]

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [resendSent, setResendSent] = useState(false)

  // Form state
  const [firstName, setFirstName]   = useState('')
  const [lastName, setLastName]     = useState('')
  const [displayName, setDisplayName] = useState('')
  const [nationality, setNationality] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/invest/login?redirect=/profile')
        return
      }
      fetch('/api/profile')
        .then(r => r.json())
        .then((p: Profile) => {
          setProfile(p)
          setFirstName(p.first_name ?? '')
          setLastName(p.last_name ?? '')
          setDisplayName(p.display_name ?? '')
          setNationality(p.nationality ?? '')
          setLoading(false)
        })
        .catch(() => { setError('Erreur chargement profil'); setLoading(false) })
    })
  }, [router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    setError('')
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, display_name: displayName, nationality }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erreur')
      const updated = await res.json()
      setProfile(p => p ? { ...p, ...updated } : p)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function handleResendVerification() {
    if (!profile?.email) return
    const supabase = createClient()
    await supabase.auth.resend({ type: 'signup', email: profile.email })
    setResendSent(true)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--inv-muted)', fontSize: 14 }}>⏳ Chargement…</div>
      </div>
    )
  }

  const isVerified = !!profile?.email_confirmed_at

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 16px 64px' }}>

      {/* Email non vérifié — bandeau */}
      {!isVerified && (
        <div style={{
          background: '#fffbeb', border: '1px solid #f59e0b',
          borderRadius: 8, padding: '12px 16px',
          marginBottom: 24, fontSize: 13,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
        }}>
          <span style={{ color: '#92400e' }}>
            ⚠️ <strong>Email non vérifié.</strong> Consultez votre boîte mail et cliquez sur le lien de confirmation.
          </span>
          {resendSent ? (
            <span style={{ color: '#15803d', fontSize: 12, fontWeight: 600 }}>✓ Email renvoyé</span>
          ) : (
            <button
              onClick={handleResendVerification}
              style={{
                background: '#f59e0b', color: '#fff', border: 'none',
                borderRadius: 6, padding: '5px 12px', fontSize: 12,
                fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              Renvoyer l&apos;email
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--inv-navy)', marginBottom: 4 }}>
          Mon profil
        </h1>
        {profile?.public_id && (
          <span style={{
            display: 'inline-block', fontSize: 11, fontWeight: 600,
            color: 'var(--inv-muted)', background: 'var(--inv-gray)',
            borderRadius: 4, padding: '2px 8px', letterSpacing: '0.04em',
          }}>
            {profile.public_id}
          </span>
        )}
      </div>

      {/* Email + statut */}
      <div className="inv-card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--inv-muted)', marginBottom: 4 }}>
              Adresse email
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--inv-navy)' }}>
              {profile?.email}
            </div>
          </div>
          <span style={{
            padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
            background: isVerified ? '#d1fae5' : '#fef3c7',
            color: isVerified ? '#065f46' : '#92400e',
          }}>
            {isVerified ? '✓ Vérifié' : '⏳ Non vérifié'}
          </span>
        </div>
      </div>

      {/* Formulaire */}
      <div className="inv-card" style={{ padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--inv-navy)', marginBottom: 20 }}>
          Informations personnelles
        </h2>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="inv-label">Prénom</label>
              <input
                type="text" className="inv-input"
                value={firstName} onChange={e => setFirstName(e.target.value)}
                placeholder="Jean" maxLength={100}
              />
            </div>
            <div>
              <label className="inv-label">Nom</label>
              <input
                type="text" className="inv-input"
                value={lastName} onChange={e => setLastName(e.target.value)}
                placeholder="Dupont" maxLength={100}
              />
            </div>
          </div>

          <div>
            <label className="inv-label">Nom d&apos;affichage <span style={{ color: 'var(--inv-muted)', fontWeight: 400 }}>(optionnel)</span></label>
            <input
              type="text" className="inv-input"
              value={displayName} onChange={e => setDisplayName(e.target.value)}
              placeholder="J. Dupont" maxLength={100}
            />
          </div>

          <div>
            <label className="inv-label">Nationalité</label>
            <select
              className="inv-input"
              value={nationality}
              onChange={e => setNationality(e.target.value)}
              style={{ appearance: 'auto' }}
            >
              <option value="">Sélectionnez…</option>
              {NATIONALITIES.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', background: '#fef2f2',
              border: '1px solid #fecaca', borderRadius: 6,
              fontSize: 13, color: 'var(--inv-red)',
            }}>
              ⚠ {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '10px 14px', background: '#f0fdf4',
              border: '1px solid #bbf7d0', borderRadius: 6,
              fontSize: 13, color: '#166534',
            }}>
              ✓ Profil mis à jour
            </div>
          )}

          <button
            type="submit"
            className="inv-btn inv-btn-gold"
            disabled={saving}
            style={{ padding: '11px', width: '100%' }}
          >
            {saving ? '⏳ Enregistrement…' : 'Enregistrer les modifications'}
          </button>
        </form>
      </div>

      {/* Connexion sociale — UI prête, désactivée */}
      <div className="inv-card" style={{ padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--inv-navy)', marginBottom: 6 }}>
          Connexions sociales
        </h2>
        <p style={{ fontSize: 13, color: 'var(--inv-muted)', marginBottom: 16 }}>
          Liez votre compte à Google ou Facebook pour vous connecter en un clic.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Google */}
          <button
            disabled
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 6,
              border: '1px solid var(--inv-border)',
              background: 'var(--inv-gray)', cursor: 'not-allowed',
              opacity: 0.55, fontSize: 14, fontWeight: 600, color: 'var(--inv-text)',
              fontFamily: 'inherit',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuer avec Google
            <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 500, color: 'var(--inv-muted)' }}>Bientôt disponible</span>
          </button>

          {/* Facebook */}
          <button
            disabled
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 6,
              border: '1px solid var(--inv-border)',
              background: 'var(--inv-gray)', cursor: 'not-allowed',
              opacity: 0.55, fontSize: 14, fontWeight: 600, color: 'var(--inv-text)',
              fontFamily: 'inherit',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Continuer avec Facebook
            <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 500, color: 'var(--inv-muted)' }}>Bientôt disponible</span>
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div style={{ textAlign: 'right' }}>
        <button
          onClick={handleSignOut}
          style={{
            background: 'none', border: '1px solid var(--inv-border)',
            borderRadius: 6, padding: '8px 16px', fontSize: 13,
            color: 'var(--inv-muted)', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Se déconnecter
        </button>
      </div>
    </div>
  )
}
