import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/providers/theme-provider'
import { ClientErrorBoundary } from '@/components/ClientErrorBoundary'

export const metadata: Metadata = {
  title: 'NeuroDesk',
  description: 'A brain simulation app with Supabase authentication and Tambo AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ClientErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </ClientErrorBoundary>
      </body>
    </html>
  )
}
