"use client";

import { useUser } from "@clerk/nextjs";
import {
  useTambo,
  useTamboGenerationStage,
  useTamboThreadInput,
} from "@tambo-ai/react";
import { FormEvent, useEffect, useRef, useState } from "react";

/**
 * MessageThread - Streaming-First Chat Interface
 *
 * This component demonstrates Tambo's streaming-first chat UX:
 *
 * 1. Streaming responses: Messages appear in real-time as the AI generates them
 *    - useTamboGenerationStage() tracks streaming state
 *    - "Thinking..." indicator reserves space during generation
 *    - Auto-scroll keeps conversation in view
 *
 * 2. Runtime-driven components: AI-rendered components appear inline
 *    - Components render as part of the streaming response
 *    - No separate API calls or page reloads
 *    - Seamless integration with text messages
 *
 * 3. Authenticated context: All messages are scoped to the signed-in user
 *    - useTambo() provides thread context (authenticated via userToken)
 *    - Messages are associated with the authenticated user
 *    - Components have access to user context
 *
 * Layout structure:
 * - Centered container (max-w-4xl) - constrained, intentional spacing
 * - User messages constrained to max-w-[70%] - clear visual distinction
 * - Assistant messages max-w-full - comfortable for streaming text and components
 * - Input anchored to bottom - visually connected to thread
 * - Streaming UX reserves space - avoids layout jumps, feels intentional
 */
export function MessageThread() {
  const { user } = useUser();
  const { thread } = useTambo();
  const { isIdle } = useTamboGenerationStage();
  const { value: input, setValue: setInput, submit } = useTamboThreadInput();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isStreaming = !isIdle;

  // Auto-scroll to bottom when messages change or streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages, isStreaming]);

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

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const messages = thread?.messages ?? [];
  const filteredMessages = messages.filter(
    (message) => message.role !== "system",
  );

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Centered conversation container - max-w-4xl constraint */}
      <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto">
        {/* Scrollable message area - intentional spacing */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col gap-6">
            {/* Empty state - reduced whitespace */}
            {filteredMessages.length === 0 && !isStreaming && (
              <div className="py-6 space-y-4">
                <div className="text-sm text-muted-foreground">
                  Signed in as{" "}
                  <span className="text-foreground font-medium">
                    {user?.primaryEmailAddress?.emailAddress}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Try asking:
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSuggestionClick("Show my profile")}
                    className="text-sm px-4 py-2 border border-border rounded-md bg-background hover:bg-muted text-foreground"
                  >
                    &ldquo;Show my profile&rdquo;
                  </button>
                </div>
              </div>
            )}

            {/* Messages - clear user/assistant distinction */}
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex flex-col gap-3 ${
                    message.role === "user" ? "max-w-[70%]" : "max-w-full"
                  }`}
                >
                  {/* Message text content */}
                  {message.content.map((part, index) => {
                    if (part.type === "text" && part.text) {
                      return (
                        <div
                          key={index}
                          className={`text-[15px] leading-relaxed whitespace-pre-wrap ${
                            message.role === "user"
                              ? "bg-muted text-foreground px-4 py-2.5 rounded-lg"
                              : "text-foreground"
                          }`}
                        >
                          {part.text}
                        </div>
                      );
                    }
                    return null;
                  })}

                  {/* AI-rendered components - comfortable spacing for runtime-driven UI */}
                  {message.renderedComponent && (
                    <div className="w-full mt-1">
                      {message.renderedComponent}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Streaming indicator - reserves space to avoid layout jumps */}
            {/* This makes streaming feel intentional, not accidental */}
            {isStreaming && (
              <div className="flex justify-start">
                <div className="text-sm text-muted-foreground py-2">
                  Assistant is thinking...
                </div>
              </div>
            )}

            {/* Scroll anchor - ensures smooth auto-scroll */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area - anchored to bottom, visually connected to thread */}
        <div className="border-t border-border bg-background px-4 sm:px-6 py-4">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2 border border-border rounded-lg bg-background px-3 py-2.5">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                disabled={isSubmitting || isStreaming}
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-[15px] disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isSubmitting || isStreaming}
                className="px-4 py-1.5 bg-foreground text-background rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
