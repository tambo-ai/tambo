"use client";

import { useTamboThread, useTamboThreadInput } from "@tambo-ai/react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { useRef, useEffect } from "react";

export function ChatInterface() {
  const { thread } = useTamboThread();
  const { value, setValue, submit, isPending } = useTamboThreadInput();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [thread?.messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isPending) {
      submit();
    }
  };

  const suggestions = [
    "Show my wallet",
    "Display my CRO balance",
    "Show a sample transaction",
    "What is Cronos network?",
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {(!thread?.messages || thread.messages.length === 0) && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cronos-secondary to-cronos-accent flex items-center justify-center">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Cronos AI Assistant
            </h3>
            <p className="text-white/60 max-w-md mx-auto mb-6">
              Ask me to show your wallet info, check balances, or learn about
              Cronos. Your wallet is connected - try the suggestions below!
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setValue(suggestion);
                  }}
                  className="px-4 py-2 rounded-full glass text-sm text-white/80 hover:bg-white/10 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {thread?.messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role !== "user" && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cronos-secondary to-cronos-accent flex-shrink-0 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}

            <div
              className={`max-w-[80%] space-y-3 ${
                message.role === "user"
                  ? "bg-cronos-secondary/20 border border-cronos-secondary/30 rounded-2xl px-4 py-3"
                  : ""
              }`}
            >
              {/* Text content */}
              {message.role === "user" ? (
                <div className="text-white/90">
                  {Array.isArray(message.content)
                    ? message.content.map((part, i) =>
                        part.type === "text" ? (
                          <span key={i}>{part.text}</span>
                        ) : null,
                      )
                    : String(message.content)}
                </div>
              ) : (
                <>
                  {/* Assistant text in glass container */}
                  {(Array.isArray(message.content)
                    ? message.content.some((p) => p.type === "text" && p.text)
                    : message.content) && (
                    <div className="glass rounded-2xl px-4 py-3">
                      {Array.isArray(message.content) ? (
                        message.content.map((part, i) =>
                          part.type === "text" && part.text ? (
                            <p key={i} className="text-white/90">
                              {part.text}
                            </p>
                          ) : null,
                        )
                      ) : (
                        <p className="text-white/90">
                          {String(message.content)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Render Tambo component if present */}
                  {message.renderedComponent && (
                    <div className="mt-2">{message.renderedComponent}</div>
                  )}
                </>
              )}
            </div>

            {message.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}

        {isPending && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cronos-secondary to-cronos-accent flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            </div>
            <div className="glass rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-white/60 animate-bounce" />
                <span
                  className="w-2 h-2 rounded-full bg-white/60 animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <span
                  className="w-2 h-2 rounded-full bg-white/60 animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-white/10 p-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Try: Show my wallet, Display my balance..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-cronos-secondary/50 transition-colors"
            disabled={isPending}
          />
          <button
            type="submit"
            disabled={!value.trim() || isPending}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-cronos-secondary to-cronos-accent hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
