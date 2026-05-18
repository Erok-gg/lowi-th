import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PROPERTY_TYPES = ['villa', 'condo', 'hotel', 'land', 'bungalow', 'eco-resort', 'co-living', 'boutique-hotel', 'other']

function sanitize(val: unknown, max: number): string | null {
  if (typeof val !== 'string') return null
  const s = val.trim().slice(0, max)
  return s || null
}

function toPositiveInt(val: unknown): number | null {
  const n = Number(val)
  return Number.isInteger(n) && n > 0 ? n : null
}

// GET /api/properties/[id] — détail propriété + photos
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('properties')
    .select('*, property_photos(id, storage_path, position, width, height, uploaded_at)')
    .eq('id', id)
    .single()

  // RLS renvoie 0 lignes si pas owner → PGRST116 = not found
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

// PATCH /api/properties/[id] — mise à jour si status=lead
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: prop } = await supabase
    .from('properties')
    .select('id, status')
    .eq('id', id)
    .single()

  if (!prop) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (prop.status !== 'lead') {
    return NextResponse.json({ error: `Non modifiable (statut : ${prop.status})` }, { status: 403 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const patch: Record<string, unknown> = {}
  const title = sanitize(body.title, 200)
  if (title) patch.title = title
  if ('description' in body)       patch.description          = sanitize(body.description, 2000)
  if ('location_city' in body)     patch.location_city        = sanitize(body.location_city, 100)
  if ('location_country' in body)  patch.location_country     = sanitize(body.location_country, 50)
  if ('property_type' in body && PROPERTY_TYPES.includes(body.property_type as string)) {
    patch.property_type = body.property_type
  }
  const val = toPositiveInt(body.estimated_value_thb)
  if (val !== null) patch.estimated_value_thb = val
  const sqm = toPositiveInt(body.surface_sqm)
  if (sqm !== null) patch.surface_sqm = sqm
  const beds = toPositiveInt(body.bedrooms)
  if (beds !== null) patch.bedrooms = beds
  if ('contact_email' in body) patch.contact_email = sanitize(body.contact_email, 200)

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Aucun champ valide' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('properties')
    .update(patch)
    .eq('id', id)
    .select('id, public_id, title, status, property_type, location_city, location_country, estimated_value_thb, surface_sqm, bedrooms, description, contact_email, created_at, updated_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
