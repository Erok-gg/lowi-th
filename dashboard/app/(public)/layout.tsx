import './public.css'
import { LangProvider } from './_components/LangContext'
import LowiNav from './_components/LowiNav'
import LowiHalo from './_components/LowiHalo'
import LowiFooter from './_components/LowiFooter'

export const metadata = {
  title: 'LOWI — Co-investissez en Thaïlande',
  description: "Investissement immobilier fractionné en Thaïlande. Parts à partir de 500 000 THB. Distributions trimestrielles.",
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <div className="lowi-public">
        <LowiHalo />
        <LowiNav />
        <main>{children}</main>
        <LowiFooter />
      </div>
    </LangProvider>
  )
}
