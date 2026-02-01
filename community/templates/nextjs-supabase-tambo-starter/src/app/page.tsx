import { ApiKeyCheck } from "@/components/ApiKeyCheck";
import Image from "next/image";

/* ---------------- SYSTEM FILE MAP ---------------- */

const KeyFilesSection = () => (
  <section className="border border-border bg-card">
    <div className="border-b border-border bg-[#0c0e12] px-6 py-4">
      <h2 className="text-xs tracking-[0.3em] text-primary font-semibold">
        SYSTEM FILE MAP
      </h2>
    </div>

    <div className="px-6 py-5">
      <ul className="space-y-3 text-sm text-muted-foreground">
        {[
          ["src/app/layout.tsx", "Main application layout"],
          ["src/app/chat/page.tsx", "Chat interface with MCP"],
          ["src/app/interactables/page.tsx", "Interactive tooling"],
          ["src/components/tambo/message-thread-full.tsx", "Message thread UI"],
          ["src/components/tambo/graph.tsx", "Generative graph module"],
          ["src/services/population-stats.ts", "Mock population tool"],
          ["src/lib/tambo.ts", "Component & tool registry"],
          ["README.md", "Project documentation"],
        ].map(([file, desc]) => (
          <li key={file} className="flex gap-3">
            <span className="text-primary">▣</span>
            <span>
              <code className="font-mono text-foreground">{file}</code>{" "}
              <span className="text-muted-foreground">— {desc}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex gap-3 flex-wrap">
        <a
          href="https://docs.tambo.co"
          target="_blank"
          rel="noopener noreferrer"
          className="border border-border bg-secondary px-5 py-2 text-xs tracking-widest text-foreground hover:bg-muted transition-colors"
        >
          VIEW DOCS
        </a>

        <a
          href="https://tambo.co/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="border border-primary bg-primary px-5 py-2 text-xs tracking-widest text-primary-foreground hover:opacity-90 transition-opacity"
        >
          OPEN DASHBOARD
        </a>
      </div>
    </div>
  </section>
);

/* ---------------- HOME ---------------- */

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl p-10 space-y-10">

        {/* HEADER */}
        <header className="flex items-center gap-6 border border-border bg-card p-6">
          <Image
            src="/Octo-Icon.svg"
            alt="Tambo AI"
            width={56}
            height={56}
            priority
          />

          <div>
            <h1 className="text-lg tracking-[0.3em] font-semibold">
              TACTICAL OPS CONSOLE
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Secure chat & tooling environment
            </p>
          </div>
        </header>

        {/* INITIALIZATION */}
        <section className="border border-border bg-card">
          <div className="border-b border-border bg-[#0c0e12] px-6 py-4">
            <h2 className="text-xs tracking-[0.3em] text-primary font-semibold">
              INITIALIZATION CHECKLIST
            </h2>
          </div>

          <div className="px-6 py-5">
            <ApiKeyCheck>
              <div className="flex gap-3 flex-wrap">
                <a
                  href="/chat"
                  className="border border-primary bg-primary px-5 py-2 text-xs tracking-widest text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  ENTER CHAT
                </a>

                <a
                  href="/interactables"
                  className="border border-border bg-secondary px-5 py-2 text-xs tracking-widest text-foreground hover:bg-muted transition-colors"
                >
                  INTERACTABLES
                </a>
              </div>
            </ApiKeyCheck>
          </div>
        </section>

        {/* FILE MAP */}
        <KeyFilesSection />
      </div>
    </main>
  );
}
