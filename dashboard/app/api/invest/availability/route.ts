import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const TOTAL_PARTS = 73

export async function GET() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('reservations')
    .select('parts_count')
    .eq('property_id', 'chalok-villa')
    .in('status', ['pending', 'confirmed'])

  const reserved  = (data ?? []).reduce((sum, r) => sum + r.parts_count, 0)
  const available = TOTAL_PARTS - reserved

  return NextResponse.json({ total: TOTAL_PARTS, reserved, available })
}
