'use client'
import { useState, useEffect, useRef } from 'react'
import IdentityForm, { IdentityFormRef } from '@/components/IdentityForm'
import { IdentityData, identityComplete, identityFolderName } from '@/lib/identity'

const DOC_TYPES = [
  { key: 'id_front',      label: "Pièce d'identité (recto)",        icon: '🪪' },
  { key: 'id_back',       label: "Pièce d'identité (verso)",         icon: '🪪' },
  { key: 'address_proof', label: 'Justificatif de domicile',         icon: '🏠' },
  { key: 'selfie',        label: "Selfie avec pièce d'identité",     icon: '📸' },
  { key: 'fund_origin',   label: "Justificatif d'origine des fonds", icon: '💰' },
] as const

type DocKey = typeof DOC_TYPES[number]['key']

type Submission = {
  id: string
  status: 'incomplete' | 'pending' | 'under_review' | 'approved' | 'rejected'
  submitted_at: string | null
  rejection_reason: string | null
  kyc_documents: { document_type: string; file_name: string }[]
}

export default function KycPage() {
  const [submission, setSubmission]   = useState<Submission | null>(null)
  const [identity, setIdentity]       = useState<Partial<IdentityData> | null>(null)
  const [identitySaved, setIdentitySaved] = useState(false)
  const [loading, setLoading]         = useState(true)
  const [uploading, setUploading]     = useState<DocKey | null>(null)
  const [submitting, setSubmitting]   = useState(false)
  const [errors, setErrors]           = useState<Record<string, string>>({})
  const identityRef = useRef<IdentityFormRef>(null)
  const fileRefs = useRef<Record<DocKey, HTMLInputElement | null>>({} as Record<DocKey, HTMLInputElement | null>)

  async function load() {
    const [kycRes, idRes] = await Promise.all([
      fetch('/api/kyc/status'),
      fetch('/api/identity'),
    ])
    const kycData = await kycRes.json()
    const idData  = await idRes.json()
    setSubmission(kycData.submission)
    setIdentity(idData.identity)
    setIdentitySaved(!!idData.identity && identityComplete(idData.identity as IdentityData))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleUpload(docKey: DocKey, file: File) {
    setUploading(docKey)
    setErrors(prev => ({ ...prev, [docKey]: '' }))
    const fd = new FormData()
    fd.append('file', file)
    fd.append('document_type', docKey)
    const res = await fetch('/api/kyc/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) setErrors(prev => ({ ...prev, [docKey]: data.error ?? 'Upload failed' }))
    await load()
    setUploading(null)
  }

  async function handleSubmit() {
    setSubmitting(true)
    const res = await fetch('/api/kyc/submit', { method: 'POST' })
    const data = await res.json()
    if (!res.ok) alert(data.error)
    await load()
    setSubmitting(false)
  }

  const uploadedKeys = new Set(submission?.kyc_documents?.map(d => d.document_type) ?? [])
  const allUploaded  = DOC_TYPES.every(d => uploadedKeys.has(d.key))
  const status       = submission?.status ?? 'incomplete'
  const canUpload    = identitySaved

  const statusLabel = {
    incomplete:   '⬜ Incomplet',
    pending:      '⏳ En attente de vérification',
    under_review: '🔍 En cours de vérification',
    approved:     '✅ KYC approuvé',
    rejected:     '❌ KYC rejeté',
  }[status]

  const isEditable = status === 'incomplete' || status === 'rejected'

  return (
    <div className="win-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="win-titlebar">
        <span>🪪 Mon KYC</span>
        <span style={{ fontSize: 11, opacity: 0.8 }}>{statusLabel}</span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--win-text-muted)' }}>
            Chargement...
          </div>
        ) : (
          <>
            {/* Status banners */}
            {status === 'approved' && (
              <div className="win-inset" style={{ marginBottom: 12, padding: '8px 12px', background: '#e6ffe6', border: '1px solid var(--win-green)' }}>
                <strong style={{ color: 'var(--win-green)' }}>✅ Votre KYC a été approuvé.</strong>
              </div>
            )}
            {status === 'pending' && (
              <div className="win-inset" style={{ marginBottom: 12, padding: '8px 12px', background: '#fffbe6', border: '1px solid #b8860b' }}>
                <strong style={{ color: '#b8860b' }}>⏳ Dossier soumis — vérification en cours.</strong>
              </div>
            )}
            {status === 'rejected' && (
              <div className="win-inset" style={{ marginBottom: 12, padding: '8px 12px', background: '#fff0f0', border: '1px solid var(--win-red)' }}>
                <strong style={{ color: 'var(--win-red)' }}>❌ Dossier rejeté.</strong>
                {submission?.rejection_reason && (
                  <div style={{ fontSize: 12, marginTop: 4 }}>Motif : {submission.rejection_reason}</div>
                )}
                <div style={{ fontSize: 12, marginTop: 4 }}>Corrigez les documents et soumettez à nouveau.</div>
              </div>
            )}

            {/* ── Step 1 : Identité ── */}
            <div className="win-inset" style={{ padding: '8px 10px', marginBottom: 12 }}>
              <div style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 8 }}>
                1. Informations personnelles
                {identitySaved && <span style={{ marginLeft: 8, color: 'var(--win-green)', fontWeight: 'normal' }}>✓ Complètes</span>}
              </div>
              <IdentityForm
                ref={identityRef}
                initialData={identity}
                readOnly={!isEditable && status !== 'pending'}
                showSaveButton={isEditable}
                onSaved={(d) => {
                  setIdentitySaved(identityComplete(d))
                  setIdentity(d)
                }}
              />
            </div>

            {/* ── Step 2 : Documents ── */}
            {isEditable && (
              <>
                <div style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 6 }}>
                  2. Documents ({uploadedKeys.size} / {DOC_TYPES.length})
                  {!canUpload && (
                    <span style={{ marginLeft: 8, color: 'var(--win-text-muted)', fontWeight: 'normal', fontSize: 11 }}>
                      — Complétez d&apos;abord vos informations personnelles
                    </span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12, opacity: canUpload ? 1 : 0.5 }}>
                  {DOC_TYPES.map(doc => {
                    const done = uploadedKeys.has(doc.key)
                    const isUploading = uploading === doc.key
                    const err = errors[doc.key]
                    const docInfo = submission?.kyc_documents?.find(d => d.document_type === doc.key)

                    return (
                      <div
                        key={doc.key}
                        className="win-inset"
                        style={{
                          padding: '8px 10px',
                          border: done
                            ? '1px solid var(--win-green)'
                            : err ? '1px solid var(--win-red)' : '1px solid var(--win-border-dk)',
                          background: done ? '#f0fff0' : 'var(--win-bg)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 16 }}>{doc.icon}</span>
                          <span style={{ fontSize: 12, fontWeight: 'bold' }}>{doc.label}</span>
                          {done && <span style={{ marginLeft: 'auto', color: 'var(--win-green)' }}>✓</span>}
                        </div>
                        {done && docInfo && (
                          <div style={{ fontSize: 11, color: 'var(--win-text-muted)', marginBottom: 4 }}>
                            📎 {docInfo.file_name}
                          </div>
                        )}
                        {err && (
                          <div style={{ fontSize: 11, color: 'var(--win-red)', marginBottom: 4 }}>⚠ {err}</div>
                        )}
                        <input
                          ref={el => { fileRefs.current[doc.key] = el }}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          style={{ display: 'none' }}
                          onChange={e => {
                            const f = e.target.files?.[0]
                            if (f) handleUpload(doc.key, f)
                            e.target.value = ''
                          }}
                        />
                        <button
                          className="win-btn"
                          style={{ fontSize: 11, padding: '2px 8px', width: '100%' }}
                          disabled={isUploading || !canUpload}
                          onClick={() => fileRefs.current[doc.key]?.click()}
                        >
                          {isUploading ? '⏳ Upload...' : done ? '🔄 Remplacer' : '📤 Uploader'}
                        </button>
                      </div>
                    )
                  })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--win-text-muted)', alignSelf: 'center' }}>
                    {uploadedKeys.size} / {DOC_TYPES.length} documents
                  </span>
                  <button
                    className="win-btn win-btn-primary"
                    disabled={!allUploaded || !identitySaved || submitting}
                    onClick={handleSubmit}
                    style={{ padding: '4px 20px' }}
                  >
                    {submitting ? '⏳ Envoi...' : '✉ Soumettre pour vérification'}
                  </button>
                </div>
              </>
            )}

            {/* Read-only doc list when pending/approved */}
            {!isEditable && (
              <table className="win-table" style={{ marginTop: 8 }}>
                <thead>
                  <tr><th>Document</th><th>Fichier</th><th>Statut</th></tr>
                </thead>
                <tbody>
                  {DOC_TYPES.map(doc => {
                    const docInfo = submission?.kyc_documents?.find(d => d.document_type === doc.key)
                    return (
                      <tr key={doc.key}>
                        <td>{doc.icon} {doc.label}</td>
                        <td style={{ fontSize: 11, color: 'var(--win-text-muted)' }}>{docInfo?.file_name ?? '—'}</td>
                        <td>{docInfo ? <span style={{ color: 'var(--win-green)' }}>✓</span> : <span style={{ color: 'var(--win-red)' }}>✗</span>}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  )
}
