import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { assertSuperadmin } from '@/lib/admin-auth'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, status, msg } = await assertSuperadmin()
  if (!user) return NextResponse.json({ error: msg }, { status })

  const tooMany = enforceRateLimit(req, { scope: 'admin_waitlist_reject', key: user.id, ...RATE_LIMITS.ADMIN_ACTION })
  if (tooMany) return tooMany

  const supabase = await createClient()

  await supabase
    .from('waitlist')
    .update({ status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: user.id })
    .eq('id', id)

  await supabase.from('audit_logs').insert({
    actor_id: user.id,
    actor_email: user.email,
    action: 'waitlist_reject',
    target_type: 'waitlist',
    target_id: id,
  })

  return NextResponse.json({ ok: true })
}
