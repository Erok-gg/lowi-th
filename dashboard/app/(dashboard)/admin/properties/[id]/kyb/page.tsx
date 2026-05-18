'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const DOC_TYPES = [
  { value: 'passport',            label: 'Passeport porteur' },
  { value: 'title_deed',          label: 'Titre de propriété' },
  { value: 'company_dbd',         label: 'Extrait Kbis (DBD)' },
  { value: 'director_nomination', label: 'Acte nomination dir.' },
] as const

type DocType = typeof DOC_TYPES[number]['value']

type Doc = {
  id: string
  doc_type: DocType
  storage_path: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  uploaded_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  signed_url: string | null
}

type Property = {
  id: string
  public_id: string
  title: string
  status: string
  kyb_requested_at: string | null
  submitter: { email: string; public_id: string | null; first_name: string | null; last_name: string | null } | null
}

const STATUS_COLORS: Record<Doc['status'], { bg: string; color: string }> = {
  pending:  { bg: '#fef3c7', color: '#92400e' },
  approved: { bg: '#d1fae5', color: '#065f46' },
  rejected: { bg: '#fee2e2', color: '#991b1b' },
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function AdminPropertyKybPage({ params }: { params: Promise<{ id: string }> }) {
  const [propId,   setPropId]   = useState<string | null>(null)
  const [prop,     setProp]     = useState<Property | null>(null)
  const [docs,     setDocs]     = useState<Doc[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [actingId, setActingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actErr, setActErr] = useState('')

  useEffect(() => { params.then(p => setPropId(p.id)) }, [params])

  useEffect(() => {
    if (!propId) return
    fetch(`/api/admin/properties/${propId}/kyb`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setLoading(false); return }
        setProp(data.property)
        setDocs(data.docs ?? [])
        setLoading(false)
      })
      .catch(() => { setError('Erreur chargement'); setLoading(false) })
  }, [propId])

  async function handleDecision(docId: string, decision: 'approved' | 'rejected', reason?: string) {
    if (!propId) return
    setActingId(docId)
    setActErr('')
    try {
      const res = await fetch(`/api/admin/properties/${propId}/kyb`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc_id: docId, decision, reason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      setDocs(ds => ds.map(d => d.id === docId ? { ...d, ...data } : d))
      setRejectingId(null)
      setRejectReason('')
    } catch (err: unknown) {
      setActErr(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setActingId(null)
    }
  }

  if (loading) return (
    <div className="win-panel" style={{ padding: 20, textAlign: 'center', fontSize: 12, color: 'var(--win-text-muted)' }}>
      Chargement…
    </div>
  )

  if (error || !prop) return (
    <div className="win-panel" style={{ padding: 20 }}>
      <div style={{ color: 'var(--win-red)', fontSize: 12, marginBottom: 12 }}>⚠ {error || 'Introuvable'}</div>
      <Link href="/admin/properties"><button className="win-btn">← Retour</button></Link>
    </div>
  )

  const docsByType: Partial<Record<DocType, Doc>> = {}
  for (const d of docs) docsByType[d.doc_type] = d
  const approvedCount = docs.filter(d => d.status === 'approved').length

  return (
    <div className="win-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Titlebar */}
      <div className="win-titlebar" style={{ flexShrink: 0 }}>
        <span>🪪 KYB — {prop.title}</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontFamily: 'monospace', opacity: 0.8 }}>{prop.public_id}</span>
          <Link href={`/admin/properties/${propId}`}>
            <button className="win-btn" style={{ fontSize: 11, padding: '1px 8px' }}>← Détail</button>
          </Link>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>

        {/* Méta */}
        <div style={{ marginBottom: 12, fontSize: 11, color: 'var(--win-text-muted)' }}>
          <strong>{approvedCount} / {DOC_TYPES.length}</strong> documents approuvés
          {prop.kyb_requested_at && ` · KYB demandé le ${fmtDate(prop.kyb_requested_at)}`}
          {prop.submitter && ` · Soumettant : ${prop.submitter.email}`}
        </div>

        {actErr && (
          <div style={{ marginBottom: 12, padding: 8, fontSize: 11, color: 'var(--win-red)', background: '#fef2f2', border: '1px solid #fecaca' }}>
            ⚠ {actErr}
          </div>
        )}

        {/* 4 slots */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DOC_TYPES.map(t => {
            const doc = docsByType[t.value]
            return (
              <div key={t.value} style={{
                border: '2px solid',
                borderColor: 'var(--win-border-dk) var(--win-border-lt) var(--win-border-lt) var(--win-border-dk)',
                padding: 10, background: 'var(--win-bg)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--win-text)' }}>
                    {t.label}
                  </div>
                  {doc ? (
                    <span style={{
                      padding: '2px 8px', fontSize: 10, fontWeight: 700,
                      background: STATUS_COLORS[doc.status].bg,
                      color: STATUS_COLORS[doc.status].color,
                      border: `1px solid ${STATUS_COLORS[doc.status].color}`,
                    }}>
                      {doc.status.toUpperCase()}
                    </span>
                  ) : (
                    <span style={{ fontSize: 10, color: 'var(--win-text-muted)', fontStyle: 'italic' }}>Non téléversé</span>
                  )}
                </div>

                {doc ? (
                  <>
                    <div style={{ fontSize: 10, color: 'var(--win-text-muted)', marginBottom: 8 }}>
                      Téléversé le {fmtDate(doc.uploaded_at)}
                      {doc.reviewed_at && ` · Revu le ${fmtDate(doc.reviewed_at)}`}
                    </div>

                    {doc.status === 'rejected' && doc.rejection_reason && (
                      <div style={{ fontSize: 11, padding: 6, marginBottom: 8, background: '#fef2f2', border: '1px solid #fecaca' }}>
                        <strong>Motif :</strong> {doc.rejection_reason}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {doc.signed_url && (
                        <a
                          href={doc.signed_url}
                          target="_blank"
                          rel="noreferrer"
                          className="win-btn"
                          style={{ fontSize: 11, padding: '3px 10px', textDecoration: 'none', display: 'inline-block' }}
                        >
                          📄 Voir le doc
                        </a>
                      )}
                      {doc.status !== 'approved' && (
                        <button
                          className="win-btn"
                          onClick={() => handleDecision(doc.id, 'approved')}
                          disabled={actingId === doc.id}
                          style={{ fontSize: 11, padding: '3px 10px', color: '#15803d', borderColor: '#15803d' }}
                        >
                          {actingId === doc.id ? '⏳' : '✓ Approuver'}
                        </button>
                      )}
                      {doc.status !== 'rejected' && (
                        <button
                          className="win-btn"
                          onClick={() => setRejectingId(rejectingId === doc.id ? null : doc.id)}
                          disabled={actingId === doc.id}
                          style={{ fontSize: 11, padding: '3px 10px', color: '#dc2626', borderColor: '#dc2626' }}
                        >
                          ✗ Refuser
                        </button>
                      )}
                    </div>

                    {rejectingId === doc.id && (
                      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <input
                          type="text"
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                          placeholder="Motif du refus (visible par le soumettant)"
                          maxLength={500}
                          style={{
                            fontSize: 11, padding: 5,
                            fontFamily: 'var(--win-font)',
                            border: '2px solid', borderColor: 'var(--win-border-dk) var(--win-border-lt) var(--win-border-lt) var(--win-border-dk)',
                            background: 'var(--win-bg)',
                          }}
                          autoFocus
                        />
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="win-btn"
                            onClick={() => handleDecision(doc.id, 'rejected', rejectReason.trim())}
                            disabled={!rejectReason.trim() || actingId === doc.id}
                            style={{ fontSize: 11, padding: '3px 10px', color: '#dc2626' }}
                          >
                            Confirmer refus
                          </button>
                          <button
                            className="win-btn"
                            onClick={() => { setRejectingId(null); setRejectReason('') }}
                            style={{ fontSize: 11, padding: '3px 10px' }}
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ fontSize: 11, color: 'var(--win-text-muted)' }}>
                    En attente d&apos;upload par le soumettant.
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {approvedCount === DOC_TYPES.length && prop.status === 'accepted' && (
          <div style={{
            marginTop: 16, padding: 10, fontSize: 11,
            background: '#f0fdf4', border: '1px solid #15803d', color: '#15803d',
          }}>
            ✓ Tous les documents sont approuvés. Vous pouvez passer la propriété en{' '}
            <Link href={`/admin/properties/${propId}`} style={{ color: '#15803d', fontWeight: 700 }}>
              statut « En ligne »
            </Link>.
          </div>
        )}
      </div>
    </div>
  )
}
