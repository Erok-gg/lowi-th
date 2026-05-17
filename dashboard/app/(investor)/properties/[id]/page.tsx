'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

type Photo = {
  id: string
  storage_path: string
  position: number
  width: number | null
  height: number | null
  uploaded_at: string
}

type Property = {
  id: string
  public_id: string
  title: string
  status: string
  property_type: string | null
  location_city: string | null
  location_country: string | null
  estimated_value_thb: number | null
  surface_sqm: number | null
  bedrooms: number | null
  description: string | null
  contact_email: string | null
  admin_notes: string | null
  kyb_requested_at: string | null
  created_at: string
  property_photos: Photo[]
}

const STATUS_META: Record<string, { label: string; bg: string; color: string; info?: string }> = {
  lead:      { label: 'En attente de revue',   bg: '#f3f4f6', color: '#374151', info: 'Votre soumission est en cours d\'analyse par notre équipe.' },
  reviewing: { label: 'En cours d\'examen',    bg: '#eff6ff', color: '#1d4ed8', info: 'Un membre de l\'équipe examine activement votre dossier.' },
  accepted:  { label: 'Accepté',               bg: '#f0fdf4', color: '#15803d', info: 'Félicitations ! Complétez vos documents KYB pour continuer.' },
  rejected:  { label: 'Refusé',                bg: '#fef2f2', color: '#dc2626' },
  active:    { label: 'En ligne',              bg: '#fefce8', color: '#a16207' },
  closed:    { label: 'Clôturé',               bg: '#f9fafb', color: '#6b7280' },
}

const TYPES = [
  { value: 'villa', label: 'Villa' },
  { value: 'condo', label: 'Condominium' },
  { value: 'hotel', label: 'Hôtel / Resort' },
  { value: 'land',  label: 'Terrain' },
  { value: 'other', label: 'Autre' },
]

function photoUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/property-photos/${path}`
}

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [propId, setPropId]       = useState<string | null>(null)
  const [property, setProperty]   = useState<Property | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  // Form state (edit)
  const [title,    setTitle]    = useState('')
  const [type,     setType]     = useState('')
  const [city,     setCity]     = useState('')
  const [country,  setCountry]  = useState('TH')
  const [valueThb, setValueThb] = useState('')
  const [surface,  setSurface]  = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [desc,     setDesc]     = useState('')
  const [email,    setEmail]    = useState('')
  const [saving,   setSaving]   = useState(false)
  const [saveOk,   setSaveOk]   = useState(false)
  const [saveErr,  setSaveErr]  = useState('')

  // Photo upload
  const [uploading,   setUploading]   = useState(false)
  const [uploadErr,   setUploadErr]   = useState('')
  const [deletingId,  setDeletingId]  = useState<string | null>(null)

  // Resolve params (Next.js 16)
  useEffect(() => { params.then(p => setPropId(p.id)) }, [params])

  // Fetch property
  useEffect(() => {
    if (!propId) return
    fetch(`/api/properties/${propId}`)
      .then(r => r.json())
      .then((data: Property | { error: string }) => {
        if ('error' in data) { setError(data.error); setLoading(false); return }
        setProperty(data)
        // Init form
        setTitle(data.title ?? '')
        setType(data.property_type ?? '')
        setCity(data.location_city ?? '')
        setCountry(data.location_country ?? 'TH')
        setValueThb(data.estimated_value_thb?.toString() ?? '')
        setSurface(data.surface_sqm?.toString() ?? '')
        setBedrooms(data.bedrooms?.toString() ?? '')
        setDesc(data.description ?? '')
        setEmail(data.contact_email ?? '')
        setLoading(false)
      })
      .catch(() => { setError('Erreur chargement'); setLoading(false) })
  }, [propId])

  const isEditable = property?.status === 'lead'

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!propId) return
    setSaving(true)
    setSaveOk(false)
    setSaveErr('')
    try {
      const res = await fetch(`/api/properties/${propId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:               title.trim(),
          property_type:       type || null,
          location_city:       city.trim() || null,
          location_country:    country || 'TH',
          estimated_value_thb: valueThb ? Number(valueThb) : null,
          surface_sqm:         surface  ? Number(surface)  : null,
          bedrooms:            bedrooms ? Number(bedrooms) : null,
          description:         desc.trim() || null,
          contact_email:       email.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      setProperty(p => p ? { ...p, ...data } : p)
      setSaveOk(true)
      setTimeout(() => setSaveOk(false), 3000)
    } catch (err: unknown) {
      setSaveErr(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!propId || !e.target.files?.length) return
    setUploading(true)
    setUploadErr('')
    const file = e.target.files[0]
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch(`/api/properties/${propId}/photos`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur upload')
      setProperty(p => p ? { ...p, property_photos: [...p.property_photos, data] } : p)
    } catch (err: unknown) {
      setUploadErr(err instanceof Error ? err.message : 'Erreur upload')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDeletePhoto(photoId: string) {
    if (!propId) return
    setDeletingId(photoId)
    try {
      const res = await fetch(`/api/properties/${propId}/photos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_id: photoId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Erreur suppression')
      }
      setProperty(p => p ? { ...p, property_photos: p.property_photos.filter(ph => ph.id !== photoId) } : p)
    } catch (err: unknown) {
      setUploadErr(err instanceof Error ? err.message : 'Erreur suppression')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--inv-muted)', fontSize: 14 }}>⏳ Chargement…</div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 16px', textAlign: 'center' }}>
        <div style={{ color: 'var(--inv-red)', marginBottom: 16 }}>⚠ {error || 'Introuvable'}</div>
        <button onClick={() => router.push('/properties/mine')} className="inv-btn inv-btn-outline" style={{ padding: '9px 20px', fontSize: 13 }}>
          ← Retour
        </button>
      </div>
    )
  }

  const st = STATUS_META[property.status] ?? STATUS_META.lead
  const photos = property.property_photos ?? []

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px 64px' }}>

      {/* Breadcrumb */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/properties/mine" style={{ fontSize: 13, color: 'var(--inv-muted)', textDecoration: 'none' }}>
          ← Mes soumissions
        </Link>
      </div>

      {/* Titre + statut */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
            background: st.bg, color: st.color,
          }}>
            {st.label}
          </span>
          {property.public_id && (
            <span style={{ fontSize: 12, color: 'var(--inv-muted)', fontFamily: 'monospace' }}>
              {property.public_id}
            </span>
          )}
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--inv-navy)', margin: 0 }}>
          {property.title}
        </h1>
        {st.info && (
          <p style={{ fontSize: 13, color: 'var(--inv-muted)', marginTop: 6, marginBottom: 0 }}>
            {st.info}
          </p>
        )}
      </div>

      {/* Formulaire infos */}
      <div className="inv-card" style={{ padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--inv-navy)', marginBottom: 20 }}>
          Informations du bien
          {!isEditable && (
            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 400, color: 'var(--inv-muted)' }}>
              (lecture seule — statut {property.status})
            </span>
          )}
        </h2>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="inv-label">Nom du bien</label>
            <input type="text" className="inv-input" value={title} onChange={e => setTitle(e.target.value)} maxLength={200} disabled={!isEditable} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="inv-label">Type</label>
              <select className="inv-input" value={type} onChange={e => setType(e.target.value)} disabled={!isEditable} style={{ appearance: 'auto' }}>
                <option value="">—</option>
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="inv-label">Pays</label>
              <input type="text" className="inv-input" value={country} onChange={e => setCountry(e.target.value)} maxLength={50} disabled={!isEditable} />
            </div>
          </div>

          <div>
            <label className="inv-label">Ville / Zone</label>
            <input type="text" className="inv-input" value={city} onChange={e => setCity(e.target.value)} maxLength={100} disabled={!isEditable} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label className="inv-label">Valeur estimée (THB)</label>
              <input type="number" className="inv-input" value={valueThb} onChange={e => setValueThb(e.target.value)} min={0} disabled={!isEditable} />
            </div>
            <div>
              <label className="inv-label">Surface (m²)</label>
              <input type="number" className="inv-input" value={surface} onChange={e => setSurface(e.target.value)} min={1} disabled={!isEditable} />
            </div>
            <div>
              <label className="inv-label">Chambres</label>
              <input type="number" className="inv-input" value={bedrooms} onChange={e => setBedrooms(e.target.value)} min={0} disabled={!isEditable} />
            </div>
          </div>

          <div>
            <label className="inv-label">Description</label>
            <textarea className="inv-input" value={desc} onChange={e => setDesc(e.target.value)} rows={4} maxLength={2000} disabled={!isEditable} style={{ resize: 'vertical', fontFamily: 'inherit' }} />
          </div>

          <div>
            <label className="inv-label">Email de contact</label>
            <input type="email" className="inv-input" value={email} onChange={e => setEmail(e.target.value)} maxLength={200} disabled={!isEditable} />
          </div>

          {saveErr && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, fontSize: 13, color: 'var(--inv-red)' }}>
              ⚠ {saveErr}
            </div>
          )}
          {saveOk && (
            <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, fontSize: 13, color: '#166534' }}>
              ✓ Modifications enregistrées
            </div>
          )}

          {isEditable && (
            <button type="submit" className="inv-btn inv-btn-gold" disabled={saving} style={{ padding: '11px', width: '100%' }}>
              {saving ? '⏳ Enregistrement…' : 'Enregistrer les modifications'}
            </button>
          )}
        </form>
      </div>

      {/* Photos */}
      <div className="inv-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--inv-navy)', margin: 0 }}>
            Photos <span style={{ fontWeight: 400, color: 'var(--inv-muted)', fontSize: 13 }}>({photos.length} / 20)</span>
          </h2>
          {isEditable && photos.length < 20 && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inv-btn inv-btn-outline"
                disabled={uploading}
                style={{ padding: '7px 14px', fontSize: 13 }}
              >
                {uploading ? '⏳ Upload…' : '+ Ajouter une photo'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                style={{ display: 'none' }}
                onChange={handlePhotoUpload}
              />
            </>
          )}
        </div>

        {uploadErr && (
          <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, fontSize: 13, color: 'var(--inv-red)', marginBottom: 16 }}>
            ⚠ {uploadErr}
          </div>
        )}

        {photos.length === 0 ? (
          <div style={{
            border: '2px dashed var(--inv-border)', borderRadius: 8,
            padding: '32px 24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📷</div>
            <div style={{ fontSize: 13, color: 'var(--inv-muted)' }}>
              {isEditable
                ? 'Aucune photo. Cliquez sur « Ajouter une photo » pour illustrer votre bien.'
                : 'Aucune photo enregistrée.'}
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 10,
          }}>
            {photos.map(ph => (
              <div key={ph.id} style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', aspectRatio: '4/3', background: 'var(--inv-gray)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUrl(ph.storage_path)}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                {isEditable && (
                  <button
                    onClick={() => handleDeletePhoto(ph.id)}
                    disabled={deletingId === ph.id}
                    style={{
                      position: 'absolute', top: 4, right: 4,
                      background: 'rgba(0,0,0,.55)', color: '#fff',
                      border: 'none', borderRadius: 4,
                      width: 22, height: 22, cursor: 'pointer',
                      fontSize: 11, lineHeight: '22px', textAlign: 'center',
                      padding: 0,
                    }}
                    title="Supprimer"
                  >
                    {deletingId === ph.id ? '…' : '✕'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {isEditable && (
          <p style={{ fontSize: 11, color: 'var(--inv-muted)', marginTop: 12, marginBottom: 0 }}>
            JPEG, PNG, WebP ou HEIC · Max 10 Mo par photo · Max 20 photos · Re-encodées en WebP
          </p>
        )}
      </div>
    </div>
  )
}
