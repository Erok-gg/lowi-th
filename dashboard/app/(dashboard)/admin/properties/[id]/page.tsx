'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

type Photo = { id: string; storage_path: string; width: number | null; height: number | null }

type Property = {
  id: string; public_id: string; title: string; status: string
  property_type: string | null; location_city: string | null; location_country: string | null
  estimated_value_thb: number | null; surface_sqm: number | null; bedrooms: number | null
  description: string | null; contact_email: string | null
  admin_notes: string | null; kyb_requested_at: string | null
  created_at: string; updated_at: string
  property_photos: Photo[]
  submitter: { email: string; public_id: string | null; first_name: string | null; last_name: string | null } | null
}

const ALLOWED: Record<string, { status: string; label: string; style?: React.CSSProperties }[]> = {
  lead:      [{ status: 'reviewing', label: '→ Passer en examen' }],
  reviewing: [
    { status: 'accepted', label: '✓ Accepter',              style: { color: '#15803d', borderColor: '#15803d' } },
    { status: 'rejected', label: '✗ Refuser',               style: { color: '#dc2626', borderColor: '#dc2626' } },
    { status: 'lead',     label: '← Retour queue' },
  ],
  accepted:  [
    { status: 'active',    label: '🌐 Mettre en ligne',     style: { color: '#a16207', borderColor: '#a16207' } },
    { status: 'reviewing', label: '← Retour examen' },
  ],
  active:    [{ status: 'closed',    label: '⏹ Clôturer',  style: { color: '#6b7280', borderColor: '#6b7280' } }],
  rejected:  [{ status: 'lead',      label: '← Retour queue' }],
  closed:    [],
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  lead:      { bg: '#f3f4f6', color: '#374151' },
  reviewing: { bg: '#eff6ff', color: '#1d4ed8' },
  accepted:  { bg: '#f0fdf4', color: '#15803d' },
  rejected:  { bg: '#fef2f2', color: '#dc2626' },
  active:    { bg: '#fefce8', color: '#a16207' },
  closed:    { bg: '#f9fafb', color: '#6b7280' },
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AdminPropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [propId,   setPropId]   = useState<string | null>(null)
  const [property, setProperty] = useState<Property | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  // Notes admin
  const [notes,    setNotes]    = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesOk,  setNotesOk]  = useState(false)

  // Transition
  const [transitioning, setTransitioning] = useState<string | null>(null)
  const [transErr,      setTransErr]      = useState('')

  useEffect(() => { params.then(p => setPropId(p.id)) }, [params])

  useEffect(() => {
    if (!propId) return
    fetch(`/api/admin/properties/${propId}`)
      .then(r => r.json())
      .then((data: Property | { error: string }) => {
        if ('error' in data) { setError(data.error); setLoading(false); return }
        setProperty(data)
        setNotes(data.admin_notes ?? '')
        setLoading(false)
      })
      .catch(() => { setError('Erreur chargement'); setLoading(false) })
  }, [propId])

  async function handleSaveNotes() {
    if (!propId) return
    setSavingNotes(true)
    setNotesOk(false)
    const res = await fetch(`/api/admin/properties/${propId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_notes: notes }),
    })
    setSavingNotes(false)
    if (res.ok) { setNotesOk(true); setTimeout(() => setNotesOk(false), 2500) }
  }

  async function handleTransition(newStatus: string) {
    if (!propId) return
    setTransitioning(newStatus)
    setTransErr('')
    const res = await fetch(`/api/admin/properties/${propId}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, notes }),
    })
    const data = await res.json()
    setTransitioning(null)
    if (!res.ok) { setTransErr(data.error ?? 'Erreur'); return }
    setProperty(p => p ? { ...p, ...data, property_photos: p.property_photos } : p)
    setNotes(data.admin_notes ?? '')
  }

  if (loading) return (
    <div className="win-panel" style={{ padding: 20, textAlign: 'center', fontSize: 12, color: 'var(--win-text-muted)' }}>
      Chargement…
    </div>
  )

  if (error || !property) return (
    <div className="win-panel" style={{ padding: 20 }}>
      <div style={{ color: 'var(--win-red)', fontSize: 12, marginBottom: 12 }}>⚠ {error || 'Introuvable'}</div>
      <Link href="/admin/properties"><button className="win-btn">← Retour</button></Link>
    </div>
  )

  const st = STATUS_COLORS[property.status] ?? STATUS_COLORS.lead
  const actions = ALLOWED[property.status] ?? []
  const photos = property.property_photos ?? []

  return (
    <div className="win-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Titlebar */}
      <div className="win-titlebar" style={{ flexShrink: 0 }}>
        <span>🏠 {property.title}</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontFamily: 'monospace', opacity: 0.8 }}>{property.public_id}</span>
          <Link href="/admin/properties">
            <button className="win-btn" style={{ fontSize: 11, padding: '1px 8px' }}>← Queue</button>
          </Link>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', display: 'flex', gap: 0 }}>

        {/* Colonne gauche : infos + photos */}
        <div style={{ flex: 1, overflow: 'auto', padding: 12, borderRight: '2px solid var(--win-border-dk)' }}>

          {/* Statut */}
          <div style={{ marginBottom: 12 }}>
            <span style={{
              padding: '3px 10px', fontSize: 11, fontWeight: 700,
              background: st.bg, color: st.color, border: `1px solid ${st.color}`,
            }}>
              {property.status.toUpperCase()}
            </span>
            {property.kyb_requested_at && (
              <span style={{ marginLeft: 8, fontSize: 10, color: 'var(--win-text-muted)' }}>
                KYB demandé le {fmtDate(property.kyb_requested_at)}
              </span>
            )}
          </div>

          {/* Infos */}
          <table style={{ fontSize: 12, borderCollapse: 'collapse', marginBottom: 16, width: '100%' }}>
            <tbody>
              {[
                ['Type',        property.property_type ?? '—'],
                ['Ville',       property.location_city ?? '—'],
                ['Pays',        property.location_country ?? '—'],
                ['Valeur',      property.estimated_value_thb ? `${property.estimated_value_thb.toLocaleString('fr-FR')} ฿` : '—'],
                ['Surface',     property.surface_sqm ? `${property.surface_sqm} m²` : '—'],
                ['Chambres',    property.bedrooms?.toString() ?? '—'],
                ['Email contact', property.contact_email ?? '—'],
                ['Soumis le',   fmtDate(property.created_at)],
                ['Mis à jour',  fmtDate(property.updated_at)],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td style={{ padding: '3px 8px 3px 0', color: 'var(--win-text-muted)', whiteSpace: 'nowrap', width: 110 }}>{k}</td>
                  <td style={{ padding: '3px 0' }}>{v}</td>
                </tr>
              ))}
              {property.submitter && (
                <>
                  <tr>
                    <td style={{ padding: '3px 8px 3px 0', color: 'var(--win-text-muted)' }}>Soumettant</td>
                    <td style={{ padding: '3px 0', fontFamily: 'monospace', fontSize: 11 }}>
                      {property.submitter.email}
                      {property.submitter.public_id && ` (${property.submitter.public_id})`}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>

          {/* Description */}
          {property.description && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--win-text-muted)' }}>DESCRIPTION</div>
              <div style={{ fontSize: 12, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{property.description}</div>
            </div>
          )}

          {/* Photos */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6, color: 'var(--win-text-muted)' }}>
              PHOTOS ({photos.length})
            </div>
            {photos.length === 0 ? (
              <div style={{ fontSize: 11, color: 'var(--win-text-muted)' }}>Aucune photo.</div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {photos.map(ph => (
                  <a
                    key={ph.id}
                    href={`${SUPABASE_URL}/storage/v1/object/public/property-photos/${ph.storage_path}`}
                    target="_blank" rel="noreferrer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${SUPABASE_URL}/storage/v1/object/public/property-photos/${ph.storage_path}`}
                      alt=""
                      style={{ width: 90, height: 68, objectFit: 'cover', border: '1px solid var(--win-border-dk)', cursor: 'pointer' }}
                    />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Colonne droite : actions + notes */}
        <div style={{ width: 260, flexShrink: 0, padding: 12, overflow: 'auto' }}>

          {/* KYB shortcut */}
          {['accepted', 'active', 'closed'].includes(property.status) && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6, color: 'var(--win-text-muted)' }}>KYB</div>
              <Link href={`/admin/properties/${propId}/kyb`}>
                <button className="win-btn" style={{ fontSize: 12, padding: '5px 10px', width: '100%' }}>
                  🪪 Revue documents KYB →
                </button>
              </Link>
            </div>
          )}

          {/* Edit vitrine (WYSIWYG) — toujours visible (admin peut pré-remplir avant accept) */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6, color: 'var(--win-text-muted)' }}>VITRINE</div>
            <Link href={`/projets/${property.public_id}/edit`} target="_blank">
              <button className="win-btn" style={{ fontSize: 12, padding: '5px 10px', width: '100%', color: '#a16207', borderColor: '#a16207' }}>
                ✏️ Éditer la fiche vitrine
              </button>
            </Link>
            {property.status === 'active' && (
              <Link href={`/projets/${property.public_id}`} target="_blank">
                <button className="win-btn" style={{ fontSize: 11, padding: '3px 10px', width: '100%', marginTop: 4 }}>
                  👁 Voir la page publique
                </button>
              </Link>
            )}
          </div>

          {/* Transitions */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8, color: 'var(--win-text-muted)' }}>ACTIONS</div>
            {actions.length === 0 ? (
              <div style={{ fontSize: 11, color: 'var(--win-text-muted)' }}>Aucune action disponible.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {actions.map(a => (
                  <button
                    key={a.status}
                    className="win-btn"
                    onClick={() => handleTransition(a.status)}
                    disabled={!!transitioning}
                    style={{ fontSize: 12, padding: '5px 10px', textAlign: 'left', ...a.style }}
                  >
                    {transitioning === a.status ? '⏳ …' : a.label}
                  </button>
                ))}
              </div>
            )}
            {transErr && (
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--win-red)' }}>⚠ {transErr}</div>
            )}
          </div>

          {/* Notes admin */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6, color: 'var(--win-text-muted)' }}>
              NOTES ADMIN (privées)
            </div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={8}
              maxLength={2000}
              style={{
                width: '100%', boxSizing: 'border-box',
                fontFamily: 'var(--win-font)', fontSize: 11,
                padding: 6, resize: 'vertical',
                border: '2px solid', borderColor: 'var(--win-border-dk) var(--win-border-lt) var(--win-border-lt) var(--win-border-dk)',
                background: 'var(--win-bg)',
              }}
              placeholder="Notes internes (non visibles par le soumettant)…"
            />
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                className="win-btn"
                onClick={handleSaveNotes}
                disabled={savingNotes}
                style={{ fontSize: 11, padding: '3px 10px' }}
              >
                {savingNotes ? '⏳' : '💾 Sauvegarder'}
              </button>
              {notesOk && <span style={{ fontSize: 10, color: 'var(--win-green)' }}>✓ Sauvegardé</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
