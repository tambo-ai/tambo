import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
      <div className="max-w-2xl space-y-6">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
          Hono AI Starter
        </h1>
        <p className="text-lg text-muted-foreground">
          A clean foundation for building edge-native AI applications with Hono
          and Tambo.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/chat"
            className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Open Chat
          </Link>
          <a
            href="https://github.com/tambo-ai/tambo-template"
            target="_blank"
            className="rounded-lg border border-border bg-muted/50 px-6 py-3 text-sm font-medium hover:bg-muted transition-colors"
          >
            View Docs
          </a>
        </div>
      </div>
    </div>
  );
}
