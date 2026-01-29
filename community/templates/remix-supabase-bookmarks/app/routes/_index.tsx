import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "AI Bookmark Manager | Remix + Supabase + Tambo" },
    {
      name: "description",
      content:
        "An AI-powered bookmark manager built with Remix, Supabase, and Tambo",
    },
  ];
};

export default function Index() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <main className="w-full max-w-2xl space-y-8">
        {/* Logo and Title */}
        <div className="flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h1 className="text-center text-4xl font-bold text-slate-900">
            tambo bookmark manager
          </h1>
          <p className="mt-2 text-center text-slate-500">
            Remix + Supabase + Tambo AI
          </p>
        </div>

        {/* Get Started */}
        <div className="rounded-xl bg-white px-8 py-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            AI-Powered Bookmarks
          </h2>
          <p className="mb-4 text-slate-600">
            Save, organize, and find your bookmarks using natural language. Just
            chat with the AI to manage your links.
          </p>
          <ul className="mb-6 space-y-2 text-slate-600">
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              "Save https://remix.run as a tech resource"
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              "Find my bookmarks about React"
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              "Show all my categories"
            </li>
          </ul>
          <Link
            to="/login"
            className="inline-block rounded-lg bg-[#7FFFC3] px-6 py-3 font-medium text-slate-800 shadow-sm transition hover:bg-[#72e6b0]"
          >
            Get Started →
          </Link>
        </div>

        {/* How it works */}
        <div className="rounded-xl bg-white px-8 py-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            How it works:
          </h2>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-slate-400">📁</span>
              <span>
                <code className="rounded bg-slate-100 px-1 text-slate-800">
                  app/tambo/tools.ts
                </code>{" "}
                - AI tools for bookmark CRUD
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400">📁</span>
              <span>
                <code className="rounded bg-slate-100 px-1 text-slate-800">
                  app/tambo/components.ts
                </code>{" "}
                - Generative UI components
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400">📁</span>
              <span>
                <code className="rounded bg-slate-100 px-1 text-slate-800">
                  app/components/message-thread-full.tsx
                </code>{" "}
                - Chat with thread history
              </span>
            </li>
          </ul>
          <div className="mt-6">
            <a
              href="https://tambo.co/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-slate-200 px-6 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
            >
              View Docs
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
