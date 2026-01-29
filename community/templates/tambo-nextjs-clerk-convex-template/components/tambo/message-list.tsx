"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTamboThread } from "@tambo-ai/react";
import { Bot, Loader2, User } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * Displays the conversation messages and AI-generated components.
 * Auto-scrolls to the latest message.
 */
export function TamboMessageList() {
  const { thread, isIdle, sendThreadMessage } = useTamboThread();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isLoading = !isIdle;

  const handleSuggestionClick = async (suggestion: string) => {
    if (isLoading) return;
    try {
      await sendThreadMessage(suggestion);
    } catch {
      toast.error("Failed to send message");
    }
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thread?.messages]);

  // Check if content looks like a JSON tool result
  const isToolResultJson = (text: string): boolean => {
    const trimmed = text.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return false;
    try {
      const parsed = JSON.parse(trimmed);
      return (
        typeof parsed === "object" &&
        parsed !== null &&
        ("success" in parsed || "message" in parsed || "noteId" in parsed)
      );
    } catch {
      return false;
    }
  };

  // Get text content from message, filtering out tool results
  const getMessageText = (message: (typeof thread.messages)[0]): string => {
    if (typeof message.content === "string") {
      if (isToolResultJson(message.content)) {
        return "";
      }
      return message.content;
    }
    if (Array.isArray(message.content)) {
      return message.content
        .filter((c) => c.type === "text")
        .map((c) => (c as { type: "text"; text: string }).text)
        .filter((text) => !isToolResultJson(text))
        .join("");
    }
    return "";
  };

  if (!thread?.messages?.length && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <h3 className="font-heading font-medium text-lg mb-1 leading-tight tracking-tighter">
          AI Notes Assistant
        </h3>
        <p className="text-xs text-muted-foreground max-w-[240px] mb-5">
          I can help you create and manage notes. Try:
        </p>
        <div className="flex flex-col items-center gap-2 w-full max-w-[240px]">
          <button
            type="button"
            className="w-full py-2 px-2.5 rounded-2xl text-xs font-medium transition-colors border border-gray-200 bg-background hover:bg-accent hover:text-accent-foreground text-left"
            onClick={() => handleSuggestionClick("Create a shopping list")}
          >
            Create a shopping list
          </button>
          <button
            type="button"
            className="w-full py-2 px-2.5 rounded-2xl text-xs font-medium transition-colors border border-gray-200 bg-background hover:bg-accent hover:text-accent-foreground text-left"
            onClick={() => handleSuggestionClick("Write a meeting note")}
          >
            Write a meeting note
          </button>
          <button
            type="button"
            className="w-full py-2 px-2.5 rounded-2xl text-xs font-medium transition-colors border border-gray-200 bg-background hover:bg-accent hover:text-accent-foreground text-left"
            onClick={() => handleSuggestionClick("Show my notes")}
          >
            Show my notes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="space-y-4 overflow-y-auto">
      {thread?.messages?.map((message) => {
        const messageText = getMessageText(message);
        const hasText = messageText.trim().length > 0;
        const hasComponent = !!message.renderedComponent;

        // Skip messages with no displayable content
        if (!hasText && !hasComponent && message.role === "assistant") {
          return null;
        }

        return (
          <div key={message.id} className="space-y-3">
            {/* Message bubble */}
            {(hasText || message.role === "user") && (
              <div
                className={`flex gap-2.5 ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback
                    className={
                      message.role === "user"
                        ? "bg-primary text-primary-foreground text-xs"
                        : "bg-muted text-xs"
                    }
                  >
                    {message.role === "user" ? (
                      <User className="h-3.5 w-3.5" />
                    ) : (
                      <Bot className="h-3.5 w-3.5" />
                    )}
                  </AvatarFallback>
                </Avatar>

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/70"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {messageText ||
                      (message.role === "user" ? message.content : "")}
                  </p>
                </div>
              </div>
            )}

            {/* Render AI-generated component */}
            {hasComponent && (
              <div className="pl-9">{message.renderedComponent}</div>
            )}
          </div>
        );
      })}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex gap-2.5">
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="bg-muted text-xs">
              <Bot className="h-3.5 w-3.5" />
            </AvatarFallback>
          </Avatar>
          <div className="bg-muted/70 rounded-2xl px-3.5 py-2 flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="text-sm text-muted-foreground">Thinking...</span>
          </div>
        </div>
      )}
    </div>
  );
}
