import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Colonnes vitrine — whitelist (pas de admin_notes, contact_email, submitted_by, kyb_*)
const PUBLIC_COLUMNS = `
  id, public_id, title, description,
  property_type, location_city, location_country,
  estimated_value_thb, surface_sqm, bedrooms, bathrooms, pool_type,
  view_description, amenities,
  beach_access, airport_access, hospital_access,
  irr_pct, distribution_pct, min_ticket_thb,
  lease_years, lease_remaining_years, lease_expiry_year,
  lease_type, trustee_name, arbitration_clause, legal_note,
  shares_total, shares_sold, funding_status,
  investor_memo_url,
  created_at, updated_at,
  property_photos ( id, storage_path, position, width, height )
`

// GET /api/public/properties/[publicId] — détail propriété active
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  const { publicId } = await params

  if (!/^prop_[A-Za-z0-9]+$/.test(publicId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('properties')
    .select(PUBLIC_COLUMNS)
    .eq('status', 'active')
    .eq('public_id', publicId)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const photos = (data.property_photos ?? []).sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  return NextResponse.json({ ...data, property_photos: photos })
}
