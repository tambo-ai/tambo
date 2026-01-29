import {
  TamboProvider,
  useTamboThread,
  useTamboThreadInput,
} from "@tambo-ai/react";
import { components, tools } from "../lib/tambo";
import { cn } from "../lib/utils";
import DictationButton from "./tambo/DictationButton";

const suggestions = [
  "Show me all users in a table",
  "Add a new user named Alice with email alice@example.com",
  "Create a bar graph showing user data",
  "How many users are in the database?",
  "Delete user with email test@example.com",
];

function ChatInterface() {
  const { thread } = useTamboThread();
  const { value, setValue, submit, isPending } = useTamboThreadInput();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      submit();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setValue(suggestion);
  };

  const showSuggestions = thread.messages.length === 0 && !isPending;

  return (
    <div className="flex flex-col h-screen bg-background text-foreground animate-in fade-in duration-500">
      {/* Header - Minimal and Clean */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Tambo AI Chat
            </h1>
          </div>
          <a
            href="/dashboard"
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          >
            ← Dashboard
          </a>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {showSuggestions && (
            <div className="text-center py-12 animate-in slide-in-from-bottom-4 duration-500 fade-in">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-6 text-primary">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight mb-2">
                How can I help you today?
              </h2>
              <p className="text-muted-foreground mb-8">
                I can help you manage users and visualize data.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto text-left">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="p-4 rounded-xl border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {thread.messages
            .filter(
              (m) =>
                (m.role as string) !== "tool" &&
                (m.role as string) !== "function",
            )
            .map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-4",
                  message.role === "user" ? "flex-row-reverse" : "flex-row",
                )}
              >
                <div
                  className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {message.role === "user" ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  )}
                </div>

                <div
                  className={cn(
                    "flex-1 space-y-4 max-w-[85%]",
                    message.role === "user" ? "text-right" : "text-left",
                  )}
                >
                  {/* Text content */}
                  <div
                    className={cn(
                      "inline-block rounded-2xl px-5 py-3 text-sm leading-relaxed",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-foreground",
                    )}
                  >
                    {Array.isArray(message.content) ? (
                      message.content.map((part, i) =>
                        part.type === "text" && part.text ? (
                          <p key={i} className="whitespace-pre-wrap">
                            {(part.text || "").replace(/^\[\]\s*/, "").trim()}
                          </p>
                        ) : null,
                      )
                    ) : (
                      <p className="whitespace-pre-wrap">
                        {String(message.content)}
                      </p>
                    )}
                  </div>

                  {/* Rendered component */}
                  {message.renderedComponent && (
                    <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
                      {message.renderedComponent}
                    </div>
                  )}
                </div>
              </div>
            ))}

          {isPending && (
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div className="bg-muted/50 rounded-2xl px-5 py-3 flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce"></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-background p-4">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="relative flex items-end gap-2 p-2 rounded-xl border border-input bg-background focus-within:ring-1 focus-within:ring-ring"
          >
            <DictationButton />
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 bg-transparent border-0 focus:ring-0 placeholder:text-muted-foreground text-foreground"
              disabled={isPending}
            />
            <button
              type="submit"
              disabled={isPending || !value.trim()}
              className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 12h14M12 5l7 7-7 7"
                />
              </svg>
            </button>
          </form>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Tambo can make mistakes. Please double check responses.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function TamboChat() {
  return (
    <TamboProvider
      apiKey={import.meta.env.PUBLIC_TAMBO_API_KEY}
      components={components}
      tools={tools}
    >
      <ChatInterface />
    </TamboProvider>
  );
}
