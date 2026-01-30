'use client'

interface SetupRequiredProps {
  missingVars: {
    tambo?: boolean
    supabase?: boolean
  }
}

export function SetupRequired({ missingVars }: SetupRequiredProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-2xl w-full space-y-4">
        <h1 className="text-2xl font-bold mb-6 text-card-foreground text-center">
          Configuration Required
        </h1>

        {missingVars.tambo && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-3 text-card-foreground">
              Tambo API Configuration Required
            </h2>
            <p className="text-muted-foreground mb-4">
              Please configure your Tambo API key to use the AI chat features.
            </p>
            <div className="text-left bg-muted/50 rounded-md p-4 space-y-2 text-sm mb-4">
              <p className="font-medium text-foreground mb-2">Required variable:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <code className="bg-background px-1.5 py-0.5 rounded">NEXT_PUBLIC_TAMBO_API_KEY</code></li>
              </ul>
              <p className="font-medium text-foreground mb-2 mt-3">Optional variable:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <code className="bg-background px-1.5 py-0.5 rounded">NEXT_PUBLIC_TAMBO_API_URL</code> (only for custom endpoints, defaults to https://api.tambo.co)</li>
              </ul>
            </div>
            <div className="text-left bg-blue-500/10 border border-blue-500/20 rounded-md p-4 text-sm">
              <p className="font-medium text-blue-400 mb-2">How to get your API key:</p>
              <ol className="space-y-1 text-muted-foreground list-decimal list-inside">
                <li>Go to your <a href="https://tambo.co/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Tambo Dashboard</a></li>
                <li>Navigate to API Settings</li>
                <li>Copy your API key</li>
                <li>Add <code className="bg-blue-500/20 px-1 rounded">NEXT_PUBLIC_TAMBO_API_KEY=your_api_key</code> to your <code className="bg-blue-500/20 px-1 rounded">.env.local</code> file</li>
                <li>Restart your Next.js dev server</li>
              </ol>
            </div>
            <div className="text-left bg-amber-500/10 border border-amber-500/20 rounded-md p-4 text-sm mt-4">
              <p className="font-medium text-amber-400 mb-1">Note:</p>
              <p className="text-xs text-muted-foreground">
                The API key is exposed to the client (NEXT_PUBLIC_ prefix). This is the standard pattern for Tambo apps. 
                For production, ensure your API key has appropriate rate limits and access controls configured in the Tambo dashboard.
              </p>
            </div>
          </div>
        )}

        {missingVars.supabase && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-3 text-card-foreground">
              Supabase Configuration
            </h2>
            <p className="text-muted-foreground mb-4">
              Please configure your Supabase environment variables to continue.
            </p>
            <div className="text-left bg-muted/50 rounded-md p-4 space-y-2 text-sm mb-4">
              <p className="font-medium text-foreground mb-2">Required variables:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <code className="bg-background px-1.5 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code></li>
                <li>• <code className="bg-background px-1.5 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
              </ul>
            </div>
            <div className="text-left bg-blue-500/10 border border-blue-500/20 rounded-md p-4 text-sm">
              <p className="font-medium text-blue-400 mb-2">How to get these:</p>
              <ol className="space-y-1 text-muted-foreground list-decimal list-inside">
                <li>Go to your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Supabase Dashboard</a></li>
                <li>Select your project (or create a new one)</li>
                <li>Go to Settings → API</li>
                <li>Copy the Project URL and anon/public key</li>
              </ol>
            </div>
          </div>
        )}

        <p className="text-sm text-muted-foreground text-center mt-6">
          Create a <code className="bg-muted px-1.5 py-0.5 rounded">.env.local</code> file in the project root with these variables.
        </p>
      </div>
    </div>
  )
}
