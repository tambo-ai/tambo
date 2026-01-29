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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        submit();
      }
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setValue(suggestion);
  };

  const showSuggestions = thread.messages.length === 0 && !isPending;

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-sans">
      {/* Header */}
      <div className="border-b border-border bg-background px-6 py-4 sticky top-0 z-10 flex items-center justify-center gap-4">
        <a
          href="https://tambo.co"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0"
        >
          <img
            src="/Octo-Icon.svg"
            alt="Tambo AI Logo"
            width="32"
            height="32"
            className="w-8 h-8"
          />
        </a>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Tambo AI Chat
        </h1>
        <a
          href="/dashboard"
          className="ml-auto px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
        >
          Dashboard
        </a>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-8 scroll-smooth">
        <div className="max-w-3xl mx-auto space-y-2">
          {showSuggestions && (
            <div className="text-center py-12 animate-in slide-in-from-bottom-4 duration-500 fade-in">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-muted rounded-xl mb-6 text-foreground">
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
                    className="p-4 rounded-xl border border-border bg-background hover:bg-muted transition-colors text-sm text-center md:text-left text-foreground"
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
                (m.role as string) !== "function" &&
                (m.role as string) !== "system",
            )
            .map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex w-full",
                  message.role === "assistant"
                    ? "justify-start"
                    : "justify-end",
                )}
              >
                <div
                  className={cn(
                    "flex flex-col",
                    message.role === "assistant" ? "w-full" : "max-w-3xl",
                  )}
                >
                  <div
                    className={cn(
                      "relative block rounded-3xl px-4 py-2 text-[15px] leading-relaxed transition-all duration-200 font-medium max-w-full whitespace-pre-wrap break-words",
                      message.role === "assistant"
                        ? "text-foreground font-sans"
                        : "text-foreground bg-container hover:bg-backdrop font-sans",
                    )}
                  >
                    {Array.isArray(message.content)
                      ? message.content.map((part, i) =>
                          part.type === "text" && part.text ? (
                            <span key={i}>
                              {(part.text || "").replace(/^\[\]\s*/, "").trim()}
                            </span>
                          ) : null,
                        )
                      : String(message.content)}
                  </div>

                  {message.renderedComponent && (
                    <div className="w-full pt-2 px-2">
                      {message.renderedComponent}
                    </div>
                  )}
                </div>
              </div>
            ))}

          {isPending && (
            <div className="flex justify-start w-full">
              <div className="flex flex-col w-full">
                <div className="relative block rounded-3xl px-4 py-2 text-[15px] leading-relaxed transition-all duration-200 font-medium max-w-full text-foreground font-sans">
                  <div className="flex items-center justify-start h-4 py-1">
                    <div className="flex items-center gap-1">
                      <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.2s]"></span>
                      <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.1s]"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="px-4 pb-4 bg-background">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="relative flex flex-col rounded-xl bg-background shadow-md p-2 px-3 border border-border"
          >
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message or paste images..."
              rows={1}
              className="flex-1 p-3 rounded-t-lg bg-background text-foreground resize-none text-sm min-h-[82px] max-h-[40vh] focus:outline-none placeholder:text-muted-foreground/50"
              style={{
                height: "auto",
                minHeight: "82px",
              }}
              onInput={(e) => {
                e.currentTarget.style.height = "auto";
                // eslint-disable-next-line no-undef
                const maxHeight =
                  typeof window !== "undefined"
                    ? window.innerHeight * 0.4
                    : 200;
                e.currentTarget.style.height = `${Math.min(
                  e.currentTarget.scrollHeight,
                  maxHeight,
                )}px`;
              }}
              disabled={isPending}
            />
            <div className="flex justify-between items-center mt-2 p-1 gap-2">
              <div className="flex items-center gap-2">
                <DictationButton />
              </div>
              <button
                type="submit"
                disabled={isPending || !value.trim()}
                className="w-10 h-10 bg-foreground text-background rounded-lg hover:bg-foreground/90 disabled:opacity-50 flex items-center justify-center enabled:cursor-pointer transition-colors"
                aria-label="Send message"
              >
                <svg
                  className="w-5 h-5"
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
            </div>
          </form>
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
