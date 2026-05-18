import type { Metadata } from 'next'
import './globals.css'
import { LangProvider } from './(public)/_components/LangContext'

export const metadata: Metadata = {
  title: 'LOWI Admin',
  description: 'LOWI Internal Dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  )
}
