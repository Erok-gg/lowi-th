/**
 * Rate limiting in-memory (LRU) — Sprint 10.
 *
 * Note : in-memory ne survit pas au redémarrage et n'est PAS partagé entre
 * instances serverless. Pour Vercel multi-region ou load-balanced :
 * migrer vers Upstash Redis. Pour MVP / single-instance c'est suffisant.
 *
 * Usage :
 *   const ratelimited = enforceRateLimit(req, {
 *     scope:    'signup',
 *     key:      getClientIp(req),
 *     max:      5,
 *     windowMs: 3600_000,
 *   })
 *   if (ratelimited) return ratelimited   // 429 NextResponse
 */
import { LRUCache } from 'lru-cache'
import { NextResponse } from 'next/server'

type Bucket = { count: number; resetAt: number }

// Une cache par "scope" pour isoler les compteurs entre routes
const stores = new Map<string, LRUCache<string, Bucket>>()

function getStore(scope: string): LRUCache<string, Bucket> {
  let s = stores.get(scope)
  if (!s) {
    s = new LRUCache<string, Bucket>({
      max: 10_000,
      ttl: 24 * 3600 * 1000, // GC après 24h
    })
    stores.set(scope, s)
  }
  return s
}

export type RateLimitResult =
  | { ok: true; remaining: number; resetAt: number }
  | { ok: false; retryAfterSec: number; resetAt: number }

export function rateLimit(opts: {
  scope: string
  key: string
  max: number
  windowMs: number
}): RateLimitResult {
  const store = getStore(opts.scope)
  const now = Date.now()
  const cur = store.get(opts.key)

  // Fenêtre expirée → reset
  if (!cur || cur.resetAt <= now) {
    const resetAt = now + opts.windowMs
    store.set(opts.key, { count: 1, resetAt })
    return { ok: true, remaining: opts.max - 1, resetAt }
  }

  if (cur.count >= opts.max) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((cur.resetAt - now) / 1000)),
      resetAt: cur.resetAt,
    }
  }

  cur.count += 1
  store.set(opts.key, cur)
  return { ok: true, remaining: opts.max - cur.count, resetAt: cur.resetAt }
}

/**
 * Extrait l'IP cliente. Priorité :
 *   1. x-forwarded-for (premier hop, public en environnement Vercel/Cloudflare)
 *   2. x-real-ip
 *   3. fallback "0.0.0.0" (jamais utilisé en prod)
 */
export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  const xri = req.headers.get('x-real-ip')
  if (xri) return xri.trim()
  return '0.0.0.0'
}

/**
 * Helper "tout-en-un" : applique le rate limit et retourne soit null (OK,
 * continue), soit un NextResponse 429 prêt à être renvoyé.
 */
export function enforceRateLimit(
  req: Request,
  opts: {
    scope: string
    key: string
    max: number
    windowMs: number
  },
): NextResponse | null {
  const result = rateLimit(opts)
  if (result.ok) return null

  return NextResponse.json(
    { error: 'Trop de requêtes. Réessayez plus tard.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfterSec),
        'X-RateLimit-Reset': String(result.resetAt),
      },
    },
  )
}

/**
 * Presets pour homogénéité (Sprint 10).
 */
export const RATE_LIMITS = {
  SIGNUP:           { max: 5,   windowMs: 3600_000 },      // 5/IP/heure
  PROPERTIES_POST:  { max: 10,  windowMs: 3600_000 },      // 10/user/heure
  PHOTOS_POST:      { max: 20,  windowMs: 3600_000 },      // 20/user/heure
  KYB_UPLOAD:       { max: 20,  windowMs: 3600_000 },      // 20/user/heure
  PROFILE_PATCH:    { max: 30,  windowMs: 3600_000 },      // 30/user/heure
  ADMIN_ACTION:     { max: 120, windowMs: 3600_000 },      // 120/admin/heure (review/transition/approve)
  DEFAULT_POST_IP:  { max: 60,  windowMs: 60_000 },        // 60/IP/min
} as const
