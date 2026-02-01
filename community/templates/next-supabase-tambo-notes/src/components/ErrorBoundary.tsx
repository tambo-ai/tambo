'use client'

import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Enhanced logging for streaming errors
    const errorMessage = error.message.toLowerCase()
    const isStreamingError = errorMessage.includes('stream') || 
                            errorMessage.includes('advance') ||
                            errorMessage.includes('fetch') ||
                            errorMessage.includes('network')
    
    if (isStreamingError) {
      console.error('[Client] Streaming error caught in ErrorBoundary:', {
        error: error.message,
        name: error.name,
        stack: error.stack?.substring(0, 500),
        componentStack: errorInfo.componentStack?.substring(0, 500),
        timestamp: new Date().toISOString(),
      })
      
      // Log URL if available in error
      if (error.stack) {
        const urlMatch = error.stack.match(/https?:\/\/[^\s]+/g)
        if (urlMatch) {
          console.error('[Client] Request URL from stack:', urlMatch[0])
        }
      }
    } else if (error.name === 'ChunkLoadError') {
      console.warn('Chunk load error detected. Try refreshing the page or restarting the dev server.')
    } else {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Handle chunk load errors gracefully
      if (this.state.error?.name === 'ChunkLoadError') {
        return (
          <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="max-w-md w-full bg-card border border-border rounded-lg p-8 text-center">
              <h1 className="text-2xl font-bold mb-4 text-card-foreground">Loading Error</h1>
              <p className="text-muted-foreground mb-6">
                A module failed to load. This is usually a temporary development issue.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
              >
                Reload Page
              </button>
              <p className="text-sm text-muted-foreground mt-4">
                If this persists, try restarting the dev server.
              </p>
            </div>
          </div>
        )
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="max-w-md w-full bg-card border border-border rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold mb-4 text-card-foreground">Something went wrong</h1>
            <p className="text-muted-foreground mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
