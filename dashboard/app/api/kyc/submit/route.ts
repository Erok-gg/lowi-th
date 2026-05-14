import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { identityComplete } from '@/lib/identity'

const REQUIRED_DOCS = ['id_front', 'id_back', 'address_proof', 'selfie', 'fund_origin']

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Check identity complete
  const { data: identity } = await admin
    .from('identity_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!identity || !identityComplete(identity as Parameters<typeof identityComplete>[0]))
    return NextResponse.json({ error: 'Informations personnelles incomplètes' }, { status: 400 })

  const { data: submission } = await admin
    .from('kyc_submissions')
    .select('id, status, kyc_documents(document_type)')
    .eq('user_id', user.id)
    .single()

  if (!submission) return NextResponse.json({ error: 'No KYC started' }, { status: 404 })
  if (submission.status === 'pending' || submission.status === 'approved')
    return NextResponse.json({ error: 'Already submitted' }, { status: 400 })

  const uploaded = (submission.kyc_documents as { document_type: string }[]).map(d => d.document_type)
  const missing  = REQUIRED_DOCS.filter(d => !uploaded.includes(d))
  if (missing.length > 0)
    return NextResponse.json({ error: 'Documents manquants', missing }, { status: 400 })

  await admin
    .from('kyc_submissions')
    .update({ status: 'pending', submitted_at: new Date().toISOString() })
    .eq('id', submission.id)

  return NextResponse.json({ ok: true })
}
