'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const DOC_TYPES = [
  {
    key:  'id_front',
    icon: '🪪',
    label: "Pièce d'identité — recto",
    desc:  "Passeport ou carte nationale en cours de validité",
  },
  {
    key:  'id_back',
    icon: '🪪',
    label: "Pièce d'identité — verso",
    desc:  "Verso du même document",
  },
  {
    key:  'address_proof',
    icon: '🏠',
    label: "Justificatif de domicile",
    desc:  "Facture ou relevé bancaire de moins de 3 mois",
  },
  {
    key:  'selfie',
    icon: '📸',
    label: "Selfie avec pièce d'identité",
    desc:  "Photo nette, document lisible, visage visible",
  },
  {
    key:  'fund_origin',
    icon: '💰',
    label: "Justificatif d'origine des fonds",
    desc:  "Relevé bancaire, contrat de vente, etc.",
  },
] as const

type DocKey = typeof DOC_TYPES[number]['key']

type Submission = {
  id: string
  status: 'incomplete' | 'pending' | 'under_review' | 'approved' | 'rejected'
  submitted_at: string | null
  rejection_reason: string | null
  kyc_documents: { document_type: string; file_name: string }[]
}

function DocumentsForm() {
  const router = useRouter()
  const [authChecked, setAuthChecked]   = useState(false)
  const [submission, setSubmission]     = useState<Submission | null>(null)
  const [loading, setLoading]           = useState(true)
  const [uploading, setUploading]       = useState<DocKey | null>(null)
  const [submitting, setSubmitting]     = useState(false)
  const [errors, setErrors]             = useState<Record<string, string>>({})
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Auth guard
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/invest/login?redirect=' + encodeURIComponent('/invest/documents'))
      } else {
        setAuthChecked(true)
      }
    })
  }, [router])

  async function loadStatus() {
    const res  = await fetch('/api/kyc/status', { credentials: 'include' })
    const data = await res.json()
    setSubmission(data.submission ?? null)
    setLoading(false)
  }

  useEffect(() => {
    if (authChecked) loadStatus()
  }, [authChecked])

  async function handleUpload(docKey: DocKey, file: File) {
    setUploading(docKey)
    setErrors(prev => ({ ...prev, [docKey]: '' }))
    const fd = new FormData()
    fd.append('file', file)
    fd.append('document_type', docKey)
    const res  = await fetch('/api/kyc/upload', { method: 'POST', body: fd, credentials: 'include' })
    const data = await res.json()
    if (!res.ok) {
      setErrors(prev => ({ ...prev, [docKey]: data.error ?? 'Erreur upload' }))
    }
    await loadStatus()
    setUploading(null)
  }

  async function handleSubmit() {
    setSubmitting(true)
    const res  = await fetch('/api/kyc/submit', { method: 'POST', credentials: 'include' })
    const data = await res.json()
    if (!res.ok) {
      setErrors(prev => ({ ...prev, _submit: data.error ?? 'Erreur' }))
    } else {
      await loadStatus()
    }
    setSubmitting(false)
  }

  if (!authChecked) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--inv-muted)' }}>
        Vérification…
      </div>
    )
  }

  const uploadedKeys  = new Set(submission?.kyc_documents?.map(d => d.document_type) ?? [])
  const allUploaded   = DOC_TYPES.every(d => uploadedKeys.has(d.key))
  const status        = submission?.status ?? 'incomplete'
  const isEditable    = status === 'incomplete' || status === 'rejected'

  const STATUS_CONFIG = {
    incomplete:   { color: 'var(--inv-muted)',  bg: 'var(--inv-gray)',  label: 'En attente de documents' },
    pending:      { color: '#92400e',           bg: '#fef9f0',          label: '⏳ Dossier soumis — vérification en cours' },
    under_review: { color: '#1d4ed8',           bg: '#eff6ff',          label: '🔍 En cours de vérification approfondie' },
    approved:     { color: 'var(--inv-green)',  bg: '#f0fdf4',          label: '✅ KYC approuvé — vous pouvez investir' },
    rejected:     { color: 'var(--inv-red)',    bg: '#fef2f2',          label: '❌ Dossier rejeté — veuillez corriger' },
  }

  const sc = STATUS_CONFIG[status]

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 16px' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--inv-navy)', color: 'var(--inv-gold)',
          padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, marginBottom: 12,
        }}>
          🏝 Chalok Baan Kao Pool Villa
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--inv-navy)', margin: '0 0 6px' }}>
          Vérification d&apos;identité (KYC)
        </h1>
        <p style={{ fontSize: 14, color: 'var(--inv-muted)', margin: 0 }}>
          Conformément à la réglementation AML/KYC, nous devons vérifier votre identité avant de finaliser votre investissement.
        </p>
      </div>

      {/* Status banner */}
      {status !== 'incomplete' && (
        <div style={{
          padding: '12px 16px', borderRadius: 'var(--inv-radius)',
          background: sc.bg, color: sc.color,
          fontWeight: 600, fontSize: 14, marginBottom: 20,
          border: `1px solid ${sc.color}22`,
        }}>
          {sc.label}
          {status === 'rejected' && submission?.rejection_reason && (
            <div style={{ fontWeight: 400, fontSize: 13, marginTop: 4, color: 'var(--inv-muted)' }}>
              Motif : {submission.rejection_reason}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--inv-muted)' }}>⏳ Chargement…</div>
      ) : (
        <>
          {/* Progress indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', background: 'var(--inv-gray)',
            borderRadius: 'var(--inv-radius)', marginBottom: 20,
          }}>
            <div style={{ flex: 1, height: 6, background: 'var(--inv-border)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3,
                background: allUploaded ? 'var(--inv-green)' : 'var(--inv-gold)',
                width: `${(uploadedKeys.size / DOC_TYPES.length) * 100}%`,
                transition: 'width .4s ease',
              }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--inv-navy)', whiteSpace: 'nowrap' }}>
              {uploadedKeys.size} / {DOC_TYPES.length} documents
            </span>
          </div>

          {/* Document cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {DOC_TYPES.map(doc => {
              const done       = uploadedKeys.has(doc.key)
              const isUploading = uploading === doc.key
              const err        = errors[doc.key]
              const docInfo    = submission?.kyc_documents?.find(d => d.document_type === doc.key)

              return (
                <div key={doc.key} className="inv-card" style={{
                  padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: 16,
                  borderColor: done ? '#bbf7d0' : err ? '#fecaca' : 'var(--inv-border)',
                  background: done ? '#f0fdf4' : err ? '#fef2f2' : 'var(--inv-white)',
                  transition: 'all .2s',
                }}>
                  {/* Icon */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 'var(--inv-radius)',
                    background: done ? '#dcfce7' : 'var(--inv-gray)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, flexShrink: 0,
                  }}>
                    {done ? '✅' : doc.icon}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--inv-navy)', marginBottom: 2 }}>
                      {doc.label}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--inv-muted)' }}>
                      {done && docInfo ? (
                        <span style={{ color: 'var(--inv-green)' }}>📎 {docInfo.file_name}</span>
                      ) : err ? (
                        <span style={{ color: 'var(--inv-red)' }}>⚠ {err}</span>
                      ) : (
                        doc.desc
                      )}
                    </div>
                  </div>

                  {/* Upload button */}
                  {isEditable && (
                    <>
                      <input
                        ref={el => { fileRefs.current[doc.key] = el }}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        style={{ display: 'none' }}
                        onChange={e => {
                          const f = e.target.files?.[0]
                          if (f) handleUpload(doc.key as DocKey, f)
                          e.target.value = ''
                        }}
                      />
                      <button
                        className={`inv-btn ${done ? 'inv-btn-outline' : 'inv-btn-primary'}`}
                        style={{ padding: '8px 16px', fontSize: 13, flexShrink: 0 }}
                        disabled={!!uploading}
                        onClick={() => fileRefs.current[doc.key]?.click()}
                      >
                        {isUploading ? '⏳' : done ? '🔄 Remplacer' : '📤 Uploader'}
                      </button>
                    </>
                  )}

                  {/* Status icon for non-editable */}
                  {!isEditable && (
                    <span style={{ fontSize: 20, flexShrink: 0 }}>
                      {done ? '✅' : '❌'}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Info */}
          <div style={{
            padding: '10px 14px', background: 'var(--inv-gray)',
            borderRadius: 'var(--inv-radius)', fontSize: 12,
            color: 'var(--inv-muted)', marginBottom: 20,
          }}>
            📋 Formats acceptés : PDF, JPG, PNG · Max 10 MB par fichier
          </div>

          {/* Submit error */}
          {errors._submit && (
            <div style={{
              padding: '10px 14px', background: '#fef2f2',
              border: '1px solid #fecaca', borderRadius: 'var(--inv-radius)',
              fontSize: 13, color: 'var(--inv-red)', marginBottom: 16,
            }}>
              ⚠ {errors._submit}
            </div>
          )}

          {/* Submit button */}
          {isEditable && (
            <button
              className="inv-btn inv-btn-gold"
              style={{ width: '100%', padding: 14, fontSize: 15 }}
              disabled={!allUploaded || submitting}
              onClick={handleSubmit}
            >
              {submitting
                ? '⏳ Envoi en cours…'
                : allUploaded
                  ? 'Soumettre mon dossier KYC →'
                  : `Il manque ${DOC_TYPES.length - uploadedKeys.size} document(s)`}
            </button>
          )}

          {/* Submitted state */}
          {!isEditable && status === 'pending' && (
            <div style={{
              textAlign: 'center', padding: '20px',
              background: '#fef9f0', borderRadius: 'var(--inv-radius)',
              border: '1px solid #fed7aa',
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
              <div style={{ fontWeight: 600, color: '#92400e', marginBottom: 4 }}>Dossier soumis avec succès</div>
              <div style={{ fontSize: 13, color: 'var(--inv-muted)' }}>
                Notre équipe vérifie vos documents sous 24–48h ouvrées. Vous recevrez un email de confirmation.
              </div>
            </div>
          )}

          {status === 'approved' && (
            <div style={{
              textAlign: 'center', padding: '20px',
              background: '#f0fdf4', borderRadius: 'var(--inv-radius)',
              border: '1px solid #bbf7d0',
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
              <div style={{ fontWeight: 600, color: 'var(--inv-green)', marginBottom: 8 }}>KYC approuvé !</div>
              <div style={{ fontSize: 13, color: 'var(--inv-muted)', marginBottom: 16 }}>
                Votre identité a été vérifiée. Vous pouvez finaliser votre investissement.
              </div>
              <button
                className="inv-btn inv-btn-gold"
                style={{ padding: '10px 32px' }}
                onClick={() => router.push('/invest/kyc')}
              >
                Retour à mon investissement →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function InvestDocumentsPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--inv-muted)' }}>
        Chargement…
      </div>
    }>
      <DocumentsForm />
    </Suspense>
  )
}
