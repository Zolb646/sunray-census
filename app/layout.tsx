import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { clerkLocalization } from '@/lib/clerk-localization'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sunray удирдлагын самбар',
  description:
    'Sunray эмэгтэй хувцасны дэлгүүрийн удирдлагын самбар',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider localization={clerkLocalization}>
      <html lang='mn'>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
