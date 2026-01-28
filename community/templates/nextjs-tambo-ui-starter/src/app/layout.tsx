import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Tambo UI Playground - AI-Powered Dashboard Builder',
  description:
    'A starter template demonstrating AI-powered UI generation with Tambo. Chat with AI to build dynamic dashboards.',
  keywords: ['tambo', 'ai', 'dashboard', 'nextjs', 'ui-generation', 'starter-template'],
  authors: [{ name: 'Kaushalendra (@Kaushalendra-Marcus)' }],
  creator: 'Kaushalendra',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
          {children}
        </div>
      </body>
    </html>
  )
}
