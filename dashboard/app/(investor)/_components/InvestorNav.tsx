'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/properties/mine', label: 'Mes soumissions' },
  { href: '/profile',         label: 'Mon profil' },
]

export default function InvestorNav() {
  const pathname = usePathname()

  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {LINKS.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            style={{
              padding: '5px 12px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: active ? 600 : 400,
              color: active ? 'var(--inv-navy)' : 'var(--inv-muted)',
              background: active ? 'var(--inv-gray)' : 'transparent',
              textDecoration: 'none',
              transition: 'background .12s, color .12s',
            }}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
