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

// ── Helpers de sanitisation ──
function str(val: unknown, max: number): string | null {
  if (val === null) return null
  if (typeof val !== 'string') return undefined as unknown as null  // pas dans body → ignoré
  const s = val.trim().slice(0, max)
  return s || null
}
function posInt(val: unknown): number | null | undefined {
  if (val === null) return null
  if (val === undefined || val === '') return undefined
  const n = Number(val)
  return Number.isInteger(n) && n >= 0 ? n : undefined
}
function pctNum(val: unknown): number | null | undefined {
  if (val === null) return null
  if (val === undefined || val === '') return undefined
  const n = Number(val)
  if (!Number.isFinite(n) || n < 0 || n > 999.99) return undefined
  return Math.round(n * 100) / 100
}
function strArray(val: unknown, maxItems: number, maxLen: number): string[] | null | undefined {
  if (val === null) return null
  if (!Array.isArray(val)) return undefined
  return val
    .filter((v): v is string => typeof v === 'string')
    .map(v => v.trim().slice(0, maxLen))
    .filter(v => v.length > 0)
    .slice(0, maxItems)
}

// Colonnes éditables par l'admin (whitelist stricte)
function buildPatch(body: Record<string, unknown>): Record<string, unknown> {
  const patch: Record<string, unknown> = {}
  const assignString = (key: string, max: number) => {
    if (key in body) {
      const v = str(body[key], max)
      if (v !== undefined) patch[key] = v
    }
  }
  const assignInt = (key: string) => {
    if (key in body) {
      const v = posInt(body[key])
      if (v !== undefined) patch[key] = v
    }
  }
  const assignPct = (key: string) => {
    if (key in body) {
      const v = pctNum(body[key])
      if (v !== undefined) patch[key] = v
    }
  }

  // base
  assignString('title', 200)
  assignString('description', 4000)
  assignString('location_city', 100)
  assignString('location_country', 50)
  if ('property_type' in body) {
    const allowed = ['villa', 'condo', 'hotel', 'land', 'bungalow', 'eco-resort', 'co-living', 'boutique-hotel', 'other']
    if (body.property_type === null) patch.property_type = null
    else if (typeof body.property_type === 'string' && allowed.includes(body.property_type)) {
      patch.property_type = body.property_type
    }
  }
  assignInt('estimated_value_thb')
  assignInt('surface_sqm')
  assignInt('bedrooms')
  assignInt('bathrooms')
  assignString('contact_email', 200)
  assignString('admin_notes', 2000)

  // pool_type enum
  if ('pool_type' in body) {
    if (body.pool_type === null || body.pool_type === '') patch.pool_type = null
    else if (typeof body.pool_type === 'string' && ['private', 'shared', 'none'].includes(body.pool_type)) {
      patch.pool_type = body.pool_type
    }
  }

  // financier
  assignPct('irr_pct')
  assignPct('distribution_pct')
  assignInt('min_ticket_thb')
  assignInt('lease_years')
  assignInt('lease_remaining_years')
  assignInt('lease_expiry_year')
  assignInt('shares_total')
  assignInt('shares_sold')

  // funding_status enum
  if ('funding_status' in body) {
    if (body.funding_status === null || body.funding_status === '') patch.funding_status = null
    else if (typeof body.funding_status === 'string' && ['open', 'full', 'soon'].includes(body.funding_status)) {
      patch.funding_status = body.funding_status
    }
  }

  // situation / amenities / juridique
  assignString('view_description', 200)
  assignString('beach_access', 200)
  assignString('airport_access', 200)
  assignString('hospital_access', 200)
  assignString('lease_type', 200)
  assignString('trustee_name', 200)
  assignString('arbitration_clause', 500)
  assignString('legal_note', 2000)
  assignString('investor_memo_url', 500)

  // amenities = string[]
  if ('amenities' in body) {
    const arr = strArray(body.amenities, 50, 80)
    if (arr !== undefined) patch.amenities = arr
  }

  return patch
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

// PATCH /api/admin/properties/[id] — mise à jour champs admin (notes + vitrine)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { user, status, msg } = await assertSuperadmin()
  if (!user) return NextResponse.json({ error: msg }, { status })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const patch = buildPatch(body)
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Aucun champ valide' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Charger état avant pour audit
  const { data: prev } = await admin
    .from('properties')
    .select('public_id')
    .eq('id', id)
    .single()

  const { data, error } = await admin
    .from('properties')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Audit (seulement les clés modifiées, pas les valeurs intégrales — éviter de logger des grosses descriptions)
  await admin.from('audit_logs').insert({
    actor_id:    user.id,
    actor_email: user.email ?? null,
    action:      'property_admin_update',
    target_type: 'property',
    target_id:   prev?.public_id ?? id,
    metadata:    { fields: Object.keys(patch) },
  })

  return NextResponse.json(data)
}
