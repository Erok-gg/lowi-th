import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { assertSuperadmin } from '@/lib/admin-auth'

// GET /api/admin/properties?status=lead
export async function GET(req: NextRequest) {
  const { user, status, msg } = await assertSuperadmin()
  if (!user) return NextResponse.json({ error: msg }, { status })

  const statusFilter = req.nextUrl.searchParams.get('status') // null = tous

  const admin = createAdminClient()
  const query = admin
    .from('properties')
    .select('id, public_id, title, status, property_type, location_city, location_country, estimated_value_thb, submitted_by, created_at, updated_at, property_photos(count)')
    .order('created_at', { ascending: false })

  const { data: rows, error } = statusFilter
    ? await query.eq('status', statusFilter)
    : await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Enrichir avec les emails des soumettants
  const ids = [...new Set((rows ?? []).map(r => r.submitted_by).filter(Boolean))] as string[]
  const profileMap: Record<string, { email: string; public_id: string | null }> = {}
  if (ids.length) {
    const { data: profiles } = await admin.from('profiles').select('id, email, public_id').in('id', ids)
    for (const p of profiles ?? []) profileMap[p.id] = { email: p.email, public_id: p.public_id }
  }

  return NextResponse.json(
    (rows ?? []).map(r => ({ ...r, submitter: r.submitted_by ? (profileMap[r.submitted_by] ?? null) : null }))
  )
}
