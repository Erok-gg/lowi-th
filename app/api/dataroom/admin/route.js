// Actions du propriétaire : surligner / épingler un fichier, révoquer ou
// rétablir un membre. Réservé à la session propriétaire.
import { NextResponse } from 'next/server'
import { q, logEvent } from '@/lib/dataroom/db'
import { getOwner } from '@/lib/dataroom/auth'

export async function POST(req) {
  const owner = await getOwner()
  if (!owner) return new Response('Forbidden', { status: 403 })
  const f = await req.formData()
  const action = f.get('action')
  const id = String(f.get('id') || '')
  const email = String(f.get('email') || '')

  if (action === 'highlight' && /^[0-9a-f-]{36}$/.test(id))
    await q('update dataroom.files set highlighted = not highlighted, updated_at = updated_at where id=$1', [id])
  else if (action === 'pin' && /^[0-9a-f-]{36}$/.test(id))
    await q('update dataroom.files set pinned = not pinned where id=$1', [id])
  else if (action === 'revoke' && email && email !== owner.email) {
    await q("update dataroom.members set status='revoked' where email=$1", [email])
    await logEvent(owner.email, 'revoke', { req })
  } else if (action === 'restore' && email)
    await q("update dataroom.members set status='active' where email=$1", [email])

  return NextResponse.redirect(new URL('/data-room/admin', req.url), 303)
}
