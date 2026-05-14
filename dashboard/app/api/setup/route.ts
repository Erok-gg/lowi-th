import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// One-time superadmin setup — only works if no superadmin exists
// Call: GET /api/setup?secret=YOUR_SETUP_SECRET
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')

  if (!secret || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const email    = process.env.SUPERADMIN_EMAIL
  const password = process.env.SUPERADMIN_PASSWORD

  if (!email || !password) {
    return NextResponse.json(
      { error: 'SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD must be set in .env.local' },
      { status: 500 }
    )
  }

  const admin = createAdminClient()

  // Check if superadmin already exists
  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('is_superadmin', true)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Superadmin already exists.' }, { status: 409 })
  }

  // Create auth user
  const { data: newUser, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Set superadmin flag
  await admin
    .from('profiles')
    .update({ is_superadmin: true, is_active: true })
    .eq('id', newUser.user.id)

  return NextResponse.json({
    ok: true,
    message: `Superadmin created: ${email}. Login at /login. CHANGE YOUR PASSWORD.`,
  })
}
