
const KeyFilesSection = () => (
  <div className="bg-white px-8 py-4">
    <h2 className="text-xl font-semibold mb-4">How it works:</h2>
    <ul className="space-y-4 text-gray-600">
      <li className="flex items-start gap-2">
        <span>📄</span>
        <span>
          <code className="font-medium">app/root.tsx</code> - Main layout
          with ClientTamboProvider
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span>📄</span>
        <span>
          <code className="font-medium font-mono">app/routes/chat.tsx</code> -
          Chat page with MCP integration
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span>📄</span>
        <span>
          <code className="font-medium font-mono">
            app/components/tambo/message-thread-full.tsx
          </code>{" "}
          - Chat UI
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span>📄</span>
        <span>
          <code className="font-medium font-mono">
            app/components/tambo/graph.tsx
          </code>{" "}
          - A generative graph component
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span>📄</span>
        <span>
          <code className="font-medium font-mono">
            app/services/population-stats.ts
          </code>{" "}
          - Example tool implementation with mock population data
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span className="text-blue-500">📄</span>
        <span>
          <code className="font-medium font-mono">app/lib/tambo.ts</code> -
          Component and tool registration
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span className="text-blue-500">📄</span>
        <span>
          <code className="font-medium font-mono">README.md</code> - For more
          details check out the README
        </span>
      </li>
    </ul>
    <div className="flex gap-4 flex-wrap mt-4">
      <a
        href="https://docs.tambo.co"
        target="_blank"
        rel="noopener noreferrer"
        className="px-6 py-3 rounded-md font-medium transition-colors text-lg mt-4 border border-gray-300 hover:bg-gray-50"
      >
        View Docs
      </a>
      <a
        href="https://tambo.co/dashboard"
        target="_blank"
        rel="noopener noreferrer"
        className="px-6 py-3 rounded-md font-medium transition-colors text-lg mt-4 border border-gray-300 hover:bg-gray-50"
      >
        Dashboard
      </a>
    </div>
  </div>
);

export default function Home() {
  const hasApiKey = !!import.meta.env.VITE_TAMBO_API_KEY;

  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center font-[family-name:var(--font-geist-sans)]">
      <main className="max-w-2xl w-full space-y-8">
        <div className="flex flex-col items-center">

          <h1 className="text-4xl text-center">React Router + Clerk + Tambo Starter Template</h1>
        </div>

        <div className="w-full space-y-8">
          <div className="bg-white px-8 py-4">
            <h2 className="text-xl font-semibold mb-4">Setup Checklist</h2>

            {hasApiKey ? (
              <div className="flex gap-4 flex-wrap">
                <a
                  href="/chat"
                  className="px-6 py-3 rounded-md font-medium shadow-sm transition-colors text-lg mt-4 bg-[#7FFFC3] hover:bg-[#72e6b0] text-gray-800"
                >
                  Go to Chat →
                </a>

              </div>
            ) : (
              <div className="p-4 border border-red-200 bg-red-50 rounded-md text-red-800">
                <p className="font-medium">Missing API Key</p>
                <p className="text-sm mt-1">Please add <code>VITE_TAMBO_API_KEY</code> to your <code>.env</code> file.</p>
              </div>
            )}
          </div>

          <KeyFilesSection />
        </div>
      </main>
    </div>
  );
}
