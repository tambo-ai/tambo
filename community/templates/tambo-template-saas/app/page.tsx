import Link from "next/link";
import { ArrowRight, Zap, LayoutDashboard, Bot } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col">
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center md:py-24">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-secondary-foreground">
            Powered by Tambo AI
          </span>
        </div>

        <h1 className="mb-6 max-w-3xl text-4xl font-bold tracking-tight text-foreground md:text-6xl">
          Build AI-Powered SaaS Applications
        </h1>

        <p className="mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
          A production-ready starter template for building SaaS dashboards with
          Tambo&apos;s Generative UI SDK. Create dynamic, AI-driven interfaces
          that adapt to your users.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Open Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="https://docs.tambo.co"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Read Documentation
          </a>
        </div>
      </section>

      <section className="border-t border-border bg-muted/30 px-4 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-2xl font-bold text-foreground md:text-3xl">
            What&apos;s Included
          </h2>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <LayoutDashboard className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-card-foreground">
                SaaS Dashboard Layout
              </h3>
              <p className="text-sm text-muted-foreground">
                Professional layout with navigation, sidebar, and responsive
                design ready for production use.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-card-foreground">
                Tambo AI Integration
              </h3>
              <p className="text-sm text-muted-foreground">
                Pre-configured Tambo components with Zod schemas for
                AI-driven dynamic UI generation.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-card-foreground">
                Modern Tech Stack
              </h3>
              <p className="text-sm text-muted-foreground">
                Built with Next.js, TypeScript, and Tailwind CSS for a
                fast, type-safe development experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-4 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Built for the Tambo community
          </p>
          <div className="flex gap-6">
            <a
              href="https://github.com/tambo-ai/tambo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              GitHub
            </a>
            <a
              href="https://docs.tambo.co"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Documentation
            </a>
            <a
              href="https://discord.gg/dJNvPEHth6"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Discord
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
