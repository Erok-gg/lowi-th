'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

type PropertyRow = {
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
  submitter: { email: string; public_id: string | null } | null
}

const TABS = [
  { key: '',           label: 'Tous' },
  { key: 'lead',       label: 'En attente' },
  { key: 'reviewing',  label: 'En examen' },
  { key: 'accepted',   label: 'Acceptés' },
  { key: 'rejected',   label: 'Refusés' },
  { key: 'active',     label: 'En ligne' },
  { key: 'closed',     label: 'Clôturés' },
]

const STATUS_COLORS: Record<string, string> = {
  lead:      '#6b7280',
  reviewing: '#1d4ed8',
  accepted:  '#15803d',
  rejected:  '#dc2626',
  active:    '#a16207',
  closed:    '#4b5563',
}

function fmtThb(n: number | null) {
  if (!n) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M฿`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} K฿`
  return `${n} ฿`
}

export default function AdminPropertiesPage() {
  const [tab,   setTab]   = useState('')
  const [rows,  setRows]  = useState<PropertyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const url = tab ? `/api/admin/properties?status=${tab}` : '/api/admin/properties'
    const res = await fetch(url)
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Erreur'); setLoading(false); return }
    setRows(data)
    setLoading(false)
  }, [tab])

  useEffect(() => { load() }, [load])

  return (
    <div className="win-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="win-titlebar">
        <span>🏠 Properties — Queue</span>
        <span style={{ fontSize: 11, opacity: 0.8 }}>{rows.length} bien(s)</span>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', flexWrap: 'wrap',
        borderBottom: '2px solid var(--win-border-dk)',
        padding: '4px 8px 0',
        background: 'var(--win-bg-dark)',
      }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '3px 12px', fontSize: 12,
              fontFamily: 'var(--win-font)', cursor: 'pointer',
              background: tab === t.key ? 'var(--win-bg)' : 'var(--win-bg-dark)',
              border: '1px solid var(--win-border-dk)',
              borderBottom: tab === t.key ? '2px solid var(--win-bg)' : '1px solid var(--win-border-dk)',
              marginBottom: tab === t.key ? -2 : 0,
              fontWeight: tab === t.key ? 'bold' : 'normal',
            }}
          >
            {t.label}
          </button>
        ))}
        <button
          onClick={load}
          style={{
            marginLeft: 'auto', padding: '3px 10px', fontSize: 11,
            fontFamily: 'var(--win-font)', cursor: 'pointer',
            background: 'var(--win-bg-dark)', border: '1px solid var(--win-border-dk)',
          }}
        >
          ↻ Rafraîchir
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
        {error && (
          <div style={{ padding: 8, color: 'var(--win-red)', fontSize: 12, marginBottom: 8 }}>⚠ {error}</div>
        )}
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--win-text-muted)', fontSize: 12 }}>
            Chargement…
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--win-text-muted)', fontSize: 12 }}>
            Aucune propriété{tab ? ` en statut "${tab}"` : ''}.
          </div>
        ) : (
          <table className="win-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Titre</th>
                <th>Type</th>
                <th>Ville</th>
                <th>Valeur</th>
                <th>📷</th>
                <th>Statut</th>
                <th>Soumettant</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const photoCount = r.property_photos?.[0]?.count ?? 0
                return (
                  <tr key={r.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 10, whiteSpace: 'nowrap' }}>
                      {r.public_id ?? '—'}
                    </td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <strong>{r.title}</strong>
                    </td>
                    <td style={{ fontSize: 11 }}>{r.property_type ?? '—'}</td>
                    <td style={{ fontSize: 11 }}>{r.location_city ?? '—'}</td>
                    <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{fmtThb(r.estimated_value_thb)}</td>
                    <td style={{ textAlign: 'center', fontSize: 11 }}>{photoCount}</td>
                    <td>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '1px 6px',
                        border: '1px solid', borderColor: STATUS_COLORS[r.status] ?? '#999',
                        color: STATUS_COLORS[r.status] ?? '#999',
                      }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--win-text-muted)' }}>
                      {r.submitter?.email ?? '—'}
                    </td>
                    <td style={{ fontSize: 10, color: 'var(--win-text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(r.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td>
                      <Link href={`/admin/properties/${r.id}`}>
                        <button className="win-btn" style={{ fontSize: 11, padding: '2px 8px' }}>
                          🔍 Voir
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
    </div>
  )
}
