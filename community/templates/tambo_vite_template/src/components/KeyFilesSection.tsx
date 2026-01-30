export function KeyFilesSection() {
  return (
    <div className="bg-white px-8 py-4">
      <h2 className="text-xl font-semibold mb-4">How it works:</h2>

      <ul className="space-y-4 text-gray-600">
        <li>📄 <code>src/App.tsx</code> – App layout with TamboProvider</li>
        <li>📄 <code>src/pages/Home.tsx</code> – Landing page</li>
        <li>📄 <code>src/pages/ChatPage.tsx</code> – Chat UI</li>
        <li>📄 <code>src/pages/Interactables.tsx</code> – Component demos</li>
        <li>📄 <code>src/lib/tambo.ts</code> – Component + tool registry</li>
        <li>📄 <code>README.md</code> – Docs</li>
      </ul>

      <div className="flex gap-4 mt-4 flex-wrap">
        <a
          href="https://docs.tambo.co"
          target="_blank"
          className="border px-6 py-3 rounded-md hover:bg-gray-50"
        >
          View Docs
        </a>
        <a
          href="https://tambo.co/dashboard"
          target="_blank"
          className="border px-6 py-3 rounded-md hover:bg-gray-50"
        >
          Dashboard
        </a>
      </div>
    </div>
  );
}
