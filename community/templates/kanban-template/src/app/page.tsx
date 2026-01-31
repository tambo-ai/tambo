"use client";

import { KanbanBoard } from "@/components/tambo/kanban-board";
import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { components, tools } from "@/lib/tambo";
import { TamboProvider } from "@tambo-ai/react";
import Image from "next/image";

export default function Home() {
  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      components={components}
      tools={tools}
      tamboUrl={process.env.NEXT_PUBLIC_TAMBO_URL}
    >
      <div className="h-screen flex flex-col bg-background">
        {/* Header */}
        <header className="border-b border-border px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/Octo-Icon.svg"
              alt="Tambo"
              width={28}
              height={28}
              className="opacity-90"
            />
            <div className="flex items-baseline gap-2">
              <h1 className="text-lg font-display font-semibold tracking-tight">
                kanban
              </h1>
              <span className="text-xs text-muted-foreground font-light">
                powered by tambo
              </span>
            </div>
          </div>
          <a
            href="https://tambo.co"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            docs →
          </a>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Kanban Board */}
          <div className="flex-1 lg:flex-[7] overflow-auto bg-muted/30">
            <KanbanBoard />
          </div>

          {/* Chat Panel */}
          <div className="h-[45vh] lg:h-full lg:flex-[3] border-t lg:border-t-0 lg:border-l border-border bg-background">
            <MessageThreadFull />
          </div>
        </div>
      </div>
    </TamboProvider>
  );
}
