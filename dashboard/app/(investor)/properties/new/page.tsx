'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ── Constantes (alignées avec lib/validation.ts) ─────────────────────────────
const TYPES = [
  { value: 'villa',          label: 'Villa' },
  { value: 'condo',          label: 'Condominium' },
  { value: 'hotel',          label: 'Hôtel / Resort' },
  { value: 'bungalow',       label: 'Bungalow' },
  { value: 'eco-resort',     label: 'Éco-resort' },
  { value: 'co-living',      label: 'Co-living' },
  { value: 'boutique-hotel', label: 'Boutique Hotel' },
  { value: 'land',           label: 'Terrain' },
  { value: 'other',          label: 'Autre' },
]

const POOL_TYPES = [
  { value: '',         label: '—' },
  { value: 'private',  label: 'Privée' },
  { value: 'shared',   label: 'Partagée' },
  { value: 'none',     label: 'Aucune' },
]

const COUNTRIES = [
  { value: 'TH',    label: '🇹🇭 Thaïlande' },
  { value: 'FR',    label: '🇫🇷 France' },
  { value: 'PT',    label: '🇵🇹 Portugal' },
  { value: 'ES',    label: '🇪🇸 Espagne' },
  { value: 'MA',    label: '🇲🇦 Maroc' },
  { value: 'OTHER', label: 'Autre' },
]

// ── UI helpers ───────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid var(--inv-border)',
  borderRadius: 8,
  padding: 22,
  marginBottom: 16,
}
const sectionHeader: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  cursor: 'pointer',
  userSelect: 'none' as const,
}
const sectionTitle: React.CSSProperties = {
  fontSize: 15, fontWeight: 700, color: 'var(--inv-navy)',
  margin: 0, display: 'flex', alignItems: 'center', gap: 8,
}
const reqStar: React.CSSProperties = { color: '#dc2626', marginLeft: 2 }
const subLabel: React.CSSProperties = {
  fontSize: 12, color: 'var(--inv-muted)', marginTop: 4,
}
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }
const grid3: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }

// ── Section avec collapse ────────────────────────────────────────────────────
function Section({
  title, badge, hint, children, defaultOpen = true,
}: {
  title: string
  badge?: string
  hint?: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="inv-card" style={card}>
      <div style={sectionHeader} onClick={() => setOpen(o => !o)}>
        <h2 style={sectionTitle}>
          {title}
          {badge && (
            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', background: '#f3f4f6', color: 'var(--inv-muted)', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {badge}
            </span>
          )}
        </h2>
        <span style={{ fontSize: 13, color: 'var(--inv-muted)', transition: 'transform .15s', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▾</span>
      </div>
      {hint && open && <p style={{ ...subLabel, marginTop: 6, marginBottom: 0 }}>{hint}</p>}
      {open && <div style={{ marginTop: 18 }}>{children}</div>}
    </div>
  )
}

function Required() { return <span style={reqStar}>*</span> }

// ── Page principale ──────────────────────────────────────────────────────────
export default function NewPropertyPage() {
  const router = useRouter()

  // Email verification check
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [resending, setResending] = useState(false)
  const [resendOk, setResendOk] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/invest/login?redirect=/properties/new'); return }
      setEmailVerified(!!user.email_confirmed_at)
      setUserEmail(user.email ?? '')
    })
  }, [router])

  // Required
  const [title, setTitle]               = useState('')
  const [type, setType]                 = useState('')
  const [country, setCountry]           = useState('TH')
  const [city, setCity]                 = useState('')
  const [value, setValue]               = useState('')
  const [surface, setSurface]           = useState('')
  const [bedrooms, setBedrooms]         = useState('')
  const [description, setDescription]   = useState('')
  const [email, setEmail]               = useState('')

  // Optional — characteristics
  const [bathrooms, setBathrooms]       = useState('')
  const [poolType, setPoolType]         = useState('')
  const [viewDesc, setViewDesc]         = useState('')

  // Optional — situation
  const [beach, setBeach]               = useState('')
  const [airport, setAirport]           = useState('')
  const [hospital, setHospital]         = useState('')

  // Optional — lease
  const [leaseYears, setLeaseYears]                 = useState('')
  const [leaseRemainingYears, setLeaseRemainingYears] = useState('')
  const [leaseExpiryYear, setLeaseExpiryYear]       = useState('')

  // Optional — legal
  const [leaseType, setLeaseType]           = useState('')
  const [trustee, setTrustee]               = useState('')
  const [arbitration, setArbitration]       = useState('')
  const [legalNote, setLegalNote]           = useState('')

  // Optional — amenities (chip list)
  const [amenityInput, setAmenityInput] = useState('')
  const [amenities, setAmenities]       = useState<string[]>([])

  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  function addAmenity() {
    const v = amenityInput.trim().slice(0, 80)
    if (!v) return
    setAmenities(a => a.length >= 50 ? a : [...a, v])
    setAmenityInput('')
  }
  function removeAmenity(i: number) {
    setAmenities(a => a.filter((_, idx) => idx !== i))
  }

  function num(v: string): number | null {
    if (!v.trim()) return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }

  async function handleResend() {
    setResending(true)
    const supabase = createClient()
    await supabase.auth.resend({ type: 'signup', email: userEmail })
    setResending(false)
    setResendOk(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        title:               title.trim(),
        property_type:       type,
        location_country:    country,
        location_city:       city.trim(),
        estimated_value_thb: num(value),
        surface_sqm:         num(surface),
        bedrooms:            num(bedrooms),
        description:         description.trim(),
        contact_email:       email.trim(),
      }
      // Optionals — n'envoie que si renseigné
      if (bathrooms)               body.bathrooms              = num(bathrooms)
      if (poolType)                body.pool_type              = poolType
      if (viewDesc.trim())         body.view_description       = viewDesc.trim()
      if (beach.trim())            body.beach_access           = beach.trim()
      if (airport.trim())          body.airport_access         = airport.trim()
      if (hospital.trim())         body.hospital_access        = hospital.trim()
      if (leaseYears)              body.lease_years            = num(leaseYears)
      if (leaseRemainingYears)     body.lease_remaining_years  = num(leaseRemainingYears)
      if (leaseExpiryYear)         body.lease_expiry_year      = num(leaseExpiryYear)
      if (leaseType.trim())        body.lease_type             = leaseType.trim()
      if (trustee.trim())          body.trustee_name           = trustee.trim()
      if (arbitration.trim())      body.arbitration_clause     = arbitration.trim()
      if (legalNote.trim())        body.legal_note             = legalNote.trim()
      if (amenities.length)        body.amenities              = amenities

      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'EMAIL_NOT_VERIFIED') {
          setError('Vérifiez d\'abord votre email avant de soumettre.')
          setEmailVerified(false)
        } else {
          throw new Error(data.error ?? 'Erreur')
        }
        return
      }
      router.push(`/properties/${data.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  // Loading auth
  if (emailVerified === null) {
    return <div style={{ padding: 60, textAlign: 'center', color: 'var(--inv-muted)' }}>⏳ Chargement…</div>
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px 64px' }}>

      <div style={{ marginBottom: 24 }}>
        <Link href="/profile" style={{ background: 'none', border: 'none', color: 'var(--inv-muted)', cursor: 'pointer', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginBottom: 12 }}>
          ← Mon profil
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--inv-navy)', marginBottom: 4 }}>
          Proposer un bien
        </h1>
        <p style={{ fontSize: 14, color: 'var(--inv-muted)', margin: 0 }}>
          Décrivez votre propriété en détail. Plus d&apos;infos = examen plus rapide.
          Les champs marqués <span style={reqStar}>*</span> sont obligatoires.
        </p>
      </div>

      {/* Email non vérifié — bloqué */}
      {!emailVerified && (
        <div style={{
          background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: 8,
          padding: '16px 18px', marginBottom: 20, fontSize: 13,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#92400e', fontWeight: 700, marginBottom: 6 }}>
            ⚠️ Vérifiez votre email avant de soumettre
          </div>
          <p style={{ color: '#78350f', margin: '0 0 10px' }}>
            Vous devez confirmer <strong>{userEmail}</strong> avant de pouvoir lister un bien.
          </p>
          {resendOk ? (
            <span style={{ color: '#15803d', fontSize: 12, fontWeight: 600 }}>✓ Email renvoyé. Consultez votre boîte.</span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              style={{
                background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 6,
                padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >
              {resending ? '⏳…' : 'Renvoyer l\'email de vérification'}
            </button>
          )}
        </div>
      )}

      {/* Bandeau KYB info */}
      <div style={{
        background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8,
        padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#1e40af',
      }}>
        <strong>ℹ️ Documents requis à l&apos;acceptation</strong><br />
        Si votre bien est sélectionné, nous vous demanderons : passeport du porteur,
        titre de propriété, extrait Kbis (DBD &lt;3 mois) et acte de nomination du directeur.
      </div>

      <form onSubmit={handleSubmit}>

        {/* ── IDENTITÉ ─────────────────────────────────────────────────── */}
        <Section title="🏷️ Identité" defaultOpen>
          <div>
            <label className="inv-label">Nom du bien <Required /></label>
            <input type="text" className="inv-input" value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={200} required placeholder="Ex. Chalok Pool Villa — Koh Tao" />
          </div>
          <div style={{ ...grid3, marginTop: 12 }}>
            <div>
              <label className="inv-label">Type <Required /></label>
              <select className="inv-input" value={type} onChange={e => setType(e.target.value)}
                required style={{ appearance: 'auto' }}>
                <option value="">Sélectionnez…</option>
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="inv-label">Pays <Required /></label>
              <select className="inv-input" value={country} onChange={e => setCountry(e.target.value)}
                required style={{ appearance: 'auto' }}>
                {COUNTRIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="inv-label">Ville / Zone <Required /></label>
              <input type="text" className="inv-input" value={city}
                onChange={e => setCity(e.target.value)}
                maxLength={100} required placeholder="Koh Tao" />
            </div>
          </div>
        </Section>

        {/* ── VALEUR & SURFACE ────────────────────────────────────────── */}
        <Section title="📊 Valeur & surface" defaultOpen>
          <div style={grid3}>
            <div>
              <label className="inv-label">Valeur estimée (THB) <Required /></label>
              <input type="number" className="inv-input" value={value}
                onChange={e => setValue(e.target.value)}
                min={1} required placeholder="35 000 000" />
            </div>
            <div>
              <label className="inv-label">Surface (m²) <Required /></label>
              <input type="number" className="inv-input" value={surface}
                onChange={e => setSurface(e.target.value)}
                min={1} required placeholder="250" />
            </div>
            <div>
              <label className="inv-label">Chambres <Required /></label>
              <input type="number" className="inv-input" value={bedrooms}
                onChange={e => setBedrooms(e.target.value)}
                min={0} required placeholder="4" />
            </div>
          </div>
        </Section>

        {/* ── DESCRIPTION ─────────────────────────────────────────────── */}
        <Section title="🏡 Description" defaultOpen>
          <label className="inv-label">Description du bien <Required /></label>
          <textarea
            className="inv-input" value={description}
            onChange={e => setDescription(e.target.value)}
            rows={6} minLength={20} maxLength={4000} required
            placeholder="Présentation du bien, son histoire, atouts locatifs, particularités…"
            style={{ resize: 'vertical', fontFamily: 'inherit' }}
          />
          <div style={subLabel}>{description.length} / 4000 · minimum 20 caractères</div>
        </Section>

        {/* ── CARACTÉRISTIQUES OPTIONNELLES ───────────────────────────── */}
        <Section title="📐 Caractéristiques étendues" badge="Optionnel" defaultOpen={false}
          hint="Plus de détails physiques aident l'examen.">
          <div style={grid3}>
            <div>
              <label className="inv-label">Salles de bain</label>
              <input type="number" className="inv-input" value={bathrooms}
                onChange={e => setBathrooms(e.target.value)} min={0} />
            </div>
            <div>
              <label className="inv-label">Piscine</label>
              <select className="inv-input" value={poolType}
                onChange={e => setPoolType(e.target.value)} style={{ appearance: 'auto' }}>
                {POOL_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="inv-label">Vue</label>
              <input type="text" className="inv-input" value={viewDesc}
                onChange={e => setViewDesc(e.target.value)}
                maxLength={200} placeholder="Vue mer panoramique" />
            </div>
          </div>
        </Section>

        {/* ── SITUATION ───────────────────────────────────────────────── */}
        <Section title="📍 Situation" badge="Optionnel" defaultOpen={false}
          hint="Accès, points d'intérêt, distances.">
          <div style={grid2}>
            <div>
              <label className="inv-label">Accès plage</label>
              <input type="text" className="inv-input" value={beach}
                onChange={e => setBeach(e.target.value)}
                maxLength={200} placeholder="8 min à pied" />
            </div>
            <div>
              <label className="inv-label">Aéroport</label>
              <input type="text" className="inv-input" value={airport}
                onChange={e => setAirport(e.target.value)}
                maxLength={200} placeholder="Koh Samui (USM) — 45 min ferry" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="inv-label">Hôpital</label>
              <input type="text" className="inv-input" value={hospital}
                onChange={e => setHospital(e.target.value)}
                maxLength={200} placeholder="Bangkok Hospital Samui — 55 min" />
            </div>
          </div>
        </Section>

        {/* ── ÉQUIPEMENTS ─────────────────────────────────────────────── */}
        <Section title="✅ Équipements" badge="Optionnel" defaultOpen={false}
          hint="Max 50 équipements · 80 caractères chacun.">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {amenities.map((a, i) => (
              <span key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#f5f5f3', border: '1px solid var(--inv-border)', borderRadius: 16,
                padding: '4px 10px', fontSize: 13,
              }}>
                {a}
                <button
                  type="button"
                  onClick={() => removeAmenity(i)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--inv-muted)', fontSize: 14, padding: 0, lineHeight: 1 }}
                  title="Retirer"
                >×</button>
              </span>
            ))}
            {amenities.length === 0 && <span style={{ ...subLabel, marginTop: 0 }}>Aucun ajouté</span>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text" className="inv-input" style={{ flex: 1 }}
              value={amenityInput}
              onChange={e => setAmenityInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAmenity() } }}
              placeholder="WiFi fibre, Piscine à débordement, Climatisation…"
              maxLength={80}
            />
            <button
              type="button"
              onClick={addAmenity}
              style={{
                padding: '0 18px', background: 'var(--inv-navy)', color: '#fff',
                border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 13,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >+ Ajouter</button>
          </div>
        </Section>

        {/* ── BAIL & JURIDIQUE ────────────────────────────────────────── */}
        <Section title="⚖️ Bail & structure juridique" badge="Optionnel" defaultOpen={false}
          hint="Si vous ne connaissez pas ces infos, laissez vide — LOWI complètera.">
          <div style={grid3}>
            <div>
              <label className="inv-label">Durée bail (années)</label>
              <input type="number" className="inv-input" value={leaseYears}
                onChange={e => setLeaseYears(e.target.value)} min={1} placeholder="20" />
            </div>
            <div>
              <label className="inv-label">Restant (années)</label>
              <input type="number" className="inv-input" value={leaseRemainingYears}
                onChange={e => setLeaseRemainingYears(e.target.value)} min={0} placeholder="18" />
            </div>
            <div>
              <label className="inv-label">Année d&apos;expiration</label>
              <input type="number" className="inv-input" value={leaseExpiryYear}
                onChange={e => setLeaseExpiryYear(e.target.value)} placeholder="2045" />
            </div>
          </div>
          <div style={{ ...grid2, marginTop: 12 }}>
            <div>
              <label className="inv-label">Type de bail</label>
              <input type="text" className="inv-input" value={leaseType}
                onChange={e => setLeaseType(e.target.value)}
                maxLength={200} placeholder="Emphytéotique enregistré" />
            </div>
            <div>
              <label className="inv-label">Trustee</label>
              <input type="text" className="inv-input" value={trustee}
                onChange={e => setTrustee(e.target.value)}
                maxLength={200} placeholder="Société internationale" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="inv-label">Clause d&apos;arbitrage</label>
              <input type="text" className="inv-input" value={arbitration}
                onChange={e => setArbitration(e.target.value)}
                maxLength={500} placeholder="Convention de New York" />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label className="inv-label">Note juridique complémentaire</label>
            <textarea className="inv-input" value={legalNote}
              onChange={e => setLegalNote(e.target.value)}
              rows={3} maxLength={2000}
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
              placeholder="Tout élément juridique pertinent (titre clean, sans hypothèque, etc.)" />
          </div>
        </Section>

        {/* ── CONTACT ─────────────────────────────────────────────────── */}
        <Section title="✉️ Contact" defaultOpen>
          <label className="inv-label">Email de contact <Required /></label>
          <input type="email" className="inv-input" value={email}
            onChange={e => setEmail(e.target.value)}
            maxLength={200} required placeholder="votre@email.com" />
          <div style={subLabel}>
            Cet email est utilisé pour les communications relatives à votre bien. Peut différer
            de votre email de compte ({userEmail || '—'}).
          </div>
        </Section>

        {error && (
          <div style={{
            padding: '12px 16px', background: '#fef2f2',
            border: '1px solid #fecaca', borderRadius: 6,
            fontSize: 13, color: 'var(--inv-red)', marginBottom: 16,
          }}>
            ⚠ {error}
          </div>
        )}

        <button
          type="submit"
          className="inv-btn inv-btn-gold"
          disabled={saving || !emailVerified}
          style={{ padding: '13px', width: '100%', fontSize: 14 }}
        >
          {saving ? '⏳ Envoi en cours…' : 'Soumettre mon bien →'}
        </button>
        <p style={{ ...subLabel, textAlign: 'center', marginTop: 10 }}>
          Vous pourrez ajouter des photos juste après la soumission.
        </p>
      </form>
    </div>
  )
}
