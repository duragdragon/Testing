import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'PSA Pokemon Card Finder',
  description: 'Find PSA Pokemon cards with low populations — discover undervalued investment opportunities',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 font-sans">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}
