import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/public/properties — liste des propriétés actives (RLS public)
// Colonnes whitelist pour la grille /projets (vue carte).
export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('properties')
    .select(`
      id, public_id, title,
      property_type, location_city, location_country,
      estimated_value_thb, surface_sqm, bedrooms, bathrooms,
      irr_pct, distribution_pct, min_ticket_thb,
      lease_years, shares_total, shares_sold, funding_status,
      property_photos ( id, storage_path, position )
    `)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data ?? []).map(p => ({
    ...p,
    property_photos: (p.property_photos ?? []).sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
  }))

  return NextResponse.json(rows)
}
