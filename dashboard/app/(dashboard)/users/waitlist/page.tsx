'use client'
import { useState, useEffect, useCallback } from 'react'
import { formatDate, daysUntil } from '@/lib/utils'

type WaitlistEntry = {
  id: string
  email: string
  invite_code: string
  status: 'pending' | 'approved' | 'rejected'
  ip_address: string | null
  notes: string | null
  expires_at: string
  created_at: string
  reviewed_at: string | null
}

type Tab = 'pending' | 'approved' | 'rejected'

export default function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [tab, setTab]         = useState<Tab>('pending')
  const [loading, setLoading] = useState(true)
  const [action, setAction]   = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/waitlist?status=${tab}`)
    const data = await res.json()
    setEntries(data.entries ?? [])
    setLoading(false)
  }, [tab])

  useEffect(() => { load() }, [load])

  async function approve(id: string) {
    setAction(id)
    await fetch(`/api/admin/waitlist/approve/${id}`, { method: 'POST' })
    setAction(null)
    load()
  }

  async function reject(id: string) {
    if (!confirm('Reject this request?')) return
    setAction(id)
    await fetch(`/api/admin/waitlist/reject/${id}`, { method: 'POST' })
    setAction(null)
    load()
  }

  const filtered = entries.filter(e => e.status === tab)
  const counts = { pending: entries.length, approved: 0, rejected: 0 }

  return (
    <div className="win-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="win-titlebar">
        <span>📁 Users — Waitlist</span>
        <span style={{ fontSize: 11, opacity: 0.8 }}>{filtered.length} entry(ies)</span>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 0,
        borderBottom: '2px solid var(--win-border-dk)',
        padding: '4px 8px 0',
        background: 'var(--win-bg-dark)',
      }}>
        {(['pending', 'approved', 'rejected'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '3px 16px 3px',
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
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--win-text-muted)' }}>
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--win-text-muted)' }}>
            No {tab} requests.
          </div>
        ) : (
          <table className="win-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Invite Code</th>
                <th>IP</th>
                <th>Submitted</th>
                {tab === 'pending' && <th>Expires in</th>}
                {tab !== 'pending' && <th>Reviewed</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(entry => (
                <tr key={entry.id}>
                  <td><strong>{entry.email}</strong></td>
                  <td>
                    <code style={{
                      fontFamily: 'var(--win-mono)',
                      fontSize: 12,
                      background: tab === 'approved' ? '#f0fff0' : '#f8f8f8',
                      padding: '1px 4px',
                      border: '1px solid #d0d0d0',
                      letterSpacing: 1,
                    }}>
                      {entry.invite_code}
                    </code>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--win-text-muted)' }}>
                    {entry.ip_address ?? '—'}
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--win-text-muted)' }}>
                    {formatDate(entry.created_at)}
                  </td>
                  {tab === 'pending' && (
                    <td style={{ fontSize: 11 }}>
                      <span style={{ color: daysUntil(entry.expires_at) <= 5 ? 'var(--win-red)' : 'var(--win-text-muted)' }}>
                        {daysUntil(entry.expires_at)}d
                      </span>
                    </td>
                  )}
                  {tab !== 'pending' && (
                    <td style={{ fontSize: 11, color: 'var(--win-text-muted)' }}>
                      {entry.reviewed_at ? formatDate(entry.reviewed_at) : '—'}
                    </td>
                  )}
                  <td>
                    {tab === 'pending' && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          className="win-btn win-btn-success"
                          style={{ minWidth: 60, padding: '2px 8px', fontSize: 11 }}
                          disabled={action === entry.id}
                          onClick={() => approve(entry.id)}
                        >
                          ✓ Approve
                        </button>
                        <button
                          className="win-btn win-btn-danger"
                          style={{ minWidth: 50, padding: '2px 8px', fontSize: 11 }}
                          disabled={action === entry.id}
                          onClick={() => reject(entry.id)}
                        >
                          ✗ Reject
                        </button>
                      </div>
                    )}
                    {tab === 'approved' && (
                      <span style={{ fontSize: 11, color: 'var(--win-green)' }}>
                        ✓ Code sent manually
                      </span>
                    )}
                    {tab === 'rejected' && (
                      <span style={{ fontSize: 11, color: 'var(--win-text-muted)' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="win-statusbar">
        <span>{filtered.length} item(s)</span>
        <span>·</span>
        <span style={{ color: 'var(--win-text-muted)' }}>
          Approve = creates account · send invite code manually by email
        </span>
      </div>
    </div>
  )
}
