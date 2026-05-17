'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type PropertySummary = {
  id: string
  public_id: string
  title: string
  status: string
  property_type: string | null
  location_city: string | null
  location_country: string | null
  estimated_value_thb: number | null
  created_at: string
  property_photos: { count: number }[]
}

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  lead:       { label: 'En attente',    bg: '#f3f4f6', color: '#374151' },
  reviewing:  { label: 'En examen',     bg: '#eff6ff', color: '#1d4ed8' },
  accepted:   { label: 'Accepté',       bg: '#f0fdf4', color: '#15803d' },
  rejected:   { label: 'Refusé',        bg: '#fef2f2', color: '#dc2626' },
  active:     { label: 'En ligne',      bg: '#fefce8', color: '#a16207' },
  closed:     { label: 'Clôturé',       bg: '#f9fafb', color: '#6b7280' },
}

const TYPE_LABELS: Record<string, string> = {
  villa: 'Villa', condo: 'Condo', hotel: 'Hôtel', land: 'Terrain', other: 'Autre',
}

function formatThb(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M฿`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)} K฿`
  return `${n} ฿`
}

export default function MyPropertiesPage() {
  const router = useRouter()
  const [properties, setProperties] = useState<PropertySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/properties')
      .then(r => r.json())
      .then((data: PropertySummary[] | { error: string }) => {
        if ('error' in data) { setError(data.error); setLoading(false); return }
        setProperties(data)
        setLoading(false)
      })
      .catch(() => { setError('Erreur chargement'); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--inv-muted)', fontSize: 14 }}>⏳ Chargement…</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px 64px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--inv-navy)', marginBottom: 4 }}>
            Mes soumissions
          </h1>
          <p style={{ fontSize: 14, color: 'var(--inv-muted)', margin: 0 }}>
            {properties.length === 0 ? 'Aucune soumission pour l\'instant.' : `${properties.length} soumission${properties.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => router.push('/properties/new')}
          className="inv-btn inv-btn-gold"
          style={{ padding: '9px 18px', fontSize: 13 }}
        >
          + Proposer un bien
        </button>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, fontSize: 13, color: 'var(--inv-red)', marginBottom: 20 }}>
          ⚠ {error}
        </div>
      )}

      {/* Liste */}
      {properties.length === 0 ? (
        <div className="inv-card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏠</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--inv-navy)', marginBottom: 8 }}>
            Aucune soumission
          </div>
          <p style={{ fontSize: 13, color: 'var(--inv-muted)', marginBottom: 20 }}>
            Proposez votre premier bien immobilier pour le faire entrer dans la plateforme LOWI.
          </p>
          <button
            onClick={() => router.push('/properties/new')}
            className="inv-btn inv-btn-gold"
            style={{ padding: '10px 24px' }}
          >
            Proposer un bien →
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {properties.map(p => {
            const st = STATUS_LABELS[p.status] ?? STATUS_LABELS.lead
            const photoCount = p.property_photos?.[0]?.count ?? 0
            return (
              <Link
                key={p.id}
                href={`/properties/${p.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div className="inv-card" style={{
                  padding: '16px 20px', cursor: 'pointer',
                  transition: 'border-color .15s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          background: st.bg, color: st.color,
                        }}>
                          {st.label}
                        </span>
                        {p.property_type && (
                          <span style={{ fontSize: 11, color: 'var(--inv-muted)', fontWeight: 500 }}>
                            {TYPE_LABELS[p.property_type] ?? p.property_type}
                          </span>
                        )}
                        {p.public_id && (
                          <span style={{ fontSize: 11, color: 'var(--inv-muted)', fontFamily: 'monospace' }}>
                            {p.public_id}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--inv-navy)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.title}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--inv-muted)' }}>
                        {[p.location_city, p.location_country].filter(Boolean).join(', ')}
                        {p.estimated_value_thb ? ` · ${formatThb(p.estimated_value_thb)}` : ''}
                        {` · ${photoCount} photo${photoCount !== 1 ? 's' : ''}`}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--inv-muted)', whiteSpace: 'nowrap', marginTop: 2 }}>
                      {new Date(p.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
