// Actions du propriétaire : surligner / épingler un fichier, révoquer ou
// rétablir un membre. Réservé à la session propriétaire.
import { NextResponse } from 'next/server'
import { q, logEvent } from '@/lib/dataroom/db'
import { getOwner } from '@/lib/dataroom/auth'

export async function POST(req) {
  const owner = await getOwner()
  if (!owner) return new Response('Forbidden', { status: 403 })

  // Description éditée en place depuis la liste des fichiers (fetch JSON).
  if (req.headers.get('content-type')?.includes('application/json')) {
    const b = await req.json().catch(() => ({}))
    if (b.action !== 'describe' || !/^[0-9a-f-]{36}$/.test(String(b.id))) return new Response(null, { status: 400 })
    const col = b.lang === 'fr' ? 'desc_fr' : 'desc_en'
    const text = String(b.text ?? '').trim().slice(0, 300) || null
    await q(`update dataroom.files set ${col} = $2 where id = $1`, [b.id, text])
    return new Response(null, { status: 204 })
  }

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
