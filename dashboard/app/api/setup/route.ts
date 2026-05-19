import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// One-time superadmin setup — only works if no superadmin exists.
// Auth via header (le secret en query param fuit dans les logs reverse proxy
// et l'historique navigateur — Sprint 10 post-audit, P2).
//
//   curl -X POST https://<host>/api/setup \
//     -H "Authorization: Bearer YOUR_SETUP_SECRET"
//
// Compat ascendante : on accepte aussi GET ?secret=... mais on log un warning.

async function handle(req: NextRequest, fromQueryParam: boolean) {
  const expected = process.env.SETUP_SECRET
  if (!expected) return NextResponse.json({ error: 'SETUP_SECRET not set' }, { status: 500 })

  // Header Authorization: Bearer <secret>
  let provided = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() ?? null

  // Fallback : query param ?secret=... (deprecated)
  if (!provided && fromQueryParam) {
    provided = req.nextUrl.searchParams.get('secret')
    if (provided) console.warn('[setup] secret reçu en query param — utiliser le header Authorization')
  }

  if (!provided || provided !== expected) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const email    = process.env.SUPERADMIN_EMAIL
  const password = process.env.SUPERADMIN_PASSWORD

  if (!email || !password) {
    return NextResponse.json(
      { error: 'SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD must be set in .env.local' },
      { status: 500 },
    )
  }

  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('is_superadmin', true)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Superadmin already exists.' }, { status: 409 })
  }

  const { data: newUser, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin
    .from('profiles')
    .update({ is_superadmin: true, is_active: true })
    .eq('id', newUser.user.id)

  return NextResponse.json({
    ok: true,
    message: `Superadmin created: ${email}. Login at /login. CHANGE YOUR PASSWORD.`,
  })
}

export async function POST(req: NextRequest) { return handle(req, false) }
export async function GET(req: NextRequest)  { return handle(req, true) }
