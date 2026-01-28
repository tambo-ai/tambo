import { useTamboThread, useTamboThreadInput } from "@tambo-ai/react";
import { useEffect, useRef } from "react";

interface ChatPanelProps {
  onClose?: () => void;
}

export function ChatPanel({ onClose }: ChatPanelProps) {
  const { thread } = useTamboThread();
  const { value, setValue, submit, isPending } = useTamboThreadInput();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isPending) {
      submit();
    }
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900">
              <svg
                className="h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">AI Assistant</h2>
              <p className="text-xs text-slate-500">
                Ask me to manage your bookmarks
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close chat"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="chat-scroll flex-1 overflow-y-auto p-5">
        {!thread?.messages?.length ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <svg
                className="h-8 w-8 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h3 className="mb-2 font-semibold text-slate-900">
              Start a conversation
            </h3>
            <p className="mb-4 text-sm text-slate-500">Try asking:</p>
            <div className="space-y-2">
              {[
                "Save https://remix.run as Remix Docs",
                "Find my tech bookmarks",
                "Show my categories",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setValue(suggestion);
                  }}
                  className="block w-full rounded-lg border border-slate-200 px-4 py-2 text-left text-sm text-slate-600 transition-smooth hover:border-slate-300 hover:bg-slate-50"
                >
                  "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {thread.messages
              .filter((message) => {
                if (message.role === "tool") return false;
                if (message.role === "assistant") {
                  const textContent = extractTextContent(message.content);
                  const hasContent = textContent.trim().length > 0;
                  const hasComponent = Boolean(message.renderedComponent);
                  if (!hasContent && !hasComponent) return false;
                }
                return true;
              })
              .map((message) => {
                const textContent = extractTextContent(message.content);
                const hasText = textContent.trim().length > 0;
                const hasComponent = message.renderedComponent;

                if (!hasText && !hasComponent) return null;

                return (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[90%] rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-900"
                      }`}
                    >
                      {hasText && renderMessageContent(message.content)}
                      {message.renderedComponent && (
                        <div className="mt-3 rounded-xl bg-white p-1">
                          {message.renderedComponent}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            {isPending && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-slate-100 px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Ask about your bookmarks..."
              disabled={isPending}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm transition-smooth placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isPending || !value.trim()}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white transition-smooth hover:bg-slate-800 disabled:opacity-50"
            >
              {isPending ? (
                <svg
                  className="h-5 w-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Helper to extract text content from message
function extractTextContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (typeof part === "object" && part !== null) {
          if ("text" in part && typeof part.text === "string") {
            return part.text;
          }
        }
        return "";
      })
      .join(" ")
      .trim();
  }

  return "";
}

function renderMessageContent(content: unknown): React.ReactNode {
  // Debug: uncomment to see actual content structure
  // console.log("Message content:", JSON.stringify(content, null, 2));

  if (typeof content === "string") {
    // Check if it's a JSON string that looks like a tool result
    if (content.startsWith("{") && content.includes('"message"')) {
      try {
        const parsed = JSON.parse(content) as { message?: string };
        if (parsed.message) {
          return <p className="whitespace-pre-wrap">{parsed.message}</p>;
        }
      } catch {
        // Not valid JSON, render as-is
      }
    }
    return <p className="whitespace-pre-wrap">{content}</p>;
  }

  if (Array.isArray(content)) {
    const renderedParts: React.ReactNode[] = [];

    for (let i = 0; i < content.length; i++) {
      const part = content[i];

      if (typeof part === "string") {
        // Check if string is JSON tool result
        if (part.startsWith("{") && part.includes('"message"')) {
          try {
            const parsed = JSON.parse(part) as { message?: string };
            if (parsed.message) {
              renderedParts.push(
                <p key={i} className="whitespace-pre-wrap">
                  {parsed.message}
                </p>,
              );
              continue;
            }
          } catch {
            // Not valid JSON
          }
        }
        renderedParts.push(
          <p key={i} className="whitespace-pre-wrap">
            {part}
          </p>,
        );
        continue;
      }

      if (typeof part === "object" && part !== null) {
        // Direct object with message
        if ("message" in part) {
          const obj = part as { message: string };
          renderedParts.push(
            <p key={i} className="whitespace-pre-wrap">
              {obj.message}
            </p>,
          );
          continue;
        }

        // Content part with type
        if ("type" in part) {
          const typedPart = part as {
            type: string;
            text?: string;
            result?: unknown;
            content?: unknown;
          };

          if (typedPart.type === "text" && typedPart.text) {
            renderedParts.push(
              <p key={i} className="whitespace-pre-wrap">
                {typedPart.text}
              </p>,
            );
            continue;
          }

          // Handle tool results - extract just the message
          if (typedPart.type === "tool-result") {
            const result = (typedPart.result ?? typedPart.content) as
              | { message?: string }
              | undefined;
            if (result?.message) {
              renderedParts.push(
                <p key={i} className="whitespace-pre-wrap">
                  {result.message}
                </p>,
              );
            }
            // Skip rendering raw tool results
            continue;
          }
        }
      }
    }

    return renderedParts.length > 0 ? <>{renderedParts}</> : null;
  }

  // Handle single object (e.g., tool result)
  if (typeof content === "object" && content !== null) {
    const obj = content as { message?: string };
    if (obj.message) {
      return <p className="whitespace-pre-wrap">{obj.message}</p>;
    }
    // Don't render unknown objects as raw JSON
    return null;
  }

  return null;
}
