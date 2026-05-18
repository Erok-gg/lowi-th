import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateInviteCode } from '@/lib/utils'
import { enforceRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit'
import { signupSchema, parseOr400 } from '@/lib/validation'

const RATE_LIMIT_PER_HOUR = 5 // doublé : DB conserve l'historique, LRU bloque en amont

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)

  // Rate limit in-memory (fast first-line)
  const tooMany = enforceRateLimit(req, { scope: 'signup', key: ip, ...RATE_LIMITS.SIGNUP })
  if (tooMany) return tooMany

  try {
    const body = await req.json()

    // Honeypot (bots remplissent les inputs hidden) — reject silencieux 200 OK
    if (body && typeof body === 'object' && (body as { _trap?: unknown })._trap) {
      return NextResponse.json({ ok: true })
    }

    // Validation Zod
    const parsed = parseOr400(signupSchema, body)
    if (parsed instanceof NextResponse) return parsed
    const email = parsed.email

    // Disposable email domains blacklist
    const BLOCKED_DOMAINS = ['mailinator.com','tempmail.com','guerrillamail.com','10minutemail.com','throwam.com']
    const domain = email.split('@')[1]
    if (BLOCKED_DOMAINS.includes(domain)) {
      return NextResponse.json({ error: 'Disposable email addresses are not accepted.' }, { status: 400 })
    }

    // admin client bypasses RLS — required here because this route is anon
    // and the underlying tables (signup_attempts, waitlist) are locked down to superadmin.
    const admin    = createAdminClient()
    const supabase = await createClient()

    // Rate limit: check signup_attempts (admin, anon can't SELECT)
    const since = new Date(Date.now() - 3600 * 1000).toISOString()
    const { count } = await admin
      .from('signup_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .gte('attempted_at', since)

    if ((count ?? 0) >= RATE_LIMIT_PER_HOUR) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Log attempt (admin, anon has INSERT but no SELECT — write is fine via admin too)
    await admin.from('signup_attempts').insert({ ip_address: ip, email })

    // Check if email already in waitlist (admin, anon can't SELECT)
    const { data: existing } = await admin
      .from('waitlist')
      .select('id, status')
      .eq('email', email)
      .single()

    if (existing) {
      if (existing.status === 'approved') {
        return NextResponse.json({ error: 'This email already has an account.' }, { status: 409 })
      }
      if (existing.status === 'pending') {
        return NextResponse.json({ error: 'A request for this email is already pending.' }, { status: 409 })
      }
      // Rejected — allow re-signup
    }

    const invite_code = generateInviteCode()

    // UPSERT waitlist (admin — anon can INSERT but UPDATE on conflict requires bypass)
    const { error } = await admin.from('waitlist').upsert({
      email,
      invite_code,
      status: 'pending',
      ip_address: ip,
      user_agent: req.headers.get('user-agent'),
      expires_at: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    }, { onConflict: 'email' })

    if (error) throw error

    // Audit log — supabase (anon client) is fine: "anon insert logs" policy allows
    // INSERT when actor_id IS NULL.
    await supabase.from('audit_logs').insert({
      action: 'signup_request',
      target_type: 'waitlist',
      target_id: email,
      ip_address: ip,
      metadata: { email },
    })

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('[signup]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
