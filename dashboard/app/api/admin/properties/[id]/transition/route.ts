import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { assertSuperadmin } from '@/lib/admin-auth'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { sendEmail } from '@/lib/email'
import {
  submissionAccepted,
  submissionRejected,
  submissionActive,
  adminListingPublished,
} from '@/lib/email-templates'

const ALLOWED: Record<string, string[]> = {
  lead:      ['reviewing'],
  reviewing: ['accepted', 'rejected', 'lead'],
  accepted:  ['active', 'reviewing'],
  active:    ['closed'],
  rejected:  ['lead'],
  closed:    [],
}

const SITE_URL    = process.env.NEXT_PUBLIC_SITE_URL          || 'https://lowi-dashboard.vercel.app'
const ADMIN_TO    = process.env.ADMIN_ALERT_EMAIL             || 'lowi.platform@gmail.com'
const REJECT_TO   = process.env.SUBMISSIONS_CONTACT_EMAIL     || 'submissions@lowi.platform.com'

// POST /api/admin/properties/[id]/transition — change de statut + audit log + email
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { user, status, msg } = await assertSuperadmin()
  if (!user) return NextResponse.json({ error: msg }, { status })

  const tooMany = enforceRateLimit(req, { scope: 'admin_transition', key: user.id, ...RATE_LIMITS.ADMIN_ACTION })
  if (tooMany) return tooMany

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const newStatus = typeof body.status === 'string' ? body.status : null
  const notes     = typeof body.notes  === 'string' ? body.notes.slice(0, 2000) : null

  if (!newStatus) return NextResponse.json({ error: 'status requis' }, { status: 400 })

  const admin = createAdminClient()
  const { data: prop } = await admin
    .from('properties')
    .select('id, public_id, status, admin_notes, submitted_by, contact_email')
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

  // Audit log transition
  await admin.from('audit_logs').insert({
    actor_id:    user.id,
    actor_email: user.email ?? null,
    action:      'property_transition',
    target_type: 'property',
    target_id:   prop.public_id,
    metadata:    { from_status: prop.status, to_status: newStatus, notes },
  })

  // ── Emails fire-and-forget selon le nouveau statut ────────────────────
  void sendTransitionEmails({
    updated,
    submitterId: prop.submitted_by,
    submitterContactEmail: prop.contact_email,
    newStatus,
    actorId: user.id,
    actorEmail: user.email ?? null,
  })

  return NextResponse.json(updated)
}

// Helper sépare la logique email pour clarté
async function sendTransitionEmails(args: {
  updated: { public_id: string; title: string; property_type: string | null; location_city: string | null; location_country: string | null; estimated_value_thb: number | null; surface_sqm: number | null; bedrooms: number | null }
  submitterId: string | null
  submitterContactEmail: string | null
  newStatus: string
  actorId: string
  actorEmail: string | null
}) {
  const admin = createAdminClient()

  // Récupère l'email du submitter (priorité : contact_email, fallback profile.email)
  let submitterEmail = args.submitterContactEmail
  if (!submitterEmail && args.submitterId) {
    const { data: profile } = await admin.from('profiles').select('email').eq('id', args.submitterId).single()
    submitterEmail = profile?.email ?? null
  }

  const recap = {
    public_id:           args.updated.public_id,
    title:               args.updated.title,
    property_type:       args.updated.property_type,
    location_city:       args.updated.location_city,
    location_country:    args.updated.location_country,
    estimated_value_thb: args.updated.estimated_value_thb,
    surface_sqm:         args.updated.surface_sqm,
    bedrooms:            args.updated.bedrooms,
  }

  const meta = {
    propertyPublicId: args.updated.public_id,
    actorId:    args.actorId,
    actorEmail: args.actorEmail,
  }

  if (!submitterEmail) {
    console.warn('[transition] pas de submitter email — emails skip', recap.public_id)
  }

  if (args.newStatus === 'accepted' && submitterEmail) {
    await sendEmail({ to: submitterEmail, ...submissionAccepted(recap, SITE_URL),                ...meta, type: 'submission_accepted' })
  } else if (args.newStatus === 'rejected' && submitterEmail) {
    await sendEmail({ to: submitterEmail, ...submissionRejected(recap, SITE_URL, REJECT_TO),     ...meta, type: 'submission_rejected' })
  } else if (args.newStatus === 'active') {
    if (submitterEmail) {
      await sendEmail({ to: submitterEmail, ...submissionActive(recap, SITE_URL),                ...meta, type: 'submission_active' })
    }
    await sendEmail({   to: ADMIN_TO,       ...adminListingPublished(recap, SITE_URL, submitterEmail ?? '?'), ...meta, type: 'admin_listing_published' })
  }
}
