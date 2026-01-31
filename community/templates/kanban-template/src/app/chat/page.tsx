"use client";

import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { components, tools } from "@/lib/tambo";
import { TamboProvider } from "@tambo-ai/react";
import Image from "next/image";
import Link from "next/link";

export default function ChatPage() {
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
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
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
                chat
              </span>
            </div>
          </Link>
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← board
          </Link>
        </header>

        {/* Chat */}
        <div className="flex-1 overflow-hidden">
          <MessageThreadFull />
        </div>
      </div>
    </TamboProvider>
  );
}
