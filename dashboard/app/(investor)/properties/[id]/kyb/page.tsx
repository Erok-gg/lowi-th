'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const DOC_TYPES = [
  { value: 'passport',            label: 'Passeport du porteur',     hint: 'Pages identité (photo + numéro). Acceptés : PDF, JPG, PNG.' },
  { value: 'title_deed',          label: 'Titre de propriété',       hint: 'Chanote (โฉนด) ou titre équivalent au pays.' },
  { value: 'company_dbd',         label: 'Extrait Kbis (DBD)',       hint: 'Daté de moins de 3 mois.' },
  { value: 'director_nomination', label: 'Acte de nomination',       hint: 'Acte officiel désignant le directeur de la société.' },
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
  signed_url: string | null
}

type PropInfo = {
  id: string
  public_id: string
  status: string
  kyb_requested_at: string | null
}

const STATUS_BADGE: Record<Doc['status'], { label: string; bg: string; color: string }> = {
  pending:  { label: '⏳ En attente de revue', bg: '#fef3c7', color: '#92400e' },
  approved: { label: '✓ Approuvé',             bg: '#d1fae5', color: '#065f46' },
  rejected: { label: '✗ Refusé',               bg: '#fee2e2', color: '#991b1b' },
}

export default function PropertyKybPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const fileInputs = useRef<Record<DocType, HTMLInputElement | null>>({
    passport: null, title_deed: null, company_dbd: null, director_nomination: null,
  })

  const [propId,   setPropId]   = useState<string | null>(null)
  const [prop,     setProp]     = useState<PropInfo | null>(null)
  const [docs,     setDocs]     = useState<Doc[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [uploadingType, setUploadingType] = useState<DocType | null>(null)
  const [uploadErr, setUploadErr] = useState('')

  useEffect(() => { params.then(p => setPropId(p.id)) }, [params])

  useEffect(() => {
    if (!propId) return
    fetch(`/api/properties/${propId}/kyb`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setLoading(false); return }
        setProp(data.property)
        setDocs(data.docs ?? [])
        setLoading(false)
      })
      .catch(() => { setError('Erreur chargement'); setLoading(false) })
  }, [propId])

  function getDoc(type: DocType): Doc | undefined {
    return docs.find(d => d.doc_type === type)
  }

  async function handleUpload(type: DocType, file: File) {
    if (!propId) return
    setUploadingType(type)
    setUploadErr('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('doc_type', type)
      const res = await fetch(`/api/properties/${propId}/kyb`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur upload')
      // Re-fetch pour rafraîchir signed_url + remplacer le doc existant éventuel
      const refreshed = await fetch(`/api/properties/${propId}/kyb`).then(r => r.json())
      setDocs(refreshed.docs ?? [])
    } catch (err: unknown) {
      setUploadErr(err instanceof Error ? err.message : 'Erreur upload')
    } finally {
      setUploadingType(null)
      const input = fileInputs.current[type]
      if (input) input.value = ''
    }
  }

  async function handleDelete(docId: string) {
    if (!propId) return
    if (!confirm('Supprimer ce document ?')) return
    try {
      const res = await fetch(`/api/properties/${propId}/kyb`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc_id: docId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Erreur')
      }
      setDocs(docs.filter(d => d.id !== docId))
    } catch (err: unknown) {
      setUploadErr(err instanceof Error ? err.message : 'Erreur')
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--inv-muted)', fontSize: 14 }}>⏳ Chargement…</div>
      </div>
    )
  }

  if (error || !prop) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 16px', textAlign: 'center' }}>
        <div style={{ color: 'var(--inv-red)', marginBottom: 16 }}>⚠ {error || 'Introuvable'}</div>
        <button onClick={() => router.push('/profile')} className="inv-btn inv-btn-outline" style={{ padding: '9px 20px', fontSize: 13 }}>← Retour</button>
      </div>
    )
  }

  // Page accessible uniquement si status='accepted'
  const isUploadable = prop.status === 'accepted'
  const approvedCount = docs.filter(d => d.status === 'approved').length

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px 64px' }}>

      {/* Breadcrumb */}
      <div style={{ marginBottom: 20 }}>
        <Link href={`/properties/${propId}`} style={{ fontSize: 13, color: 'var(--inv-muted)', textDecoration: 'none' }}>
          ← {prop.public_id ?? 'Propriété'}
        </Link>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--inv-navy)', marginBottom: 4 }}>
          Documents KYB
        </h1>
        <p style={{ fontSize: 14, color: 'var(--inv-muted)', margin: 0 }}>
          {approvedCount} / {DOC_TYPES.length} documents approuvés.
          {!isUploadable && ' Les uploads sont fermés à ce stade.'}
        </p>
      </div>

      {/* Info bandeau */}
      {isUploadable && (
        <div style={{
          background: '#eff6ff', border: '1px solid #bfdbfe',
          borderRadius: 8, padding: '12px 16px', marginBottom: 24,
          fontSize: 13, color: '#1e40af',
        }}>
          <strong>ℹ️ Ces documents servent à vérifier la propriété et son porteur.</strong><br />
          Une fois les 4 documents approuvés par notre équipe, votre bien pourra passer en ligne.
        </div>
      )}

      {uploadErr && (
        <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, fontSize: 13, color: 'var(--inv-red)', marginBottom: 16 }}>
          ⚠ {uploadErr}
        </div>
      )}

      {/* 4 slots */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {DOC_TYPES.map(t => {
          const doc = getDoc(t.value)
          const st  = doc ? STATUS_BADGE[doc.status] : null
          const isUploading = uploadingType === t.value
          // Refus → autoriser ré-upload même si propriété passée à un autre statut ? Non : on suit le statut property.
          const canModify = isUploadable && (!doc || doc.status === 'rejected')

          return (
            <div key={t.value} className="inv-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--inv-navy)', marginBottom: 4 }}>
                    {t.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--inv-muted)' }}>
                    {t.hint}
                  </div>
                </div>
                {st && (
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>
                    {st.label}
                  </span>
                )}
              </div>

              {/* Refus admin → afficher la raison */}
              {doc?.status === 'rejected' && doc.rejection_reason && (
                <div style={{ marginTop: 8, padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, fontSize: 12, color: '#991b1b' }}>
                  <strong>Motif du refus :</strong> {doc.rejection_reason}
                </div>
              )}

              {/* Actions */}
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {doc?.signed_url && (
                  <a
                    href={doc.signed_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inv-btn inv-btn-outline"
                    style={{ fontSize: 12, padding: '6px 12px', textDecoration: 'none' }}
                  >
                    📄 Voir
                  </a>
                )}

                {canModify && (
                  <>
                    <button
                      onClick={() => fileInputs.current[t.value]?.click()}
                      disabled={isUploading}
                      className="inv-btn inv-btn-gold"
                      style={{ fontSize: 12, padding: '6px 12px' }}
                    >
                      {isUploading ? '⏳ Upload…' : doc ? '↻ Remplacer' : '+ Téléverser'}
                    </button>
                    <input
                      ref={el => { fileInputs.current[t.value] = el }}
                      type="file"
                      accept="application/pdf,image/jpeg,image/png"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const f = e.target.files?.[0]
                        if (f) handleUpload(t.value, f)
                      }}
                    />
                    {doc && doc.status !== 'approved' && (
                      <button
                        onClick={() => handleDelete(doc.id)}
                        style={{
                          fontSize: 12, padding: '6px 12px',
                          background: 'none', border: '1px solid var(--inv-border)',
                          borderRadius: 6, cursor: 'pointer',
                          color: 'var(--inv-muted)', fontFamily: 'inherit',
                        }}
                      >
                        Supprimer
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <p style={{ fontSize: 11, color: 'var(--inv-muted)', marginTop: 16 }}>
        Documents privés. PDF, JPG ou PNG · Max 25 Mo par fichier.
      </p>
    </div>
  )
}
