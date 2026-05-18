import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET     = 'property-kyb'
const SIGNED_TTL = 3600
const DECISIONS  = ['approved', 'rejected'] as const

async function assertSuperadmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, status: 401, msg: 'Unauthorized' } as const
  const { data: p } = await supabase.from('profiles').select('is_superadmin').eq('id', user.id).single()
  if (!p?.is_superadmin) return { user: null, status: 403, msg: 'Forbidden' } as const
  return { user, status: 200, msg: null } as const
}

// GET /api/admin/properties/[id]/kyb — liste docs + signed URLs pour review
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { user, status, msg } = await assertSuperadmin()
  if (!user) return NextResponse.json({ error: msg }, { status })

  const admin = createAdminClient()

  const { data: prop, error: propErr } = await admin
    .from('properties')
    .select('id, public_id, title, status, submitted_by, kyb_requested_at')
    .eq('id', id)
    .single()

  if (propErr || !prop) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Submitter profile pour contexte
  let submitter = null
  if (prop.submitted_by) {
    const { data: profile } = await admin
      .from('profiles')
      .select('id, email, public_id, first_name, last_name')
      .eq('id', prop.submitted_by)
      .single()
    submitter = profile ?? null
  }

  const { data: docs } = await admin
    .from('property_kyb_documents')
    .select('id, doc_type, storage_path, status, rejection_reason, uploaded_at, reviewed_at, reviewed_by')
    .eq('property_id', id)
    .order('uploaded_at', { ascending: true })

  const withUrls = await Promise.all((docs ?? []).map(async d => {
    const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(d.storage_path, SIGNED_TTL)
    return { ...d, signed_url: signed?.signedUrl ?? null }
  }))

  return NextResponse.json({ property: { ...prop, submitter }, docs: withUrls })
}

// POST /api/admin/properties/[id]/kyb — review un doc
// Body : { doc_id, decision: 'approved' | 'rejected', reason?: string }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { user, status, msg } = await assertSuperadmin()
  if (!user) return NextResponse.json({ error: msg }, { status })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const docId    = typeof body.doc_id   === 'string' ? body.doc_id   : null
  const decision = typeof body.decision === 'string' ? body.decision : null
  const reason   = typeof body.reason   === 'string' ? body.reason.slice(0, 500) : null

  if (!docId) return NextResponse.json({ error: 'doc_id requis' }, { status: 400 })
  if (!decision || !DECISIONS.includes(decision as typeof DECISIONS[number])) {
    return NextResponse.json({ error: 'decision invalide' }, { status: 400 })
  }
  if (decision === 'rejected' && !reason) {
    return NextResponse.json({ error: 'reason requis pour un refus' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: doc } = await admin
    .from('property_kyb_documents')
    .select('id, doc_type, property_id, status')
    .eq('id', docId)
    .eq('property_id', id)
    .single()

  if (!doc) return NextResponse.json({ error: 'Doc introuvable' }, { status: 404 })

  const patch = {
    status:           decision,
    rejection_reason: decision === 'rejected' ? reason : null,
    reviewed_at:      new Date().toISOString(),
    reviewed_by:      user.id,
  }

  const { data: updated, error } = await admin
    .from('property_kyb_documents')
    .update(patch)
    .eq('id', docId)
    .select('id, doc_type, status, rejection_reason, reviewed_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Audit log
  const { data: prop } = await admin.from('properties').select('public_id').eq('id', id).single()
  await admin.from('audit_logs').insert({
    actor_id:    user.id,
    actor_email: user.email ?? null,
    action:      'property_kyb_review',
    target_type: 'property_kyb_document',
    target_id:   prop?.public_id ?? id,
    metadata:    { doc_type: doc.doc_type, doc_id: docId, decision, reason, prev_status: doc.status },
  })

  return NextResponse.json(updated)
}
