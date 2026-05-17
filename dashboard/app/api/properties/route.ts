import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PROPERTY_TYPES = ['villa', 'condo', 'hotel', 'land', 'other']

function sanitize(val: unknown, max: number): string | null {
  if (typeof val !== 'string') return null
  const s = val.trim().slice(0, max)
  return s || null
}

function toPositiveInt(val: unknown): number | null {
  const n = Number(val)
  return Number.isInteger(n) && n > 0 ? n : null
}

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

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const title = sanitize(body.title, 200)
  if (!title) return NextResponse.json({ error: 'title requis' }, { status: 400 })

  const patch = {
    title,
    submitted_by: user.id,
    description:          sanitize(body.description, 2000),
    location_city:        sanitize(body.location_city, 100),
    location_country:     sanitize(body.location_country, 50) ?? 'TH',
    property_type:        PROPERTY_TYPES.includes(body.property_type as string) ? body.property_type : null,
    estimated_value_thb:  toPositiveInt(body.estimated_value_thb),
    surface_sqm:          toPositiveInt(body.surface_sqm),
    bedrooms:             toPositiveInt(body.bedrooms),
    contact_email:        sanitize(body.contact_email, 200),
  }

  const { data, error } = await supabase
    .from('properties')
    .insert(patch)
    .select('id, public_id, title, status')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
