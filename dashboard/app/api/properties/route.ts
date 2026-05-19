import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { propertyCreateSchema, parseOr400 } from '@/lib/validation'
import { sendEmail } from '@/lib/email'
import { submissionPending, adminNewSubmission } from '@/lib/email-templates'

const SITE_URL  = process.env.NEXT_PUBLIC_SITE_URL || 'https://lowi-dashboard.vercel.app'
const ADMIN_TO  = process.env.ADMIN_ALERT_EMAIL    || 'lowi.platform@gmail.com'

// GET /api/properties — liste les soumissions de l'utilisateur connecté
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('properties')
    .select('id, public_id, title, status, property_type, location_city, location_country, estimated_value_thb, created_at, updated_at, property_photos(count)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/properties — crée un lead
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // ── Email verification gate ─────────────────────────────────────────────
  // Pas de soumission si l'email n'est pas confirmé (anti-spam, traçabilité).
  if (!user.email_confirmed_at) {
    return NextResponse.json(
      { error: 'EMAIL_NOT_VERIFIED', message: 'Vérifiez votre email avant de soumettre un bien.' },
      { status: 403 },
    )
  }

  const tooMany = enforceRateLimit(req, { scope: 'properties_post', key: user.id, ...RATE_LIMITS.PROPERTIES_POST })
  if (tooMany) return tooMany

  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const parsed = parseOr400(propertyCreateSchema, raw)
  if (parsed instanceof NextResponse) return parsed

  const { data: created, error: insErr } = await supabase
    .from('properties')
    .insert({ ...parsed, submitted_by: user.id })
    .select('id, public_id, title, status, property_type, location_city, location_country, estimated_value_thb, surface_sqm, bedrooms')
    .single()

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

  // ── Récup lang préférée du submitter pour les emails ─────────────────
  const { data: profileLang } = await supabase
    .from('profiles')
    .select('preferred_lang')
    .eq('id', user.id)
    .single()
  const lang: 'fr' | 'en' | 'th' =
    profileLang?.preferred_lang === 'en' || profileLang?.preferred_lang === 'th'
      ? profileLang.preferred_lang
      : 'fr'

  // ── Emails (fire-and-forget — n'attend pas pour répondre au client) ───
  const recap = {
    public_id:           created.public_id,
    title:               created.title,
    property_type:       created.property_type,
    location_city:       created.location_city,
    location_country:    created.location_country,
    estimated_value_thb: created.estimated_value_thb,
    surface_sqm:         created.surface_sqm,
    bedrooms:            created.bedrooms,
  }
  const submitterEmail = parsed.contact_email || user.email!

  Promise.all([
    sendEmail({
      to: submitterEmail,
      ...submissionPending(recap, SITE_URL, lang),
      type: 'submission_pending',
      propertyPublicId: created.public_id,
      actorId: user.id,
      actorEmail: user.email,
    }),
    sendEmail({
      to: ADMIN_TO,
      ...adminNewSubmission(recap, SITE_URL, user.email ?? '?'),
      type: 'admin_new_submission',
      propertyPublicId: created.public_id,
      actorId: user.id,
      actorEmail: user.email,
    }),
  ]).catch(e => console.error('[POST properties] email failed', e))

  return NextResponse.json(created, { status: 201 })
}
