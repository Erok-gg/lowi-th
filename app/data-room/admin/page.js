// Tableau de bord du propriétaire : demandes, membres, fichiers (surlignage),
// et journal des consultations (qui a lu quoi, quand, combien de temps).
import { redirect } from 'next/navigation'
import { getOwner, decideSig } from '@/lib/dataroom/auth'
import { q } from '@/lib/dataroom/db'
import { getLang } from '@/lib/dataroom/i18n'
import { TopBar, fmtSize, StarIcon } from '../parts'

export const dynamic = 'force-dynamic'

const ts = (d) => (d ? new Date(d).toISOString().slice(0, 16).replace('T', ' ') : '—')
const mins = (s) => (!s ? '—' : s < 60 ? `${s} s` : `${Math.round(s / 60)} min`)

export default async function Admin({ searchParams }) {
  const lang = await getLang(searchParams)
  const owner = await getOwner()
  if (!owner) redirect('/data-room')

  const [requests, members, files, reading, events] = await Promise.all([
    q("select * from dataroom.requests order by (status='pending') desc, created_at desc limit 50"),
    q(`select m.*, (select count(distinct file_id) from dataroom.events e where e.email=m.email and e.kind='view') as files_viewed,
              (select coalesce(sum(seconds),0) from dataroom.events e where e.email=m.email and e.kind='heartbeat') as seconds
         from dataroom.members m order by m.role desc, m.last_seen desc nulls last`),
    q(`select f.id, f.folder, f.name, f.title_en, f.kind, f.size_bytes, f.highlighted, f.pinned,
              (select count(*) from dataroom.events e where e.file_id=f.id and e.kind in ('view','download')) as opens
         from dataroom.files f order by f.folder, f.sort, f.title_en`),
    q(`select e.email, f.title_en, sum(e.seconds)::int as seconds, max(e.at) as last
         from dataroom.events e join dataroom.files f on f.id=e.file_id
        where e.kind='heartbeat' group by 1,2 order by last desc limit 50`),
    q(`select e.at, e.email, e.kind, f.title_en from dataroom.events e left join dataroom.files f on f.id=e.file_id
        where e.kind <> 'heartbeat' order by e.at desc limit 100`),
  ])
  const pending = requests.filter((r) => r.status === 'pending')

  return (
    <>
      <TopBar lang={lang} member={owner} path="/data-room/admin" />
      <main className="dr-admin">
        <div className="dr-crumb">LOWI / Data Room / Admin</div>
        <h1 style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-.03em', margin: '6px 0 0' }}>Admin</h1>

        <h2>Access requests {pending.length > 0 && <span className="dr-pill dr-pill--ok">{pending.length} pending</span>}</h2>
        <div className="dr-tablewrap">
          <table className="dr-table">
            <thead><tr><th>Received (UTC)</th><th>Requester</th><th>Message</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {requests.length === 0 && <tr><td colSpan={5} className="dr-empty">No requests yet.</td></tr>}
              {requests.map((r) => (
                <tr key={r.id}>
                  <td className="num">{ts(r.created_at)}</td>
                  <td><b>{r.name}</b><br /><span className="mono">{r.email}</span>{r.company ? <><br />{r.company}</> : null}</td>
                  <td style={{ maxWidth: 320, color: 'var(--ink-2)' }}>{r.message || '—'}</td>
                  <td><span className={`dr-pill ${r.status === 'approved' ? 'dr-pill--ok' : r.status === 'denied' ? 'dr-pill--bad' : ''}`}>{r.status}</span></td>
                  <td>
                    {r.status === 'pending' && (
                      <form action="/api/dataroom/decide" method="post" style={{ display: 'flex', gap: 8 }}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="sig" value={decideSig(r.id)} />
                        <input type="hidden" name="from" value="admin" />
                        <button className="dr-btn dr-btn--sm dr-btn--primary" name="action" value="approve">Grant</button>
                        <button className="dr-btn dr-btn--sm dr-btn--danger" name="action" value="deny">Decline</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>Members</h2>
        <div className="dr-tablewrap">
          <table className="dr-table">
            <thead><tr><th>Member</th><th>Status</th><th>Last seen (UTC)</th><th>Files opened</th><th>Reading time</th><th></th></tr></thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.email}>
                  <td><b>{m.name || '—'}</b>{m.role === 'owner' ? ' (owner)' : ''}<br /><span className="mono">{m.email}</span></td>
                  <td><span className={`dr-pill ${m.status === 'active' ? 'dr-pill--ok' : 'dr-pill--bad'}`}>{m.status}</span></td>
                  <td className="num">{ts(m.last_seen)}</td>
                  <td className="num">{m.files_viewed}</td>
                  <td className="num">{mins(Number(m.seconds))}</td>
                  <td>
                    {m.role !== 'owner' && (
                      <form action="/api/dataroom/admin" method="post">
                        <input type="hidden" name="email" value={m.email} />
                        <button className={`dr-btn dr-btn--sm ${m.status === 'active' ? 'dr-btn--danger' : ''}`} name="action" value={m.status === 'active' ? 'revoke' : 'restore'}>
                          {m.status === 'active' ? 'Revoke access' : 'Restore'}
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>Files</h2>
        <p style={{ color: 'var(--ink-3)', fontSize: 13.5, marginTop: -4 }}>
          Upload with <code className="mono">npm run dataroom:upload -- &lt;file&gt; --folder &lt;slug&gt; --title &quot;…&quot;</code>.
          The star highlights a file as a key document; the pin shows a markdown file as the read-me card.
        </p>
        <div className="dr-tablewrap">
          <table className="dr-table">
            <thead><tr><th>File</th><th>Folder</th><th>Size</th><th>Opens</th><th>Key</th><th>Read-me</th></tr></thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.id}>
                  <td><b>{f.title_en}</b><br /><span className="mono">{f.name}</span></td>
                  <td>{f.folder}</td>
                  <td className="num">{fmtSize(f.size_bytes)}</td>
                  <td className="num">{f.opens}</td>
                  <td>
                    <form action="/api/dataroom/admin" method="post">
                      <input type="hidden" name="id" value={f.id} />
                      <button className="dr-btn dr-btn--sm dr-btn--ghost" name="action" value="highlight" aria-label={f.highlighted ? 'Remove highlight' : 'Highlight'}
                        style={{ color: f.highlighted ? 'var(--gold)' : 'var(--ink-3)' }}>
                        <StarIcon filled={f.highlighted} size={16} />
                      </button>
                    </form>
                  </td>
                  <td>
                    {f.kind === 'markdown' && (
                      <form action="/api/dataroom/admin" method="post">
                        <input type="hidden" name="id" value={f.id} />
                        <button className="dr-btn dr-btn--sm dr-btn--ghost" name="action" value="pin">{f.pinned ? 'Pinned' : 'Pin'}</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>Reading time by document</h2>
        <div className="dr-tablewrap">
          <table className="dr-table">
            <thead><tr><th>Member</th><th>Document</th><th>Time</th><th>Last (UTC)</th></tr></thead>
            <tbody>
              {reading.length === 0 && <tr><td colSpan={4} className="dr-empty">Nothing read yet.</td></tr>}
              {reading.map((r, i) => (
                <tr key={i}><td className="mono">{r.email}</td><td>{r.title_en}</td><td className="num">{mins(r.seconds)}</td><td className="num">{ts(r.last)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>Audit trail</h2>
        <div className="dr-tablewrap">
          <table className="dr-table">
            <thead><tr><th>When (UTC)</th><th>Who</th><th>Event</th><th>Document</th></tr></thead>
            <tbody>
              {events.map((e, i) => (
                <tr key={i}><td className="num">{ts(e.at)}</td><td className="mono">{e.email}</td><td><span className="dr-pill">{e.kind}</span></td><td>{e.title_en || '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  )
}
