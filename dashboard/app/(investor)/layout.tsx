import '../(public)/public.css'
import LowiNav from '../(public)/_components/LowiNav'
import SignOutButton from './_components/SignOutButton'

export default function InvestorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="inv-page">
      <LowiNav />

      <main>{children}</main>

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
