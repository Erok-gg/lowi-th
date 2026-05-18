/**
 * Helper auth admin partagé — Sprint 10 post-audit.
 *
 * Avant : pattern dupliqué dans ~12 routes /api/admin/* avec 2 variantes
 * (inline check vs helper local). Refactor pour homogénéité.
 */
import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

type AssertResult =
  | { user: User; status: 200; msg: null }
  | { user: null; status: 401 | 403; msg: string }

/**
 * Vérifie que le user courant est superadmin.
 * Retourne soit { user } prêt à utiliser, soit { status, msg } pour 401/403.
 *
 * Usage :
 *   const { user, status, msg } = await assertSuperadmin()
 *   if (!user) return NextResponse.json({ error: msg }, { status })
 */
export async function assertSuperadmin(): Promise<AssertResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, status: 401, msg: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_superadmin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_superadmin) return { user: null, status: 403, msg: 'Forbidden' }

  return { user, status: 200, msg: null }
}

/**
 * Variant qui retourne directement une NextResponse en cas d'échec, ou null si OK.
 * Utile quand on veut early-return sans destructuring.
 */
export async function requireSuperadmin(): Promise<{ user: User } | { response: NextResponse }> {
  const r = await assertSuperadmin()
  if (!r.user) return { response: NextResponse.json({ error: r.msg }, { status: r.status }) }
  return { user: r.user }
}
