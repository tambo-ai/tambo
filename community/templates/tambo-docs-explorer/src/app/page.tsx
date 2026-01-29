"use client";

import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { ThemeToggle } from "@/components/theme-toggle";
import { components } from "@/lib/tambo";
import { TamboProvider, useTamboThread } from "@tambo-ai/react";
import {
  BookOpen,
  Code2,
  Lightbulb,
  Link2,
  MessageSquare,
  Sparkles,
} from "lucide-react";

function SidebarContent() {
  const { sendThreadMessage } = useTamboThread();

  const exampleQueries = [
    { text: "Show me how to use useState", icon: Code2 },
    { text: "Explain useEffect hook", icon: Lightbulb },
    { text: "What hooks are related to useState?", icon: Link2 },
    { text: "Show me useCallback example", icon: Code2 },
  ];

  const handleQueryClick = (query: string) => {
    sendThreadMessage(query);
  };

  return (
    <aside className="w-72 border-r border-border bg-card md:flex flex-col hidden">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-foreground">
                DocsExplorer
              </span>
              <p className="text-[10px] text-muted-foreground">
                AI-Powered Docs
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Suggested Queries */}
      <div className="flex-1 overflow-auto p-4">
        <div className="mb-6">
          <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <MessageSquare className="w-3 h-3" />
            Try Asking
          </h3>
          <div className="flex flex-col gap-1.5">
            {exampleQueries.map((query) => (
              <button
                key={query.text}
                onClick={() => handleQueryClick(query.text)}
                className="group text-left text-sm px-3 py-2.5 rounded-lg bg-muted/30 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-200 border border-transparent hover:border-primary/20 flex items-center gap-2"
              >
                <query.icon className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                <span className="truncate">{query.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Features */}
        <div>
          <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Sparkles className="w-3 h-3" />
            Features
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
              <Code2 className="w-4 h-4 text-primary mb-1" />
              <span className="text-[11px] text-muted-foreground">
                Syntax Highlighting
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
              <Lightbulb className="w-4 h-4 text-amber-500 mb-1" />
              <span className="text-[11px] text-muted-foreground">
                Explanations
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
              <Link2 className="w-4 h-4 text-green-500 mb-1" />
              <span className="text-[11px] text-muted-foreground">
                Related Topics
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
              <Sparkles className="w-4 h-4 text-purple-500 mb-1" />
              <span className="text-[11px] text-muted-foreground">
                AI-Powered
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <a
          href="https://tambo.co"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors py-2 px-3 rounded-lg hover:bg-muted/50"
        >
          <Sparkles className="w-3 h-3" />
          Powered by Tambo
        </a>
      </div>
    </aside>
  );
}

export default function Home() {
  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      components={components}
      tamboUrl={process.env.NEXT_PUBLIC_TAMBO_URL}
    >
      <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
        <SidebarContent />

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col relative bg-muted/20">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />
          <MessageThreadFull />
        </main>
      </div>
    </TamboProvider>
  );
}
