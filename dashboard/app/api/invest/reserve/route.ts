import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const PRICE_PER_PART_THB = 100_000
const MIN_PARTS = 5
const TOTAL_PARTS = 73

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { parts_count, usd_rate, eur_rate } = await req.json()

  if (!parts_count || parts_count < MIN_PARTS)
    return NextResponse.json({ error: `Minimum ${MIN_PARTS} parts` }, { status: 400 })
  if (parts_count > TOTAL_PARTS)
    return NextResponse.json({ error: `Maximum ${TOTAL_PARTS} parts` }, { status: 400 })

  const admin = createAdminClient()

  // Check availability
  const { data: taken } = await admin
    .from('reservations')
    .select('parts_count')
    .eq('property_id', 'chalok-villa')
    .in('status', ['pending', 'confirmed'])

  const reservedParts = (taken ?? []).reduce((sum, r) => sum + r.parts_count, 0)
  const available = TOTAL_PARTS - reservedParts

  if (parts_count > available)
    return NextResponse.json({ error: `Seulement ${available} parts disponibles` }, { status: 400 })

  const total_thb = parts_count * PRICE_PER_PART_THB
  const total_usd = usd_rate ? +(total_thb / usd_rate).toFixed(2) : null
  const total_eur = eur_rate ? +(total_thb / eur_rate).toFixed(2) : null

  const { data: reservation, error } = await admin
    .from('reservations')
    .insert({
      user_id:            user.id,
      property_id:        'chalok-villa',
      parts_count,
      price_per_part_thb: PRICE_PER_PART_THB,
      total_thb,
      total_usd,
      total_eur,
      usd_rate,
      eur_rate,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, reservation_id: reservation.id, total_thb, total_usd, total_eur })
}
