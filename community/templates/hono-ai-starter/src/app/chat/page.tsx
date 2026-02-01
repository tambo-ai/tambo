"use client";

import { useEffect, useRef } from "react";
import {
  TamboProvider,
  useTamboThread,
  useTamboThreadInput,
} from "@tambo-ai/react";
import { tools, components } from "@/lib/tambo";

function ChatInterface() {
  const { thread } = useTamboThread();
  const { value, setValue, submit, isPending } = useTamboThreadInput();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.messages, isPending]);

  return (
    <div className="flex flex-col h-full bg-background font-sans text-foreground">
      <header className="p-4 border-b border-border bg-card/50 flex justify-between items-center">
        <h1 className="text-sm font-semibold">Hono AI Starter</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-6">
        {thread.messages
          .filter((m) => m.role !== "tool")
          .map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-[85%] md:max-w-[70%] space-y-2">
                <div
                  className={`rounded-xl p-4 text-sm border ${message.role === "user" ? "bg-primary text-primary-foreground border-transparent" : "bg-muted/40 border-border"}`}
                >
                  {Array.isArray(message.content) ? (
                    message.content.map(
                      (b, i) => b.type === "text" && <p key={i}>{b.text}</p>,
                    )
                  ) : (
                    <p>{message.content as string}</p>
                  )}
                  {message.renderedComponent && (
                    <div className="mt-4 pt-4 border-t border-border/20">
                      {message.renderedComponent}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 md:p-10 border-t border-border">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="max-w-3xl mx-auto relative group"
        >
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ask about status or logs..."
            className="w-full bg-muted/20 border border-border rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
          />
          <button
            type="submit"
            disabled={!value || isPending}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-primary disabled:opacity-30"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <TamboProvider
      tools={tools}
      components={components}
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
    >
      <main className="h-screen w-screen flex flex-col">
        <ChatInterface />
      </main>
    </TamboProvider>
  );
}
