'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

const DOC_LABELS: Record<string, string> = {
  id_front:      "Identité recto",
  id_back:       "Identité verso",
  address_proof: "Domicile",
  selfie:        "Selfie",
  fund_origin:   "Origine fonds",
  tax_form:      "Décl. fiscale",
}

type KycEntry = {
  id: string
  email: string
  status: string
  submitted_at: string | null
  reviewed_at: string | null
  kyc_documents: { document_type: string }[]
}

type Tab = 'pending' | 'under_review' | 'approved' | 'rejected'

export default function SubmissionsKycPage() {
  const [entries, setEntries] = useState<KycEntry[]>([])
  const [tab, setTab]         = useState<Tab>('pending')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/kyc?status=${tab}`)
    const data = await res.json()
    setEntries(data.submissions ?? [])
    setLoading(false)
  }, [tab])

  useEffect(() => { load() }, [load])

  const TABS: Tab[] = ['pending', 'under_review', 'approved', 'rejected']

  return (
    <div className="win-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="win-titlebar">
        <span>🪪 Submissions — KYC</span>
        <span style={{ fontSize: 11, opacity: 0.8 }}>{entries.length} entry(ies)</span>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid var(--win-border-dk)',
        padding: '4px 8px 0',
        background: 'var(--win-bg-dark)',
      }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '3px 14px',
              fontSize: 12,
              fontFamily: 'var(--win-font)',
              cursor: 'pointer',
              background: tab === t ? 'var(--win-bg)' : 'var(--win-bg-dark)',
              border: '1px solid var(--win-border-dk)',
              borderBottom: tab === t ? '2px solid var(--win-bg)' : '1px solid var(--win-border-dk)',
              marginBottom: tab === t ? -2 : 0,
              fontWeight: tab === t ? 'bold' : 'normal',
              textTransform: 'capitalize',
            }}
          >
            {t.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--win-text-muted)' }}>Loading...</div>
        ) : entries.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--win-text-muted)' }}>
            No {tab.replace('_', ' ')} submissions.
          </div>
        ) : (
          <table className="win-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Documents</th>
                <th>Submitted</th>
                {tab !== 'pending' && <th>Reviewed</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => {
                const uploaded = entry.kyc_documents.map(d => d.document_type)
                return (
                  <tr key={entry.id}>
                    <td><strong>{entry.email}</strong></td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {Object.keys(DOC_LABELS).map(dt => (
                          <span
                            key={dt}
                            title={DOC_LABELS[dt]}
                            style={{
                              fontSize: 10,
                              padding: '1px 4px',
                              border: '1px solid',
                              borderColor: uploaded.includes(dt) ? 'var(--win-green)' : 'var(--win-border-dk)',
                              color: uploaded.includes(dt) ? 'var(--win-green)' : 'var(--win-text-muted)',
                              background: uploaded.includes(dt) ? '#f0fff0' : 'transparent',
                            }}
                          >
                            {uploaded.includes(dt) ? '✓' : '✗'} {DOC_LABELS[dt]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--win-text-muted)' }}>
                      {entry.submitted_at ? formatDate(entry.submitted_at) : '—'}
                    </td>
                    {tab !== 'pending' && (
                      <td style={{ fontSize: 11, color: 'var(--win-text-muted)' }}>
                        {entry.reviewed_at ? formatDate(entry.reviewed_at) : '—'}
                      </td>
                    )}
                    <td>
                      <Link href={`/submissions/kyc/${entry.id}`}>
                        <button className="win-btn" style={{ fontSize: 11, padding: '2px 8px' }}>
                          🔍 Review
                        </button>
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="win-statusbar">
        <span>{entries.length} submission(s)</span>
      </div>
    </div>
  )
}
