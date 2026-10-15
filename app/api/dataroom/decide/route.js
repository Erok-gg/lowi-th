// Décision du propriétaire sur une demande d'accès. Autorisé soit par la
// signature du lien reçu par e-mail, soit par une session propriétaire (admin).
import { NextResponse } from 'next/server'
import { one, q, logEvent } from '@/lib/dataroom/db'
import { checkDecideSig, createLoginToken, getOwner, ownerEmail } from '@/lib/dataroom/auth'
import { sendMail } from '@/lib/dataroom/mail'
import { loginMail } from '@/lib/dataroom/mails'

export async function POST(req) {
  const f = await req.formData()
  const id = String(f.get('id') || '')
  const action = f.get('action')
  const from = f.get('from') === 'admin' ? '/data-room/admin' : `/data-room/decide?id=${id}&sig=${f.get('sig') || ''}`
  const back = (s) => NextResponse.redirect(new URL(`${from}${from.includes('?') ? '&' : '?'}s=${s}`, req.url), 303)

  if (!/^[0-9a-f-]{36}$/.test(id) || !['approve', 'deny'].includes(action)) return back('invalid')
  if (!checkDecideSig(id, f.get('sig')) && !(await getOwner())) return back('forbidden')

  const r = await one("select * from dataroom.requests where id=$1", [id])
  if (!r) return back('invalid')
  if (r.status !== 'pending') return back('already')

  try {
    if (action === 'deny') {
      await q("update dataroom.requests set status='denied', decided_at=now() where id=$1", [id])
      await logEvent(ownerEmail(), 'deny', { req })
      return back('denied')
    }
    await q("update dataroom.requests set status='approved', decided_at=now() where id=$1", [id])
    const m = await one(
      `insert into dataroom.members (email, name, company, lang, status) values ($1,$2,$3,$4,'active')
       on conflict (email) do update set status='active', name=excluded.name, company=excluded.company
       returning *`,
      [r.email, r.name, r.company, r.lang],
    )
    const token = await createLoginToken(r.email, 72)
    await sendMail(loginMail(m, token, r.lang, true))
    await logEvent(ownerEmail(), 'approve', { req })
    return back('approved')
  } catch (e) {
    console.error('[dataroom decide]', e)
    return back('error')
  }
}
