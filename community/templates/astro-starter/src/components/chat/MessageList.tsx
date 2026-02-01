"use client";

import { memo, useRef, useEffect } from "react";
import { useTamboThread, GenerationStage } from "@tambo-ai/react";
import { Bot, User } from "lucide-react";

/**
 * Renders the list of messages in the current chat thread.
 * Handles auto-scrolling to the newest message and displaying the loading state.
 */
export const MessageList = memo(function MessageList() {
  const { thread, generationStage } = useTamboThread();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages, generationStage]);

  if (!thread?.messages.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-400">
        <div className="h-12 w-12 rounded-xl bg-zinc-50 flex items-center justify-center mb-4">
          <Bot className="w-6 h-6 text-zinc-300" />
        </div>
        <p className="font-medium text-zinc-900">Tambo Assistant</p>
        <p className="text-sm mt-1">Ready to help you build UI.</p>
      </div>
    );
  }

  const isGenerating =
    generationStage !== GenerationStage.IDLE &&
    generationStage !== GenerationStage.COMPLETE &&
    generationStage !== GenerationStage.ERROR &&
    generationStage !== GenerationStage.CANCELLED;

  return (
    <div className="space-y-8 pb-4">
      {thread.messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((message, index) => (
          <div
            key={message.id || index}
            className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`
                            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                            ${message.role === "user" ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 text-zinc-900"}
                        `}
            >
              {message.role === "user" ? <User size={14} /> : <Bot size={14} />}
            </div>

            <div
              className={`flex flex-col max-w-[85%] ${message.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`
                                py-3 px-4 rounded-2xl text-sm leading-relaxed
                                ${
                                  message.role === "user"
                                    ? "bg-zinc-900 text-white rounded-tr-sm"
                                    : "bg-zinc-50 text-zinc-900 border border-zinc-100 rounded-tl-sm"
                                }
                            `}
              >
                {Array.isArray(message.content) ? (
                  message.content.map((part, i) =>
                    part.type === "text" ? (
                      <p key={i} className="whitespace-pre-wrap">
                        {part.text}
                      </p>
                    ) : null,
                  )
                ) : (
                  <p className="whitespace-pre-wrap">
                    {String(message.content)}
                  </p>
                )}
              </div>

              {message.renderedComponent && (
                <div className="mt-4 w-full">
                  <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm bg-white">
                    {message.renderedComponent}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

      {isGenerating && (
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-white border border-zinc-200 flex items-center justify-center">
            <Bot size={14} className="text-zinc-900" />
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-400 h-8">
            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></span>
            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce delay-75"></span>
            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce delay-150"></span>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
});
