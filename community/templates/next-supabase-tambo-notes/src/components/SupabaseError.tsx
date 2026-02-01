'use client'

export function SupabaseError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-card border border-border rounded-lg p-8 text-center">
        <h1 className="text-2xl font-bold mb-4 text-card-foreground">Supabase Configuration Required</h1>
        <p className="text-muted-foreground mb-6">
          Please configure your Supabase environment variables to continue.
        </p>
        <div className="text-left bg-muted/50 rounded-md p-4 space-y-2 text-sm mb-6">
          <p className="font-medium text-foreground mb-2">Required Supabase variables:</p>
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
        <p className="text-sm text-muted-foreground mt-6">
          Create a <code className="bg-muted px-1.5 py-0.5 rounded">.env.local</code> file in the project root with these variables.
        </p>
      </div>
    </div>
  )
}
