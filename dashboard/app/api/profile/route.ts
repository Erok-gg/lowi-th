import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  // Champs autorisés — jamais is_superadmin, is_active, id
  const ALLOWED = ['display_name', 'first_name', 'last_name', 'nationality'] as const
  const patch: Record<string, unknown> = {}
  for (const key of ALLOWED) {
    if (key in body) {
      const val = body[key]
      if (val !== undefined && (typeof val === 'string' || val === null)) {
        patch[key] = typeof val === 'string' ? val.trim().slice(0, 100) : null
      }
    }
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
