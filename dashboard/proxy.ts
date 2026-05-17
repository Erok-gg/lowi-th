import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // ── Investor routes ──
  if (pathname.startsWith('/invest/') || pathname.startsWith('/api/invest/')) {
    // Public: exchange rate + login page + KYC UI pages (auth checked client-side)
    if (pathname.startsWith('/api/invest/exchange-rate')) return supabaseResponse
    if (pathname === '/invest/login') return supabaseResponse
    if (pathname === '/invest/kyc') return supabaseResponse
    if (pathname === '/invest/documents') return supabaseResponse
    // Protect API routes that write data
    if (pathname.startsWith('/api/invest/') && !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return supabaseResponse
  }

  // ── Investor profile ──
  if (pathname === '/profile' || pathname.startsWith('/api/profile')) {
    if (!user) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/invest/login?redirect=/profile', request.url))
    }
    return supabaseResponse
  }

  // ── Vitrine publique ──
  const isVitrinePublic =
    pathname === '/' ||
    pathname.startsWith('/a-propos') ||
    pathname.startsWith('/comment-ca-marche') ||
    pathname.startsWith('/projets')

  if (isVitrinePublic) return supabaseResponse

  // ── Admin routes ──
  const isPublic = pathname.startsWith('/login') ||
                   pathname.startsWith('/signup') ||
                   pathname.startsWith('/api/signup') ||
                   pathname.startsWith('/api/setup')

  if (!user && !isPublic) {
    // Don't redirect API calls — return 401 JSON so fetch() handles it gracefully
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
