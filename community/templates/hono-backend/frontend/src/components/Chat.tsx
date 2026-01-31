import { useTamboThreadInput, useTamboThread } from "@tambo-ai/react";
import type React from "react";
import { DictationButton } from "./tambo/DictationButton.js";

export const Chat = () => {
  const { value, setValue, submit, isPending } = useTamboThreadInput();
  const { thread } = useTamboThread();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isPending) return;
    await submit();
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex-1 overflow-y-auto p-4">
        {thread.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <div className="mb-4 opacity-40">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-2xl font-semibold text-foreground mb-3">
              Start a conversation
            </p>
            <p className="text-sm max-w-[500px]">
              Try: "Create a bookmark for https://hono.dev" or "Show me all
              bookmarks"
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {thread.messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 items-start ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                    message.role === "user"
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-accent border-border text-muted-foreground"
                  }`}
                >
                  {message.role === "user" ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <path d="M9 9h6M9 15h6" />
                    </svg>
                  )}
                </div>
                <div
                  className={`flex-1 flex flex-col gap-3 ${
                    message.role === "user" ? "items-end" : ""
                  } max-w-[75%]`}
                >
                  <div
                    className={`px-5 py-4 rounded-lg shadow-sm ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {Array.isArray(message.content) ? (
                      message.content.map((part, i) =>
                        part.type === "text" ? (
                          <p
                            key={i}
                            className="m-0 break-words leading-relaxed"
                          >
                            {part.text}
                          </p>
                        ) : null,
                      )
                    ) : (
                      <p className="m-0 break-words leading-relaxed">
                        {String(message.content)}
                      </p>
                    )}
                  </div>
                  {message.renderedComponent && (
                    <div className="mt-3 w-full">
                      {message.renderedComponent}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isPending && (
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-accent border-2 border-border text-muted-foreground">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <path d="M9 9h6M9 15h6" />
                  </svg>
                </div>
                <div className="flex-1 flex flex-col gap-3 max-w-[75%]">
                  <div className="px-5 py-4 rounded-lg bg-secondary text-secondary-foreground shadow-sm">
                    <div className="flex gap-1.5 items-center py-2">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground animate-[typing_1.4s_infinite]" />
                      <span
                        className="w-2 h-2 rounded-full bg-muted-foreground animate-[typing_1.4s_infinite]"
                        style={{ animationDelay: "0.2s" }}
                      />
                      <span
                        className="w-2 h-2 rounded-full bg-muted-foreground animate-[typing_1.4s_infinite]"
                        style={{ animationDelay: "0.4s" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <form
        className="flex gap-3 py-6 px-8 border-t border-border bg-card"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ask me to create, update, or manage bookmarks..."
          disabled={isPending}
          className="flex-1 px-6 py-4 border-2 border-border rounded-lg bg-input text-foreground text-base outline-none transition-all focus:border-ring focus:ring-4 focus:ring-ring/20 disabled:opacity-60 disabled:cursor-not-allowed"
        />
        <DictationButton />
        <button
          type="submit"
          disabled={isPending || !value.trim()}
          className="px-8 py-4 border-0 rounded-lg bg-primary text-primary-foreground text-base font-semibold cursor-pointer transition-all whitespace-nowrap shadow-sm hover:opacity-90 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
        >
          {isPending ? "Sending..." : "Send"}
        </button>
      </form>
      <style>{`
        @keyframes typing {
          0%, 60%, 100% {
            opacity: 0.3;
            transform: translateY(0);
          }
          30% {
            opacity: 1;
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
};
