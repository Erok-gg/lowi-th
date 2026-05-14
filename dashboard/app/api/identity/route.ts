import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { IdentityData } from '@/lib/identity'

// GET /api/identity — return current user's identity (or null)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data } = await admin
    .from('identity_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ identity: data ?? null })
}

// POST /api/identity — upsert current user's identity
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: Partial<IdentityData> = await req.json()

  const admin = createAdminClient()
  const { error } = await admin
    .from('identity_profiles')
    .upsert({
      user_id:       user.id,
      first_name:    body.first_name    ?? null,
      last_name:     body.last_name     ?? null,
      maiden_name:   body.maiden_name   ?? null,
      sex:           body.sex           ?? null,
      birth_date:    body.birth_date    ?? null,
      birth_place:   body.birth_place   ?? null,
      birth_country: body.birth_country ?? null,
      updated_at:    new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
