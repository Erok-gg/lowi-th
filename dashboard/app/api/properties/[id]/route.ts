import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { propertyUpdateSchema, parseOr400 } from '@/lib/validation'

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

// PATCH /api/properties/[id] — mise à jour si status=lead (Zod schema étendu)
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

  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const parsed = parseOr400(propertyUpdateSchema, raw)
  if (parsed instanceof NextResponse) return parsed

  // Filtre les undefined pour éviter de NULL out des colonnes non envoyées
  const patch: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(parsed)) {
    if (v !== undefined) patch[k] = v
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Aucun champ valide' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('properties')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
