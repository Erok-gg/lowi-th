export default function InvestorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="inv-page">
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--inv-border)',
        padding: '0 24px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--inv-white)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32,
            background: 'var(--inv-navy)',
            borderRadius: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--inv-gold)',
            fontWeight: 800,
            fontSize: 16,
            letterSpacing: -1,
          }}>L</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--inv-navy)', letterSpacing: 1 }}>
            LOWI
          </span>
        </div>
        <span style={{ fontSize: 12, color: 'var(--inv-muted)' }}>
          Plateforme d&apos;investissement immobilier fractionné
        </span>
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
      </footer>
    </div>
  )
}
