import { Hanken_Grotesk, JetBrains_Mono } from 'next/font/google'
import './dataroom.css'

const sans = Hanken_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--sans' })
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--mono' })

export const metadata = {
  title: 'LOWI — Data Room',
  robots: { index: false, follow: false },
}

export default function DataRoomLayout({ children }) {
  return <div className={`dr ${sans.variable} ${mono.variable}`}>{children}</div>
}
