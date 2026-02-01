'use client'

import { ErrorBoundary } from './ErrorBoundary'

export function ClientErrorBoundary({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}
