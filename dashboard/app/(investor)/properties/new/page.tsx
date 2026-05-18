'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const TYPES = [
  { value: 'villa',  label: 'Villa' },
  { value: 'condo',  label: 'Condominium' },
  { value: 'hotel',  label: 'Hôtel / Resort' },
  { value: 'land',   label: 'Terrain' },
  { value: 'other',  label: 'Autre' },
]

export default function NewPropertyPage() {
  const router = useRouter()

  const [title,        setTitle]       = useState('')
  const [type,         setType]        = useState('')
  const [city,         setCity]        = useState('')
  const [country,      setCountry]     = useState('TH')
  const [valueThb,     setValueThb]    = useState('')
  const [surface,      setSurface]     = useState('')
  const [bedrooms,     setBedrooms]    = useState('')
  const [description,  setDesc]        = useState('')
  const [email,        setEmail]       = useState('')
  const [saving,       setSaving]      = useState(false)
  const [error,        setError]       = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:                title.trim(),
          property_type:        type || null,
          location_city:        city.trim() || null,
          location_country:     country || 'TH',
          estimated_value_thb:  valueThb ? Number(valueThb) : null,
          surface_sqm:          surface  ? Number(surface)  : null,
          bedrooms:             bedrooms ? Number(bedrooms) : null,
          description:          description.trim() || null,
          contact_email:        email.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      router.push(`/properties/${data.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur')
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px 64px' }}>

      {/* En-tête */}
      <div style={{ marginBottom: 28 }}>
        <button
          onClick={() => router.push('/profile')}
          style={{ background: 'none', border: 'none', color: 'var(--inv-muted)', cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 12 }}
        >
          ← Mon profil
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--inv-navy)', marginBottom: 4 }}>
          Proposer un bien
        </h1>
        <p style={{ fontSize: 14, color: 'var(--inv-muted)', margin: 0 }}>
          Décrivez votre propriété. Notre équipe l&apos;examinera sous 72h.
        </p>
      </div>

      {/* Bandeau KYB */}
      <div style={{
        background: '#eff6ff', border: '1px solid #bfdbfe',
        borderRadius: 8, padding: '12px 16px', marginBottom: 24,
        fontSize: 13, color: '#1e40af',
      }}>
        <strong>ℹ️ Documents requis à l&apos;acceptation</strong><br />
        Si votre bien est sélectionné pour une offre, nous vous demanderons : titre de propriété, extrait Kbis (DBD &lt;3 mois), acte de nomination du directeur et passeport du porteur.
      </div>

      {/* Formulaire */}
      <div className="inv-card" style={{ padding: 28 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Titre */}
          <div>
            <label className="inv-label">
              Nom du bien <span style={{ color: 'var(--inv-red)' }}>*</span>
            </label>
            <input
              type="text" className="inv-input"
              value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Ex. : Chalok Pool Villa — Koh Tao"
              maxLength={200} required
            />
          </div>

          {/* Type + pays */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="inv-label">Type de bien</label>
              <select
                className="inv-input" value={type}
                onChange={e => setType(e.target.value)}
                style={{ appearance: 'auto' }}
              >
                <option value="">Sélectionnez…</option>
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="inv-label">Pays</label>
              <select
                className="inv-input" value={country}
                onChange={e => setCountry(e.target.value)}
                style={{ appearance: 'auto' }}
              >
                <option value="TH">🇹🇭 Thaïlande</option>
                <option value="FR">🇫🇷 France</option>
                <option value="PT">🇵🇹 Portugal</option>
                <option value="ES">🇪🇸 Espagne</option>
                <option value="MA">🇲🇦 Maroc</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>
          </div>

          {/* Ville */}
          <div>
            <label className="inv-label">Ville / Zone</label>
            <input
              type="text" className="inv-input"
              value={city} onChange={e => setCity(e.target.value)}
              placeholder="Ex. : Koh Tao" maxLength={100}
            />
          </div>

          {/* Valeur + surface + chambres */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label className="inv-label">Valeur estimée (THB)</label>
              <input
                type="number" className="inv-input"
                value={valueThb} onChange={e => setValueThb(e.target.value)}
                placeholder="35 000 000" min={0}
              />
            </div>
            <div>
              <label className="inv-label">Surface (m²)</label>
              <input
                type="number" className="inv-input"
                value={surface} onChange={e => setSurface(e.target.value)}
                placeholder="250" min={1}
              />
            </div>
            <div>
              <label className="inv-label">Chambres</label>
              <input
                type="number" className="inv-input"
                value={bedrooms} onChange={e => setBedrooms(e.target.value)}
                placeholder="4" min={0}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="inv-label">
              Description <span style={{ color: 'var(--inv-muted)', fontWeight: 400 }}>(optionnel)</span>
            </label>
            <textarea
              className="inv-input"
              value={description} onChange={e => setDesc(e.target.value)}
              placeholder="Décrivez le bien, son potentiel locatif, ses atouts…"
              rows={4} maxLength={2000}
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          {/* Email contact */}
          <div>
            <label className="inv-label">
              Email de contact <span style={{ color: 'var(--inv-muted)', fontWeight: 400 }}>(optionnel)</span>
            </label>
            <input
              type="email" className="inv-input"
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="votre@email.com" maxLength={200}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', background: '#fef2f2',
              border: '1px solid #fecaca', borderRadius: 6, fontSize: 13, color: 'var(--inv-red)',
            }}>
              ⚠ {error}
            </div>
          )}

          <button
            type="submit"
            className="inv-btn inv-btn-gold"
            disabled={saving || !title.trim()}
            style={{ padding: '12px', width: '100%' }}
          >
            {saving ? '⏳ Envoi en cours…' : 'Soumettre mon bien →'}
          </button>
        </form>
      </div>
    </div>
  )
}
