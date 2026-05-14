'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import IdentityForm from '@/components/IdentityForm'

const DOC_TYPES = [
  { key: 'id_front',      label: "Pièce d'identité (recto)" },
  { key: 'id_back',       label: "Pièce d'identité (verso)" },
  { key: 'address_proof', label: 'Justificatif de domicile' },
  { key: 'selfie',        label: "Selfie avec pièce d'identité" },
  { key: 'fund_origin',   label: "Justificatif d'origine des fonds" },
]

type KycDoc = {
  document_type: string
  drive_file_url: string
  file_name: string
  uploaded_at: string
}

type Submission = {
  id: string
  user_id: string
  email: string
  status: string
  submitted_at: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  kyc_documents: KycDoc[]
}

export default function KycReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState('')
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [identity, setIdentity]     = useState<Record<string, string> | null>(null)
  const [loading, setLoading]       = useState(true)
  const [action, setAction]         = useState<'approve' | 'reject' | null>(null)
  const [reason, setReason]         = useState('')
  const [showReject, setShowReject] = useState(false)

  useEffect(() => { params.then(p => setId(p.id)) }, [params])

  const load = useCallback(async () => {
    if (!id) return
    const res = await fetch(`/api/admin/kyc/${id}`)
    if (res.ok) {
      const data = await res.json()
      setSubmission(data.submission)
      // Also fetch identity for this user
      const idRes = await fetch(`/api/admin/identity/${data.submission.user_id}`)
      if (idRes.ok) {
        const idData = await idRes.json()
        setIdentity(idData.identity)
      }
    }
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  async function handleApprove() {
    if (!confirm(`Approuver le KYC de ${submission?.email} ?`)) return
    setAction('approve')
    await fetch(`/api/admin/kyc/${id}/approve`, { method: 'POST' })
    setAction(null)
    router.push('/submissions/kyc')
  }

  async function handleReject() {
    setAction('reject')
    await fetch(`/api/admin/kyc/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
    setAction(null)
    router.push('/submissions/kyc')
  }

  if (loading) return (
    <div className="win-panel" style={{ padding: 20, textAlign: 'center', color: 'var(--win-text-muted)' }}>
      Chargement...
    </div>
  )
  if (!submission) return (
    <div className="win-panel" style={{ padding: 20, textAlign: 'center', color: 'var(--win-red)' }}>
      Soumission introuvable.
    </div>
  )

  const docMap = Object.fromEntries(submission.kyc_documents.map(d => [d.document_type, d]))

  return (
    <div className="win-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="win-titlebar">
        <span>🔍 KYC Review — {submission.email}</span>
        <span className={
          submission.status === 'approved' ? 'win-badge win-badge-approved'
          : submission.status === 'rejected' ? 'win-badge win-badge-rejected'
          : 'win-badge win-badge-pending'
        } style={{ fontSize: 11 }}>
          {submission.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>

        {/* Identity info (read-only) */}
        {identity && (
          <div className="win-inset" style={{ padding: '8px 10px', marginBottom: 12 }}>
            <div style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 8 }}>Identité déclarée</div>
            <IdentityForm initialData={identity} readOnly showSaveButton={false} />
          </div>
        )}

        {/* Submission meta */}
        <div className="win-inset" style={{ padding: '6px 10px', marginBottom: 10 }}>
          <table style={{ fontSize: 12, borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ color: 'var(--win-text-muted)', paddingRight: 16, paddingBottom: 2 }}>Email</td>
                <td><strong>{submission.email}</strong></td>
              </tr>
              <tr>
                <td style={{ color: 'var(--win-text-muted)', paddingRight: 16, paddingBottom: 2 }}>Soumis le</td>
                <td>{submission.submitted_at ? formatDate(submission.submitted_at) : '—'}</td>
              </tr>
              {submission.rejection_reason && (
                <tr>
                  <td style={{ color: 'var(--win-red)', paddingRight: 16 }}>Motif rejet</td>
                  <td style={{ color: 'var(--win-red)' }}>{submission.rejection_reason}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Documents */}
        <table className="win-table" style={{ marginBottom: 12 }}>
          <thead>
            <tr>
              <th>Document</th>
              <th>Fichier</th>
              <th>Uploadé le</th>
              <th>Drive</th>
            </tr>
          </thead>
          <tbody>
            {DOC_TYPES.map(dt => {
              const doc = docMap[dt.key]
              return (
                <tr key={dt.key}>
                  <td>{dt.label}</td>
                  <td style={{ fontSize: 11, color: 'var(--win-text-muted)' }}>
                    {doc?.file_name ?? <span style={{ color: 'var(--win-red)' }}>Manquant</span>}
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--win-text-muted)' }}>
                    {doc?.uploaded_at ? formatDate(doc.uploaded_at) : '—'}
                  </td>
                  <td>
                    {doc?.drive_file_url ? (
                      <a href={doc.drive_file_url} target="_blank" rel="noopener noreferrer"
                        className="win-btn"
                        style={{ fontSize: 11, padding: '2px 8px', textDecoration: 'none', display: 'inline-block' }}>
                        📂 Ouvrir
                      </a>
                    ) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Actions */}
        {(submission.status === 'pending' || submission.status === 'under_review') && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <button className="win-btn win-btn-success" style={{ padding: '4px 16px' }}
              disabled={action !== null} onClick={handleApprove}>
              ✓ Approuver
            </button>
            <button className="win-btn win-btn-danger" style={{ padding: '4px 16px' }}
              disabled={action !== null} onClick={() => setShowReject(v => !v)}>
              ✗ Rejeter
            </button>
          </div>
        )}

        {showReject && (
          <div className="win-inset" style={{ marginTop: 10, padding: 10 }}>
            <label className="win-label">Motif de rejet (optionnel) :</label>
            <textarea className="win-input" rows={3} value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Document illisible, photo floue, justificatif expiré..."
              style={{ resize: 'vertical', width: '100%', marginTop: 4 }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 6 }}>
              <button className="win-btn" onClick={() => setShowReject(false)}>Annuler</button>
              <button className="win-btn win-btn-danger" disabled={action !== null} onClick={handleReject}>
                {action === 'reject' ? '⏳ Rejet...' : 'Confirmer le rejet'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="win-statusbar">
        <button className="win-btn" style={{ fontSize: 11, padding: '1px 8px' }} onClick={() => router.back()}>
          ← Retour
        </button>
      </div>
    </div>
  )
}
