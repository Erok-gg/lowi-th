import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { profilePatchSchema, parseOr400 } from '@/lib/validation'

// GET /api/profile — profil de l'utilisateur connecté
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, display_name, first_name, last_name, nationality, public_id, created_at')
    .eq('id', user.id)
    .single()

  if (error) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  return NextResponse.json({
    ...data,
    email_confirmed_at: user.email_confirmed_at ?? null,
  })
}

// PATCH /api/profile — mise à jour des champs éditables
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tooMany = enforceRateLimit(req, { scope: 'profile_patch', key: user.id, ...RATE_LIMITS.PROFILE_PATCH })
  if (tooMany) return tooMany

  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  // Validation Zod stricte (refuse les clés non listées, max 100 chars)
  const parsed = parseOr400(profilePatchSchema, raw)
  if (parsed instanceof NextResponse) return parsed

  // Normaliser : strings vides → null (cohérent avec UI)
  const patch: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(parsed)) {
    if (v === undefined) continue
    patch[k] = typeof v === 'string' && v.trim() === '' ? null : v
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', user.id)
    .select('id, email, display_name, first_name, last_name, nationality, public_id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
