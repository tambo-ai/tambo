'use client'

interface StreamingErrorProps {
  error: Error | string
  onRetry?: () => void
}

export function StreamingError({ error, onRetry }: StreamingErrorProps) {
  const errorMessage = typeof error === 'string' ? error : error.message
  const isAuthError = errorMessage.toLowerCase().includes('auth') || 
                     errorMessage.toLowerCase().includes('401') ||
                     errorMessage.toLowerCase().includes('403')

  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-400 mb-1">
            Streaming Error
          </h3>
          <p className="text-sm text-red-300/90 mb-3">{errorMessage}</p>
          
          {isAuthError && (
            <div className="bg-red-500/20 rounded-md p-3 mb-3">
              <p className="text-xs font-medium text-red-300 mb-1">Possible causes:</p>
              <ul className="text-xs text-red-200/80 space-y-1 list-disc list-inside">
                <li>Missing or invalid <code className="bg-red-500/30 px-1 rounded">TAMBO_API_KEY</code> in server environment</li>
                <li>API key not configured in <code className="bg-red-500/30 px-1 rounded">.env.local</code></li>
                <li>Server restart required after adding env var</li>
              </ul>
            </div>
          )}

          <div className="bg-red-500/20 rounded-md p-3 mb-3">
            <p className="text-xs font-medium text-red-300 mb-1">Troubleshooting:</p>
            <ul className="text-xs text-red-200/80 space-y-1 list-disc list-inside">
              <li>Check server logs for detailed error information</li>
              <li>Verify <code className="bg-red-500/30 px-1 rounded">TAMBO_API_KEY</code> is set (not <code className="bg-red-500/30 px-1 rounded">NEXT_PUBLIC_TAMBO_API_KEY</code>)</li>
              <li>Ensure API route <code className="bg-red-500/30 px-1 rounded">/api/tambo</code> is accessible</li>
              <li>Restart the Next.js dev server after changing env vars</li>
            </ul>
          </div>

          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs px-3 py-1.5 bg-red-500/20 border border-red-500/40 text-red-300 rounded-md hover:bg-red-500/30 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
