import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ALLOWED: Record<string, string[]> = {
  lead:      ['reviewing'],
  reviewing: ['accepted', 'rejected', 'lead'],
  accepted:  ['active', 'reviewing'],
  active:    ['closed'],
  rejected:  ['lead'],
  closed:    [],
}

// POST /api/admin/properties/[id]/transition — change de statut + audit log
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('is_superadmin').eq('id', user.id).single()
  if (!profile?.is_superadmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const newStatus = typeof body.status === 'string' ? body.status : null
  const notes     = typeof body.notes  === 'string' ? body.notes.slice(0, 2000) : null

  if (!newStatus) return NextResponse.json({ error: 'status requis' }, { status: 400 })

  const admin = createAdminClient()
  const { data: prop } = await admin
    .from('properties')
    .select('id, public_id, status, admin_notes')
    .eq('id', id)
    .single()

  if (!prop) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const allowed = ALLOWED[prop.status] ?? []
  if (!allowed.includes(newStatus)) {
    return NextResponse.json(
      { error: `Transition "${prop.status}" → "${newStatus}" non autorisée` },
      { status: 400 }
    )
  }

  const patch: Record<string, unknown> = { status: newStatus, updated_at: new Date().toISOString() }
  if (newStatus === 'accepted') patch.kyb_requested_at = new Date().toISOString()
  if (notes !== null) patch.admin_notes = notes

  const { data: updated, error: updateErr } = await admin
    .from('properties')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // Audit log
  await admin.from('audit_logs').insert({
    actor_id:    user.id,
    actor_email: user.email ?? null,
    action:      'property_transition',
    target_type: 'property',
    target_id:   prop.public_id,
    metadata:    { from_status: prop.status, to_status: newStatus, notes },
  })

  return NextResponse.json(updated)
}
