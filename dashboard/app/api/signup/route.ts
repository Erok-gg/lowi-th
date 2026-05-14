import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateInviteCode } from '@/lib/utils'

const RATE_LIMIT_PER_HOUR = 3

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  try {
    const body = await req.json()
    const email: string = (body.email ?? '').trim().toLowerCase()

    // Honeypot
    if (body._trap) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }

    // Disposable email domains blacklist
    const BLOCKED_DOMAINS = ['mailinator.com','tempmail.com','guerrillamail.com','10minutemail.com','throwam.com']
    const domain = email.split('@')[1]
    if (BLOCKED_DOMAINS.includes(domain)) {
      return NextResponse.json({ error: 'Disposable email addresses are not accepted.' }, { status: 400 })
    }

    const supabase = await createClient()

    // Rate limit: check signup_attempts
    const since = new Date(Date.now() - 3600 * 1000).toISOString()
    const { count } = await supabase
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

    // Log attempt
    await supabase.from('signup_attempts').insert({ ip_address: ip, email })

    // Check if email already in waitlist
    const { data: existing } = await supabase
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

    const { error } = await supabase.from('waitlist').upsert({
      email,
      invite_code,
      status: 'pending',
      ip_address: ip,
      user_agent: req.headers.get('user-agent'),
      expires_at: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    }, { onConflict: 'email' })

    if (error) throw error

    // Audit log
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
