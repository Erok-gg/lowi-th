import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { assertSuperadmin } from '@/lib/admin-auth'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, status, msg } = await assertSuperadmin()
  if (!user) return NextResponse.json({ error: msg }, { status })

  const tooMany = enforceRateLimit(req, { scope: 'admin_kyc_approve', key: user.id, ...RATE_LIMITS.ADMIN_ACTION })
  if (tooMany) return tooMany

  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: sub } = await admin
    .from('kyc_submissions').select('user_id, email').eq('id', id).single()
  if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await admin
    .from('kyc_submissions')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq('id', id)

  await supabase.from('audit_logs').insert({
    actor_id: user.id,
    actor_email: user.email,
    action: 'kyc_approve',
    target_type: 'kyc_submission',
    target_id: id,
    metadata: { user_email: sub.email },
  })

  return NextResponse.json({ ok: true })
}
