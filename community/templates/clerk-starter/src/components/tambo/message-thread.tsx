"use client";

import {
    useTambo,
    useTamboGenerationStage,
    useTamboThreadInput,
} from "@tambo-ai/react";
import { FormEvent, useState } from "react";

export function MessageThread() {
  const { thread } = useTambo();
  const { isIdle } = useTamboGenerationStage();
  const { value: input, setValue: setInput, submit } = useTamboThreadInput();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // isIdle is true when not generating, false when streaming
  const isStreaming = !isIdle;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSubmitting || isStreaming) return;

    setIsSubmitting(true);
    try {
      await submit();
    } finally {
      setIsSubmitting(false);
    }
  };

  const messages = thread?.messages ?? [];

  return (
    <div className="flex flex-col h-full relative max-w-3xl mx-auto w-full">
      <div className="flex-1 overflow-y-auto px-4 sm:px-0 space-y-6 pb-24 scroll-smooth">
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="mb-4 p-3 bg-[var(--muted)] rounded-2xl">
              <span className="text-2xl">👋</span>
            </div>
            <p className="text-lg font-medium text-[var(--foreground)] mb-1">Welcome!</p>
            <p className="text-sm text-[var(--muted-foreground)] max-w-xs">
              Try asking: <code className="bg-[var(--muted)] px-1.5 py-0.5 rounded text-[var(--foreground)] font-mono text-xs">Show my profile</code>
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex w-full ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3.5 ${
                message.role === "user"
                  ? "bg-[var(--foreground)] text-[var(--background)] rounded-br-sm"
                  : "bg-[var(--card)] border border-[var(--border)] text-[var(--card-foreground)] rounded-bl-sm"
              }`}
            >
              {message.content.map((part, index) => {
                if (part.type === "text") {
                  return (
                    <p key={index} className="whitespace-pre-wrap leading-relaxed">
                      {part.text}
                    </p>
                  );
                }
                return null;
              })}
              {message.renderedComponent && (
                <div className="mt-4">{message.renderedComponent}</div>
              )}
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className="flex justify-start w-full">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl rounded-bl-sm px-5 py-4">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-[var(--muted-foreground)] rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-[var(--muted-foreground)] rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-[var(--muted-foreground)] rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/90 to-transparent pt-10">
        <form
          onSubmit={handleSubmit}
          className="flex gap-2 items-center bg-[var(--card)] p-1.5 rounded-full border border-[var(--border)] focus-within:ring-2 focus-within:ring-[var(--foreground)]/5 focus-within:border-[var(--foreground)]/20 transition-all shadow-sm"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={isSubmitting || isStreaming}
            className="flex-1 px-4 py-2 bg-transparent text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none disabled:opacity-50 text-base sm:text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSubmitting || isStreaming}
            className="p-2.5 bg-[var(--foreground)] text-[var(--background)] rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
