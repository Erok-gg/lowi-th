'use client'
import '../../../projet-detail.css'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

type Photo = { id: string; storage_path: string; position: number | null; width: number | null; height: number | null }

type Property = {
  id: string
  public_id: string
  title: string
  status: string
  description: string | null
  property_type: string | null
  location_city: string | null
  location_country: string | null
  estimated_value_thb: number | null
  surface_sqm: number | null
  bedrooms: number | null
  bathrooms: number | null
  pool_type: string | null
  view_description: string | null
  amenities: string[] | null
  beach_access: string | null
  airport_access: string | null
  hospital_access: string | null
  irr_pct: number | null
  distribution_pct: number | null
  min_ticket_thb: number | null
  lease_years: number | null
  lease_remaining_years: number | null
  lease_expiry_year: number | null
  lease_type: string | null
  trustee_name: string | null
  arbitration_clause: string | null
  legal_note: string | null
  shares_total: number | null
  shares_sold: number | null
  funding_status: string | null
  investor_memo_url: string | null
  property_photos: Photo[]
}

const TYPES = ['villa', 'condo', 'hotel', 'land', 'bungalow', 'eco-resort', 'co-living', 'boutique-hotel', 'other']
const FUNDING_STATUS = [
  { v: 'soon', label: 'Bientôt' },
  { v: 'open', label: 'Ouvert à l\'investissement' },
  { v: 'full', label: 'Complet' },
]
const POOL_TYPES = [
  { v: '',         label: '—' },
  { v: 'private',  label: 'Privée' },
  { v: 'shared',   label: 'Partagée' },
  { v: 'none',     label: 'Aucune' },
]

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid var(--cream)',
  borderRadius: 12,
  padding: 24,
  marginBottom: 20,
  boxShadow: '0 2px 12px rgba(0,0,0,.04)',
}
const sectionTitle: React.CSSProperties = {
  fontSize: '1.05rem', fontWeight: 800,
  color: 'var(--ink)', marginBottom: 16,
  letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 8,
}
const label: React.CSSProperties = {
  display: 'block', fontSize: '.78rem', fontWeight: 700,
  color: 'var(--ink2)', letterSpacing: '.04em', textTransform: 'uppercase',
  marginBottom: 6,
}
const input: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '10px 12px',
  fontSize: 14, fontFamily: 'inherit',
  border: '1px solid #ddd', borderRadius: 6,
  background: '#fff',
}
const muted: React.CSSProperties = { fontSize: 12, color: 'var(--muted)', marginTop: 4 }
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }
const grid3: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }
const grid4: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }

function photoUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/property-photos/${path}`
}

export default function ProjetEditPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter()

  const [propId, setPropId] = useState<string | null>(null)
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [authChecked, setAuthChecked] = useState(false)

  // form state — initialisé après fetch
  const [form, setForm] = useState<Partial<Property>>({})
  const [amenityInput, setAmenityInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [saveErr, setSaveErr] = useState('')

  // 1) Vérif superadmin
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/invest/login?redirect=/profile'); return }
      const { data: profile } = await supabase.from('profiles').select('is_superadmin').eq('id', user.id).single()
      if (!profile?.is_superadmin) {
        setError('Accès refusé — réservé aux administrateurs.')
        setLoading(false)
        return
      }
      setAuthChecked(true)
    })
  }, [router])

  // 2) Résoudre slug = public_id
  useEffect(() => {
    if (!authChecked) return
    params.then(async ({ slug }) => {
      if (!/^prop_[A-Za-z0-9]+$/.test(slug)) { setError('Identifiant invalide'); setLoading(false); return }
      // Trouver l'id uuid via public_id
      const supabase = createClient()
      const { data: row } = await supabase
        .from('properties').select('id').eq('public_id', slug).single()
      if (!row) { setError('Propriété introuvable'); setLoading(false); return }
      setPropId(row.id)
    })
  }, [authChecked, params])

  // 3) Fetch détail admin
  useEffect(() => {
    if (!propId) return
    fetch(`/api/admin/properties/${propId}`)
      .then(r => r.json())
      .then((data: Property | { error: string }) => {
        if ('error' in data) { setError(data.error); setLoading(false); return }
        setProperty(data)
        setForm(data)
        setLoading(false)
      })
      .catch(() => { setError('Erreur chargement'); setLoading(false) })
  }, [propId])

  function update<K extends keyof Property>(key: K, value: Property[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function num(v: string): number | null {
    if (!v.trim()) return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }

  function addAmenity() {
    const v = amenityInput.trim().slice(0, 80)
    if (!v) return
    const next = [...(form.amenities ?? []), v]
    update('amenities', next.slice(0, 50))
    setAmenityInput('')
  }

  function removeAmenity(i: number) {
    const next = [...(form.amenities ?? [])]
    next.splice(i, 1)
    update('amenities', next)
  }

  async function handleSave() {
    if (!propId) return
    setSaving(true)
    setSaveErr('')
    try {
      const res = await fetch(`/api/admin/properties/${propId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      setProperty(data)
      setForm(data)
      setSavedAt(new Date())
    } catch (err: unknown) {
      setSaveErr(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>⏳ Chargement…</div>
    )
  }
  if (error || !property) {
    return (
      <div style={{ maxWidth: 600, margin: '60px auto', padding: 24, textAlign: 'center' }}>
        <div style={{ color: 'var(--red, #dc2626)', marginBottom: 16 }}>⚠ {error}</div>
        <Link href="/admin/properties" style={{ color: 'var(--gold)' }}>← Retour queue admin</Link>
      </div>
    )
  }

  const photos = (property.property_photos ?? []).sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

  return (
    <div style={{
      maxWidth: 980, margin: '0 auto',
      padding: '24px 4vw 80px',
      background: 'var(--cream)',
      minHeight: '100vh',
    }}>

      {/* Barre sticky de save */}
      <div style={{
        position: 'sticky', top: 62, zIndex: 50,
        background: 'rgba(255,255,255,.94)', backdropFilter: 'blur(10px)',
        border: '1px solid var(--cream)', borderRadius: 10,
        padding: '12px 16px', marginBottom: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, flexWrap: 'wrap', boxShadow: '0 2px 12px rgba(0,0,0,.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href={`/admin/properties/${propId}`} style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>
            ← Admin
          </Link>
          <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'monospace' }}>
            {property.public_id} · statut <strong>{property.status}</strong>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {property.status === 'active' && (
            <Link
              href={`/projets/${property.public_id}`}
              target="_blank"
              style={{ fontSize: 13, color: 'var(--gold)', textDecoration: 'none', fontWeight: 600 }}
            >
              🔗 Aperçu public
            </Link>
          )}
          {savedAt && !saving && (
            <span style={{ fontSize: 12, color: 'var(--teal)' }}>✓ Sauvé {savedAt.toLocaleTimeString('fr-FR')}</span>
          )}
          {saveErr && <span style={{ fontSize: 12, color: '#dc2626' }}>⚠ {saveErr}</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '8px 20px', background: 'var(--ink)', color: '#fff',
              border: 'none', borderRadius: 24, fontWeight: 700, fontSize: 13,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {saving ? '⏳ Sauvegarde…' : '💾 Sauvegarder'}
          </button>
        </div>
      </div>

      <h1 style={{ fontSize: 'clamp(1.4rem, 2.2vw, 2rem)', fontWeight: 800, color: 'var(--ink)', marginBottom: 4, letterSpacing: '-0.02em' }}>
        Édition vitrine
      </h1>
      <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>
        Données déjà fournies par le soumettant pré-remplies. Complétez les champs financiers, juridiques et descriptifs pour publier le bien.
      </p>

      {/* ── SECTION : Hero / Identité ── */}
      <div style={card}>
        <div style={sectionTitle}>🏷️ Identité</div>
        <div style={{ marginBottom: 12 }}>
          <label style={label}>Titre</label>
          <input style={input} value={form.title ?? ''} onChange={e => update('title', e.target.value)} maxLength={200} />
        </div>
        <div style={grid3}>
          <div>
            <label style={label}>Type</label>
            <select style={{ ...input, appearance: 'auto' }} value={form.property_type ?? ''} onChange={e => update('property_type', e.target.value || null)}>
              <option value="">—</option>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Ville</label>
            <input style={input} value={form.location_city ?? ''} onChange={e => update('location_city', e.target.value)} maxLength={100} />
          </div>
          <div>
            <label style={label}>Pays</label>
            <input style={input} value={form.location_country ?? ''} onChange={e => update('location_country', e.target.value)} maxLength={50} />
          </div>
        </div>
      </div>

      {/* ── SECTION : Photos (gestion ailleurs) ── */}
      <div style={card}>
        <div style={sectionTitle}>📷 Photos ({photos.length})</div>
        {photos.length === 0 ? (
          <p style={muted}>Aucune photo. Gérez les photos sur la page admin détail.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
            {photos.map(p => (
              <div key={p.id} style={{ aspectRatio: '4/3', overflow: 'hidden', borderRadius: 6, background: '#eee' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl(p.storage_path)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        )}
        <p style={muted}>L&apos;ordre/suppression se gère sur la page admin propriété.</p>
      </div>

      {/* ── SECTION : Stats / Métriques financières ── */}
      <div style={card}>
        <div style={sectionTitle}>📊 Métriques financières (stats bar)</div>
        <div style={grid4}>
          <div>
            <label style={label}>TRI estimé (%)</label>
            <input style={input} type="number" step="0.1" value={form.irr_pct ?? ''} onChange={e => update('irr_pct', num(e.target.value))} placeholder="11.2" />
          </div>
          <div>
            <label style={label}>Distribution (%/an)</label>
            <input style={input} type="number" step="0.1" value={form.distribution_pct ?? ''} onChange={e => update('distribution_pct', num(e.target.value))} placeholder="7.5" />
          </div>
          <div>
            <label style={label}>Ticket min. (THB)</label>
            <input style={input} type="number" value={form.min_ticket_thb ?? ''} onChange={e => update('min_ticket_thb', num(e.target.value))} placeholder="500000" />
          </div>
          <div>
            <label style={label}>Valeur estimée (THB)</label>
            <input style={input} type="number" value={form.estimated_value_thb ?? ''} onChange={e => update('estimated_value_thb', num(e.target.value))} />
          </div>
        </div>
        <div style={{ ...grid3, marginTop: 12 }}>
          <div>
            <label style={label}>Statut financement</label>
            <select style={{ ...input, appearance: 'auto' }} value={form.funding_status ?? ''} onChange={e => update('funding_status', e.target.value || null)}>
              <option value="">—</option>
              {FUNDING_STATUS.map(f => <option key={f.v} value={f.v}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Parts totales</label>
            <input style={input} type="number" value={form.shares_total ?? ''} onChange={e => update('shares_total', num(e.target.value))} placeholder="100" />
          </div>
          <div>
            <label style={label}>Parts vendues</label>
            <input style={input} type="number" value={form.shares_sold ?? ''} onChange={e => update('shares_sold', num(e.target.value))} placeholder="0" />
          </div>
        </div>
      </div>

      {/* ── SECTION : Bail ── */}
      <div style={card}>
        <div style={sectionTitle}>🔑 Bail</div>
        <div style={grid3}>
          <div>
            <label style={label}>Durée (années)</label>
            <input style={input} type="number" value={form.lease_years ?? ''} onChange={e => update('lease_years', num(e.target.value))} placeholder="20" />
          </div>
          <div>
            <label style={label}>Restant (années)</label>
            <input style={input} type="number" value={form.lease_remaining_years ?? ''} onChange={e => update('lease_remaining_years', num(e.target.value))} placeholder="20" />
          </div>
          <div>
            <label style={label}>Année d&apos;expiration</label>
            <input style={input} type="number" value={form.lease_expiry_year ?? ''} onChange={e => update('lease_expiry_year', num(e.target.value))} placeholder="2045" />
          </div>
        </div>
      </div>

      {/* ── SECTION : Description ── */}
      <div style={card}>
        <div style={sectionTitle}>🏡 Description</div>
        <textarea
          style={{ ...input, minHeight: 120, resize: 'vertical', fontFamily: 'inherit' }}
          value={form.description ?? ''}
          onChange={e => update('description', e.target.value)}
          maxLength={4000}
          placeholder="Présentation du bien, situation, atouts, historique locatif…"
        />
        <div style={muted}>{(form.description ?? '').length} / 4000</div>
      </div>

      {/* ── SECTION : Situation ── */}
      <div style={card}>
        <div style={sectionTitle}>📍 Situation</div>
        <div style={grid2}>
          <div>
            <label style={label}>Accès plage</label>
            <input style={input} value={form.beach_access ?? ''} onChange={e => update('beach_access', e.target.value)} placeholder="8 min à pied" maxLength={200} />
          </div>
          <div>
            <label style={label}>Aéroport</label>
            <input style={input} value={form.airport_access ?? ''} onChange={e => update('airport_access', e.target.value)} placeholder="Koh Samui (USM) — 45 min ferry" maxLength={200} />
          </div>
          <div>
            <label style={label}>Hôpital</label>
            <input style={input} value={form.hospital_access ?? ''} onChange={e => update('hospital_access', e.target.value)} placeholder="Bangkok Hospital Samui — 55 min" maxLength={200} />
          </div>
          <div>
            <label style={label}>Vue</label>
            <input style={input} value={form.view_description ?? ''} onChange={e => update('view_description', e.target.value)} placeholder="Vue mer panoramique" maxLength={200} />
          </div>
        </div>
      </div>

      {/* ── SECTION : Caractéristiques ── */}
      <div style={card}>
        <div style={sectionTitle}>📐 Caractéristiques</div>
        <div style={grid4}>
          <div>
            <label style={label}>Chambres</label>
            <input style={input} type="number" value={form.bedrooms ?? ''} onChange={e => update('bedrooms', num(e.target.value))} />
          </div>
          <div>
            <label style={label}>Salles de bain</label>
            <input style={input} type="number" value={form.bathrooms ?? ''} onChange={e => update('bathrooms', num(e.target.value))} />
          </div>
          <div>
            <label style={label}>Surface (m²)</label>
            <input style={input} type="number" value={form.surface_sqm ?? ''} onChange={e => update('surface_sqm', num(e.target.value))} />
          </div>
          <div>
            <label style={label}>Piscine</label>
            <select style={{ ...input, appearance: 'auto' }} value={form.pool_type ?? ''} onChange={e => update('pool_type', e.target.value || null)}>
              {POOL_TYPES.map(p => <option key={p.v} value={p.v}>{p.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── SECTION : Équipements ── */}
      <div style={card}>
        <div style={sectionTitle}>✅ Équipements</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {(form.amenities ?? []).map((a, i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#f5f5f3', border: '1px solid #ddd', borderRadius: 16,
              padding: '4px 10px', fontSize: 13,
            }}>
              {a}
              <button
                onClick={() => removeAmenity(i)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 14, padding: 0, lineHeight: 1 }}
                title="Retirer"
              >×</button>
            </span>
          ))}
          {(form.amenities ?? []).length === 0 && (
            <span style={{ ...muted, marginTop: 0 }}>Aucun équipement ajouté.</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{ ...input, flex: 1 }}
            value={amenityInput}
            onChange={e => setAmenityInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAmenity() } }}
            placeholder="Piscine à débordement, WiFi fibre, Climatisation…"
            maxLength={80}
          />
          <button
            onClick={addAmenity}
            style={{
              padding: '0 16px', background: 'var(--teal)', color: '#fff',
              border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 13,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >+ Ajouter</button>
        </div>
        <p style={muted}>Max 50 équipements · 80 caractères chacun. Entrée pour ajouter.</p>
      </div>

      {/* ── SECTION : Structure juridique ── */}
      <div style={card}>
        <div style={sectionTitle}>⚖️ Structure juridique</div>
        <div style={grid2}>
          <div>
            <label style={label}>Type de bail</label>
            <input style={input} value={form.lease_type ?? ''} onChange={e => update('lease_type', e.target.value)} placeholder="Emphytéotique enregistré" maxLength={200} />
          </div>
          <div>
            <label style={label}>Trustee</label>
            <input style={input} value={form.trustee_name ?? ''} onChange={e => update('trustee_name', e.target.value)} placeholder="Société internationale" maxLength={200} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={label}>Clause d&apos;arbitrage</label>
            <input style={input} value={form.arbitration_clause ?? ''} onChange={e => update('arbitration_clause', e.target.value)} placeholder="Convention de New York" maxLength={500} />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={label}>Note juridique (visible publique)</label>
          <textarea
            style={{ ...input, minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }}
            value={form.legal_note ?? ''}
            onChange={e => update('legal_note', e.target.value)}
            maxLength={2000}
            placeholder="Le bail est enregistré au Land Department thaïlandais. La clause d'arbitrage international est exécutoire…"
          />
          <div style={muted}>{(form.legal_note ?? '').length} / 2000 · Markdown non interprété, HTML strippé côté affichage.</div>
        </div>
      </div>

      {/* ── SECTION : Mémo investisseur ── */}
      <div style={card}>
        <div style={sectionTitle}>📄 Mémo investisseur</div>
        <label style={label}>URL du mémo PDF (lien public ou signé)</label>
        <input style={input} value={form.investor_memo_url ?? ''} onChange={e => update('investor_memo_url', e.target.value)} placeholder="https://..." maxLength={500} />
        <p style={muted}>Si vide, le bouton de téléchargement n&apos;apparaît pas sur la page publique.</p>
      </div>

      {/* Save bar bas */}
      <div style={{ marginTop: 24, textAlign: 'right' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '12px 28px', background: 'var(--gold)', color: 'var(--ink)',
            border: 'none', borderRadius: 28, fontWeight: 800, fontSize: 14,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {saving ? '⏳ Sauvegarde…' : '💾 Sauvegarder toutes les modifications'}
        </button>
        {saveErr && <div style={{ marginTop: 8, color: '#dc2626', fontSize: 13 }}>⚠ {saveErr}</div>}
      </div>
    </div>
  )
}
