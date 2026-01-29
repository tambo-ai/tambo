import Image from "next/image";

export const Instructions = () => (
  <div className="bg-white px-8 py-4">
    <h2 className="text-xl font-semibold mb-4">How it works:</h2>
    <ul className="space-y-4 text-gray-600">
      <li className="flex items-start gap-2">
        <span>📄</span>
        <span>
          <code className="font-medium font-mono">app/layout.tsx</code> - Root
          layout with providers
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span>📄</span>
        <span>
          <code className="font-medium font-mono">app/page.tsx</code> - Landing
          page
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span>📄</span>
        <span>
          <code className="font-medium font-mono">
            app/dashboard/layout.tsx
          </code>{" "}
          - Dashboard layout
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span>📄</span>
        <span>
          <code className="font-medium font-mono">app/dashboard/page.tsx</code>{" "}
          - Dashboard page with AI chat access
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span>📄</span>
        <span>
          <code className="font-medium font-mono">
            components/tambo/message-thread-collapsible.tsx
          </code>{" "}
          - AI chat UI (Ctrl/Cmd+I to open, Escape to close)
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span>📄</span>
        <span>
          <code className="font-medium font-mono">
            components/tamboAuthentication/client-layout.tsx
          </code>{" "}
          - TamboProvider with user context (session → AI)
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span className="text-blue-500">📄</span>
        <span>
          <code className="font-medium font-mono">lib/tambo.ts</code> -
          Component and tool registration (BarChart, AddUserForm, getUsersData)
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span>📄</span>
        <span>
          <code className="font-medium font-mono">auth.ts</code> - NextAuth
          config (Google OAuth)
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span>📄</span>
        <span>
          <code className="font-medium font-mono">app/globals.css</code> -
          Global styles and theme variables
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
    <div className="flex gap-4 flex-wrap mt-4 items-center justify-center">
      <a
        href="https://docs.tambo.co"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-colors text-lg mt-4 border border-gray-300 hover:bg-gray-50"
      >
        <Image
          src="/logo/Octo-Icon.svg"
          alt="Tambo AI Logo"
          width={20}
          height={20}
        />
        <span>View Tambo Docs</span>
      </a>
    </div>
  </div>
);
