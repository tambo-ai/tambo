"use client";

import { useTamboThread, useTamboThreadInput } from "@tambo-ai/react";

export function ChatInterface() {
  const { thread, streaming } = useTamboThread();
  const { value, setValue, submit, isPending, error } = useTamboThreadInput();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isPending) return;
    await submit({ streamResponse: true });
    setValue("");
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!value.trim() || isPending) return;
      await submit({ streamResponse: true });
      setValue("");
    }
  };

  const quickPrompts = [
    "Show my profile",
    "Save a note saying hello world",
    "What note do you have for me?",
  ];

  const showSkeleton = isPending || streaming;
  let statusLabel = "Idle";
  if (streaming) {
    statusLabel = "Streaming response…";
  } else if (isPending) {
    statusLabel = "Sending…";
  }

  return (
    <div className="space-y-4 w-full">
      <div className="rounded-2xl border border-border bg-gradient-to-b from-background via-card to-background shadow-xl w-full flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${streaming ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`}
            />
            <p className="text-sm font-medium text-foreground">
              Tambo Assistant
            </p>
          </div>
          <p className="text-xs text-muted-foreground">{statusLabel}</p>
        </div>

        <div className="p-4 min-h-[420px] max-h-[620px] overflow-y-auto space-y-4 flex flex-col w-full">
          {thread.messages.length === 0 && !showSkeleton && (
            <div className="text-center text-muted-foreground py-16">
              <p className="font-medium">Send a message to start chatting</p>
              <p className="text-sm mt-2">
                Try: "Show my profile" or "Save a note saying hello world"
              </p>
            </div>
          )}

          {thread.messages.map((message) => (
            <div
              key={message.id}
              className={`flex w-full ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`min-w-0 max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground border border-border/60"
                }`}
              >
                {Array.isArray(message.content) ? (
                  message.content.map((part, i) =>
                    part.type === "text" ? (
                      <p
                        key={i}
                        className="whitespace-pre-wrap break-words leading-relaxed text-sm"
                      >
                        {part.text}
                      </p>
                    ) : null,
                  )
                ) : (
                  <p className="whitespace-pre-wrap break-words leading-relaxed text-sm">
                    {String(message.content)}
                  </p>
                )}
                {message.renderedComponent && (
                  <div className="mt-3 w-full min-w-0">
                    <div className="rounded-xl border border-border bg-background/80 p-3 shadow-inner w-full overflow-hidden">
                      {message.renderedComponent}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {showSkeleton && (
            <div className="flex justify-start animate-pulse">
              <div className="max-w-[70%] rounded-2xl px-4 py-3 border border-border/60 bg-muted/70 shadow-sm space-y-2">
                <div className="h-4 w-32 bg-muted-foreground/30 rounded" />
                <div className="h-4 w-48 bg-muted-foreground/30 rounded" />
              </div>
            </div>
          )}
        </div>

        <div className="px-4 pb-4 w-full">
          <div className="flex flex-wrap gap-2 mb-3">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="text-xs rounded-full border border-border px-3 py-1 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition whitespace-nowrap"
                onClick={() => setValue(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-2 w-full">
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Ask me to show your profile or save a note."
              className="w-full min-h-[110px] p-3 border border-input rounded-xl bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              disabled={isPending}
              onKeyDown={handleKeyDown}
            />
            {error && (
              <div className="text-sm text-destructive break-words">
                {error.message}
              </div>
            )}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-xs text-muted-foreground">
                Press Enter to send (Shift+Enter for newline)
              </div>
              <button
                type="submit"
                disabled={isPending || !value.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isPending ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 z-20 max-w-sm rounded-lg border border-destructive/40 bg-background shadow-lg">
          <div className="flex items-start gap-3 px-4 py-3">
            <div className="h-2 w-2 rounded-full bg-destructive mt-2" />
            <div>
              <p className="text-sm font-semibold text-destructive">
                Message failed
              </p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
