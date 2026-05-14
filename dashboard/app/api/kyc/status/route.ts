import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: submission } = await admin
    .from('kyc_submissions')
    .select('*, kyc_documents(*)')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ submission: submission ?? null })
}
