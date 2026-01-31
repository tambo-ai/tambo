"use client";

import { useTamboThread, useTamboThreadInput } from "@tambo-ai/react";

function ChatUI() {
  const { thread } = useTamboThread();
  const { value, setValue, submit, isPending } = useTamboThreadInput();

  const handleSend = () => {
    if (!value.trim() || isPending) return;
    submit();
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
        <header className="border-b border-border bg-card px-4 py-3 font-semibold text-card-foreground">
          Prisma Task Manager
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {thread.messages.map((m) => (
              <div key={m.id} className="space-y-2">
                {Array.isArray(m.content) &&
                  m.content.map((part, i) => {
                    if (part.type !== "text") return null;
                    if (part.text.trim().startsWith("{")) return null;
                    return (
                      <div
                        key={i}
                        className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground"
                      >
                        {part.text}
                      </div>
                    );
                  })}
                {m.renderedComponent &&
                  typeof m.renderedComponent === "object" && (
                    <div className="mt-2">{m.renderedComponent}</div>
                  )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 border-t border-border bg-card p-3">
          <input
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add task Buy milk"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={isPending || !value.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChatClient() {
  return <ChatUI />;
}
