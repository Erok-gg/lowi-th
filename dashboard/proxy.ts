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
    // Exchange rate is fully public
    if (pathname.startsWith('/api/invest/exchange-rate')) return supabaseResponse
    // Login page: if already logged in, skip to redirect target
    if (pathname === '/invest/login') {
      if (user) {
        const redirectTo = request.nextUrl.searchParams.get('redirect') ?? '/invest/kyc'
        if (redirectTo.startsWith('http')) {
          const dest = new URL(redirectTo)
          dest.searchParams.set('lowi_session', '1')
          return NextResponse.redirect(dest.toString())
        }
        return NextResponse.redirect(new URL(redirectTo, request.url))
      }
      return supabaseResponse
    }
    // All other investor routes require auth
    if (!user) {
      const fullPath = pathname + (request.nextUrl.search || '')
      return NextResponse.redirect(new URL(`/invest/login?redirect=${encodeURIComponent(fullPath)}`, request.url))
    }
    return supabaseResponse
  }

  // ── Admin routes ──
  const isPublic = pathname.startsWith('/login') ||
                   pathname.startsWith('/signup') ||
                   pathname.startsWith('/api/signup') ||
                   pathname.startsWith('/api/setup')

  if (!user && !isPublic) {
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
