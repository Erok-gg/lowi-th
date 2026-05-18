import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enforceRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit'

const TOTAL_PARTS = 73

// GET /api/invest/availability — total parts disponibles pour chalok-villa
// Auth requise (consommée uniquement par /invest/kyc côté investor).
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rate limit défensif (admin client + bypass RLS) : 60/IP/min
  const tooMany = enforceRateLimit(req, { scope: 'invest_availability', key: getClientIp(req), ...RATE_LIMITS.DEFAULT_POST_IP })
  if (tooMany) return tooMany

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
