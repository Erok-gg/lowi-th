import Link from 'next/link'
import SignOutButton from './_components/SignOutButton'
import InvestorNav from './_components/InvestorNav'

export default function InvestorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="inv-page">
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--inv-border)',
        padding: '0 20px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--inv-white)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        gap: 16,
      }}>
        {/* Logo → vitrine */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{
            width: 28, height: 28,
            background: 'var(--inv-navy)',
            borderRadius: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--inv-gold)',
            fontWeight: 800,
            fontSize: 14,
            letterSpacing: -1,
          }}>L</div>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--inv-navy)', letterSpacing: '0.04em' }}>
            LOWI
          </span>
        </Link>

        {/* Navigation */}
        <InvestorNav />
      </header>

      {/* Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--inv-border)',
        padding: '16px 24px',
        textAlign: 'center',
        fontSize: 12,
        color: 'var(--inv-muted)',
        marginTop: 40,
      }}>
        © 2025 LOWI · Investissement immobilier fractionné · Thaïlande
        <span style={{ margin: '0 10px', opacity: 0.3 }}>·</span>
        <SignOutButton />
      </footer>
    </div>
  )
}
