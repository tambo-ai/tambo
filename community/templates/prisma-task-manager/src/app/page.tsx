import { ApiKeyCheck } from "../components/ApiKeyCheck";
import Link from "next/link";

function KeyFilesSection() {
  const files = [
    { path: "src/app/layout.tsx", desc: "Root layout with fonts" },
    { path: "src/app/chat/page.tsx", desc: "Chat page with TamboProvider" },
    { path: "src/components/tambo/TaskList.tsx", desc: "Task list component" },
    { path: "src/app/api/tasks/route.ts", desc: "API routes for tasks" },
    { path: "src/lib/tambo.ts", desc: "Component and tool registration" },
    { path: "prisma/schema.prisma", desc: "Prisma schema" },
    { path: "README.md", desc: "Setup and usage" },
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-4 text-card-foreground">
      <p className="mb-3 font-semibold">How it works:</p>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {files.map((f) => (
          <li key={f.path} className="flex gap-2">
            <span>📄</span>
            <code className="rounded bg-muted px-1 font-mono text-xs">
              {f.path}
            </code>
            <span className="hidden sm:inline">- {f.desc}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href="https://docs.tambo.co"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded border border-border bg-muted px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/80"
        >
          View Docs
        </a>
        <a
          href="https://tambo.co/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded border border-border bg-muted px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/80"
        >
          Dashboard
        </a>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <ApiKeyCheck>
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight">
                Prisma Task Manager (Tambo Template)
              </h1>
              <p className="mt-2 text-muted-foreground">
                AI-powered task management with Tambo, Prisma, and SQLite.
              </p>
            </div>

            <KeyFilesSection />

            <div className="rounded-lg border border-border bg-card p-4 text-card-foreground">
              <p className="mb-3 font-semibold">Setup Checklist</p>
              <ul className="mb-4 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                <li>Run <code className="rounded bg-muted px-1 font-mono">npm install</code></li>
                <li>Copy <code className="rounded bg-muted px-1 font-mono">example.env.local</code> to <code className="rounded bg-muted px-1 font-mono">.env.local</code></li>
                <li>Add <code className="rounded bg-muted px-1 font-mono">NEXT_PUBLIC_TAMBO_API_KEY</code> and <code className="rounded bg-muted px-1 font-mono">DATABASE_URL</code></li>
                <li>Run <code className="rounded bg-muted px-1 font-mono">npx prisma migrate dev</code></li>
                <li>Run <code className="rounded bg-muted px-1 font-mono">npm run dev</code></li>
              </ul>
              <Link
                href="/chat"
                className="inline-flex items-center gap-1 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Go to Chat →
              </Link>
            </div>
          </div>
        </ApiKeyCheck>
      </div>
    </main>
  );
}
