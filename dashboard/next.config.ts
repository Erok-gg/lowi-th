import type { NextConfig } from 'next'

const SUPABASE_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
  : '*.supabase.co'

const IS_DEV = process.env.NODE_ENV !== 'production'

// ── Content Security Policy ──────────────────────────────────────────────
// Notes :
//  - Next.js + Turbopack injectent du JS inline (hydratation, RSC). 'unsafe-inline'
//    sur script-src est requis en dev. En prod on essaie une nonce-based CSP
//    plus tard — pour le MVP on autorise 'unsafe-inline'.
//  - Supabase Storage : images publiques + signed URLs sur le même host.
//  - flagcdn.com : drapeaux dans LowiNav.
//  - Unsplash : images démos /projets.
//  - Google APIs : Drive upload (server-side, mais le navigateur peut récupérer
//    des prévisualisations / iframes — on autorise).
const CSP_DIRECTIVES: Record<string, string> = {
  'default-src':     `'self'`,
  'script-src':      `'self' 'unsafe-inline' ${IS_DEV ? "'unsafe-eval'" : ''}`,
  'style-src':       `'self' 'unsafe-inline'`,
  'img-src':         `'self' data: blob: https://${SUPABASE_HOST} https://*.supabase.co https://flagcdn.com https://images.unsplash.com`,
  'font-src':        `'self' data:`,
  'connect-src':     `'self' https://${SUPABASE_HOST} https://*.supabase.co wss://${SUPABASE_HOST}`,
  'frame-src':       `'self' https://drive.google.com`,
  'frame-ancestors': `'none'`,
  'form-action':     `'self'`,
  'base-uri':        `'self'`,
  'object-src':      `'none'`,
}

const CSP_STRING = Object.entries(CSP_DIRECTIVES)
  .map(([k, v]) => `${k} ${v.trim()}`)
  .join('; ')

const SECURITY_HEADERS = [
  // HSTS — force HTTPS sur 2 ans, inclusion sous-domaines, preloadable
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Anti-sniffing MIME
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  // Clickjacking (redondant avec CSP frame-ancestors mais bonne pratique)
  { key: 'X-Frame-Options',           value: 'DENY' },
  // Referrer
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  // Désactive l'auto-détection de fonctionnalités sensibles
  { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // CSP — laxiste en dev, strict en prod
  { key: 'Content-Security-Policy',   value: CSP_STRING },
]

const nextConfig: NextConfig = {
  serverExternalPackages: ['sharp'],
  images: {
    // Hosts autorisés pour next/image (cohérent avec CSP img-src)
    remotePatterns: [
      { protocol: 'https', hostname: SUPABASE_HOST,           pathname: '/storage/v1/object/public/**' },
      { protocol: 'https', hostname: '**.supabase.co',         pathname: '/storage/v1/object/public/**' },
      { protocol: 'https', hostname: 'flagcdn.com',            pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com',    pathname: '/**' },
    ],
  },
  async headers() {
    return [
      { source: '/:path*', headers: SECURITY_HEADERS },
    ]
  },
}

export default nextConfig
