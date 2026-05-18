import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function assertSuperadmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, status: 401, msg: 'Unauthorized' } as const
  const { data: p } = await supabase.from('profiles').select('is_superadmin').eq('id', user.id).single()
  if (!p?.is_superadmin) return { user: null, status: 403, msg: 'Forbidden' } as const
  return { user, status: 200, msg: null } as const
}

// GET /api/admin/properties/[id] — détail complet + submitter
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { user, status, msg } = await assertSuperadmin()
  if (!user) return NextResponse.json({ error: msg }, { status })

  const admin = createAdminClient()
  const { data: prop, error } = await admin
    .from('properties')
    .select('*, property_photos(id, storage_path, position, width, height, uploaded_at)')
    .eq('id', id)
    .single()

  if (error || !prop) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Submitter profile
  let submitter = null
  if (prop.submitted_by) {
    const { data: profile } = await admin
      .from('profiles')
      .select('id, email, public_id, first_name, last_name')
      .eq('id', prop.submitted_by)
      .single()
    submitter = profile ?? null
  }

  return NextResponse.json({ ...prop, submitter })
}

// PATCH /api/admin/properties/[id] — mise à jour admin_notes uniquement
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { user, status, msg } = await assertSuperadmin()
  if (!user) return NextResponse.json({ error: msg }, { status })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const notes = typeof body.admin_notes === 'string' ? body.admin_notes.slice(0, 2000) : null

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('properties')
    .update({ admin_notes: notes })
    .eq('id', id)
    .select('id, admin_notes')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
