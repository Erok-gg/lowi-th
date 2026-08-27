export const metadata = {
  title: 'LOWI',
  description: 'Fractional real estate investment in Bangkok, Thailand.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
