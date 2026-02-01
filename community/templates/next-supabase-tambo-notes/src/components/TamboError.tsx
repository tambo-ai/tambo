'use client'

export function TamboError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-card border border-border rounded-lg p-8 text-center">
        <h1 className="text-2xl font-bold mb-4 text-card-foreground">Tambo API Configuration Required</h1>
        <p className="text-muted-foreground mb-6">
          Please configure your Tambo API credentials to use the AI chat features.
        </p>
        <div className="text-left bg-muted/50 rounded-md p-4 space-y-2 text-sm mb-6">
          <p className="font-medium text-foreground mb-2">Required Tambo variables:</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• <code className="bg-background px-1.5 py-0.5 rounded">NEXT_PUBLIC_TAMBO_API_KEY</code></li>
            <li>• <code className="bg-background px-1.5 py-0.5 rounded">NEXT_PUBLIC_TAMBO_API_URL</code></li>
          </ul>
        </div>
        <div className="text-left bg-blue-500/10 border border-blue-500/20 rounded-md p-4 text-sm">
          <p className="font-medium text-blue-400 mb-2">How to get these:</p>
          <ol className="space-y-1 text-muted-foreground list-decimal list-inside">
            <li>Go to your <a href="https://tambo.co" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Tambo Dashboard</a></li>
            <li>Navigate to API Settings</li>
            <li>Copy your API key and API URL</li>
          </ol>
        </div>
        <p className="text-sm text-muted-foreground mt-6">
          Add these to your <code className="bg-muted px-1.5 py-0.5 rounded">.env.local</code> file.
        </p>
      </div>
    </div>
  )
}
