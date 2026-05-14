import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('is_superadmin').eq('id', user.id).single()
  if (!profile?.is_superadmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const status = req.nextUrl.searchParams.get('status') ?? 'pending'

  const admin = createAdminClient()
  const { data: submissions } = await admin
    .from('kyc_submissions')
    .select('*, kyc_documents(document_type, drive_file_url, file_name, uploaded_at)')
    .eq('status', status)
    .order('submitted_at', { ascending: false })

  return NextResponse.json({ submissions: submissions ?? [] })
}
