import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Superadmin check
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_superadmin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_superadmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get waitlist entry
  const { data: entry, error: fetchError } = await supabase
    .from('waitlist')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
  if (entry.status !== 'pending') return NextResponse.json({ error: 'Already processed' }, { status: 400 })

  const admin = createAdminClient()

  // Create Supabase auth user (invite_code = initial password)
  const { data: newUser, error: authError } = await admin.auth.admin.createUser({
    email: entry.email,
    password: entry.invite_code,
    email_confirm: true,
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  // Activate profile
  await admin
    .from('profiles')
    .update({ is_active: true })
    .eq('id', newUser.user.id)

  // Update waitlist status
  await supabase
    .from('waitlist')
    .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: user.id })
    .eq('id', id)

  // Audit log
  await supabase.from('audit_logs').insert({
    actor_id: user.id,
    actor_email: user.email,
    action: 'waitlist_approve',
    target_type: 'waitlist',
    target_id: entry.email,
    metadata: { new_user_id: newUser.user.id },
  })

  return NextResponse.json({ ok: true, invite_code: entry.invite_code })
}
