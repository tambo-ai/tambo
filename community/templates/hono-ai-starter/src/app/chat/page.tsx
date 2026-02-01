"use client";

import { useEffect, useRef } from "react";
import {
  TamboProvider,
  useTamboThread,
  useTamboThreadInput,
} from "@tambo-ai/react";
import { tools, components } from "@/lib/tambo";
import { ApiKeyCheck } from "@/components/ApiKeyCheck";

function ChatInterface() {
  const { thread } = useTamboThread();
  const { value, setValue, submit, isPending } = useTamboThreadInput();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [thread.messages, isPending]);

  return (
    <div className="flex flex-col h-full bg-background text-foreground transition-colors duration-300">
      <header className="p-4 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
          <h1 className="text-xs font-bold tracking-widest uppercase text-muted-foreground">
            Hono x Tambo
          </h1>
        </div>
        <div className="flex gap-2">
          <span className="text-[10px] bg-secondary px-2 py-0.5 rounded border border-border font-mono">
            EDGE_V1
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar">
        {thread.messages
          // FILTER: Hide raw tool logs from the UI to maintain a clean "Product" look
          .filter((msg) => msg.role !== "tool")
          .map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div className={`max-w-[90%] md:max-w-[75%] space-y-2`}>
                <div
                  className={`rounded-2xl p-4 text-sm border shadow-sm ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground border-transparent"
                      : "bg-card border-border text-card-foreground"
                  }`}
                >
                  {/* 1. RENDER CONTENT BLOCKS: Properly map the array instead of stringifying */}
                  <div className="space-y-3 leading-relaxed">
                    {Array.isArray(message.content) ? (
                      message.content.map((block, i) => {
                        if (block.type === "text") {
                          return <p key={i}>{block.text}</p>;
                        }
                        return null;
                      })
                    ) : (
                      <p>{message.content as string}</p>
                    )}
                  </div>

                  {/* 2. RENDER COMPONENTS: This is where your TaskList appears */}
                  {message.renderedComponent && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      {message.renderedComponent}
                    </div>
                  )}
                </div>

                <div
                  className={`flex items-center gap-2 px-1 text-[10px] uppercase tracking-tighter text-muted-foreground font-medium ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role}
                </div>
              </div>
            </div>
          ))}

        {isPending && (
          <div className="flex gap-1.5 p-4 items-center animate-pulse">
            <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 md:p-8 border-t border-border bg-background">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="max-w-4xl mx-auto relative group"
        >
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ask Hono to manage your tasks..."
            className="w-full bg-card border border-border rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-16"
          />
          <button
            type="submit"
            disabled={!value || isPending}
            className="absolute right-2 top-2 bottom-2 bg-primary text-primary-foreground px-4 rounded-xl hover:opacity-90 active:scale-95 disabled:opacity-20 transition-all flex items-center justify-center"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <main className="h-screen w-screen bg-background overflow-hidden font-sans">
      <ApiKeyCheck>
        <TamboProvider
          tools={tools}
          components={components}
          apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
        >
          <ChatInterface />
        </TamboProvider>
      </ApiKeyCheck>
    </main>
  );
}
