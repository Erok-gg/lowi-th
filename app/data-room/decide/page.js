// Page ouverte depuis l'e-mail « nouvelle demande » : le propriétaire voit la
// demande et tranche. Protégée par la signature du lien.
import { one } from '@/lib/dataroom/db'
import { checkDecideSig } from '@/lib/dataroom/auth'
import { TopBar } from '../parts'

export const dynamic = 'force-dynamic'

const MSG = {
  approved: 'Access granted — the investor has been e-mailed a personal link (valid 72 h).',
  denied: 'Request declined. No e-mail was sent to the requester.',
  already: 'This request has already been decided.',
  forbidden: 'This link is not valid.',
  invalid: 'Invalid request.',
  error: 'Something went wrong — nothing was changed. Try again.',
}

export default async function Decide({ searchParams }) {
  const sp = await searchParams
  const id = String(sp?.id || '')
  const sig = String(sp?.sig || '')
  const ok = /^[0-9a-f-]{36}$/.test(id) && checkDecideSig(id, sig)
  const r = ok ? await one('select * from dataroom.requests where id=$1', [id]) : null
  return (
    <>
      <TopBar lang="en" />
      <main className="dr-gate" style={{ gridTemplateColumns: 'minmax(0,640px)', justifyContent: 'center' }}>
        <div className="dr-card">
          {sp?.s && MSG[sp.s] && <div className={`dr-flash ${['forbidden', 'invalid', 'error'].includes(sp.s) ? 'dr-flash--bad' : ''}`}>{MSG[sp.s]}</div>}
          {!r ? (
            <p>This link is not valid.</p>
          ) : (
            <>
              <h2>Access request</h2>
              <p style={{ marginBottom: 8 }}>
                <strong style={{ color: 'var(--ink)' }}>{r.name}</strong> · {r.email}
                {r.company ? ` · ${r.company}` : ''}
              </p>
              <p className="mono" style={{ color: 'var(--ink-3)' }}>
                {new Date(r.created_at).toISOString().slice(0, 16).replace('T', ' ')} UTC · {r.lang.toUpperCase()} · {r.status}
              </p>
              {r.message && (
                <p style={{ whiteSpace: 'pre-wrap', background: 'var(--sunken)', padding: '12px 14px', borderRadius: 6, color: 'var(--ink)' }}>
                  {r.message}
                </p>
              )}
              {r.status === 'pending' && (
                <form action="/api/dataroom/decide" method="post" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="sig" value={sig} />
                  <button className="dr-btn dr-btn--primary" name="action" value="approve" type="submit">Grant access</button>
                  <button className="dr-btn dr-btn--danger" name="action" value="deny" type="submit">Decline</button>
                </form>
              )}
            </>
          )}
        </div>
      </main>
    </>
  )
}
