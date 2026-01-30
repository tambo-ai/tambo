"use client";

import { cn } from "@/lib/utils";
import { useTamboThread, useTamboThreadInput } from "@tambo-ai/react";
import { Bot, Loader2, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

export function MessageList() {
  const { thread } = useTamboThread();
  const { isPending } = useTamboThreadInput();

  if (!thread?.messages || thread.messages.length === 0) {
    return null;
  }

  return (
    <div className="flex-1 space-y-8 overflow-y-auto px-2 pb-4 scrollbar-hide">
      {thread.messages.map((message) => {
        const isUser = message.role === "user";
        const textContent = Array.isArray(message.content)
          ? message.content
              .filter((part) => part.type === "text")
              .map((part) => (part.type === "text" ? part.text : ""))
              .join("")
          : typeof message.content === "string"
            ? message.content
            : "";

        return (
          <div
            key={message.id}
            className={cn("flex gap-4 group", isUser ? "flex-row-reverse" : "")}
          >
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-lg border border-white/10",
                isUser
                  ? "bg-violet-600"
                  : "bg-white/10 backdrop-blur-md"
              )}
            >
              {isUser ? (
                <User className="h-5 w-5 text-white" />
              ) : (
                <Bot className="h-5 w-5 text-white" />
              )}
            </div>

            <div
              className={cn(
                "flex max-w-[85%] flex-col gap-3",
                isUser ? "items-end" : "items-start"
              )}
            >
              {textContent && (
                <div
                  className={cn(
                    "rounded-2xl px-6 py-4 text-base shadow-sm ring-1 ring-inset",
                    isUser
                      ? "bg-violet-600 text-white ring-violet-500 rounded-tr-sm"
                      : "bg-white/10 backdrop-blur-md text-white ring-white/10 rounded-tl-sm"
                  )}
                >
                  {isUser ? (
                    <p className="leading-relaxed">{textContent}</p>
                  ) : (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-white/90">{children}</p>,
                        ul: ({ children }) => <ul className="mb-3 list-disc pl-5 space-y-1 text-white/90">{children}</ul>,
                        ol: ({ children }) => <ol className="mb-3 list-decimal pl-5 space-y-1 text-white/90">{children}</ol>,
                        li: ({ children }) => <li className="pl-1">{children}</li>,
                        h1: ({ children }) => <h1 className="text-2xl font-bold mb-3 mt-4 text-white">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-xl font-bold mb-2 mt-4 text-white">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-3 text-white">{children}</h3>,
                        blockquote: ({ children }) => <blockquote className="border-l-4 border-violet-500 pl-4 py-1 my-3 bg-white/5 rounded-r italic text-white/80">{children}</blockquote>,
                        code: ({ children }) => (
                          <code className="rounded bg-black/30 px-1.5 py-0.5 text-sm font-mono text-violet-200 border border-white/10">
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                           <pre className="rounded-lg bg-black/40 p-4 overflow-x-auto my-3 border border-white/10 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                             {children}
                           </pre>
                        ),
                        strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                        a: ({ children, href }) => <a href={href} className="text-violet-300 hover:text-violet-200 underline decoration-violet-500/50 hover:decoration-violet-500 underline-offset-2 transition-colors">{children}</a>
                      }}
                    >
                      {textContent}
                    </ReactMarkdown>
                  )}
                </div>
              )}

              {message.renderedComponent && (
                <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl shadow-2xl">
                  {message.renderedComponent}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {isPending && (
        <div className="flex gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 border border-white/10 backdrop-blur-md">
            <Loader2 className="h-5 w-5 animate-spin text-white/70" />
          </div>
          <div className="flex items-center rounded-2xl bg-white/5 px-6 py-4 border border-white/5">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
