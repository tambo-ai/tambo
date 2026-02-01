"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTamboThread } from "@tambo-ai/react";
import { Bot, Loader2, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const DEFERRED_TOAST_MS = 400;
const THINKING_CANCEL_AFTER_MS = 15000;

/**
 * Displays the conversation messages and AI-generated components.
 * Text and components stream in as the SDK receives chunks (updateThreadMessage).
 * Matches web app: all messages + renderedComponent per message. Cancel when stuck.
 */
export function TamboMessageList() {
  const { thread, isIdle, sendThreadMessage, cancel } = useTamboThread();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isLoading = !isIdle;
  const threadRef = useRef(thread);
  const messageCountBeforeSendRef = useRef(0);
  const [showCancelThinking, setShowCancelThinking] = useState(false);

  useEffect(() => {
    threadRef.current = thread;
  }, [thread]);

  useEffect(() => {
    if (!isLoading) {
      // Defer reset to avoid synchronous setState in effect (react-hooks/set-state-in-effect)
      const t = setTimeout(() => setShowCancelThinking(false), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(
      () => setShowCancelThinking(true),
      THINKING_CANCEL_AFTER_MS,
    );
    return () => clearTimeout(t);
  }, [isLoading]);

  const handleCancelThinking = () => {
    void cancel();
    setShowCancelThinking(false);
  };

  const handleSuggestionClick = async (suggestion: string) => {
    if (isLoading) return;
    messageCountBeforeSendRef.current = thread?.messages?.length ?? 0;
    try {
      await sendThreadMessage(suggestion, { streamResponse: true });
    } catch {
      const countBefore = messageCountBeforeSendRef.current;
      setTimeout(() => {
        const countNow = threadRef.current?.messages?.length ?? 0;
        if (countNow <= countBefore) {
          toast.error(
            "Failed to send message. If you asked to create or edit a note, check Your Notes.",
          );
        }
      }, DEFERRED_TOAST_MS);
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

  // Match web/ThreadContentMessages: only user and assistant, no system/tool/parent
  const displayMessages =
    thread?.messages?.filter(
      (m) =>
        m.role !== "system" &&
        m.role !== "tool" &&
        !(m as { parentMessageId?: string }).parentMessageId,
    ) ?? [];

  if (displayMessages.length === 0 && !isLoading) {
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

  // When loading and last message is user, show a placeholder assistant row (Thinking) so
  // when the stream completes the same slot shows content + component (like web ThreadContentMessages).
  const lastIndex = displayMessages.length - 1;
  const showLoadingOnLastRow =
    isLoading && displayMessages.length > 0 && lastIndex >= 0;
  const lastMessage = showLoadingOnLastRow
    ? displayMessages[lastIndex]
    : undefined;
  const isLastRowLoading =
    showLoadingOnLastRow && lastMessage?.role === "assistant";
  const isPlaceholderLoadingRow =
    isLoading && (displayMessages.length === 0 || lastMessage?.role === "user");

  return (
    <div ref={scrollRef} className="space-y-4 overflow-y-auto">
      {displayMessages.map((message, index) => {
        const messageText = getMessageText(message);
        const hasText = messageText.trim().length > 0;
        const hasComponent = !!message.renderedComponent;
        const showThinkingInBubble =
          index === lastIndex &&
          isLoading &&
          !hasText &&
          message.role === "assistant";

        return (
          <div key={message.id} className="space-y-3">
            {/* Message bubble: always show for user; for assistant show when has text, or when this is the loading row */}
            {(message.role === "user" || hasText || showThinkingInBubble) && (
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
                  {showThinkingInBubble ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span className="text-sm text-muted-foreground">
                        Thinking...
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {messageText ||
                        (message.role === "user" &&
                        typeof message.content === "string"
                          ? message.content
                          : "")}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Render AI-generated component (same as web MessageRenderedComponentArea) */}
            {hasComponent && (
              <div className="pl-9 w-full pt-2">
                {message.renderedComponent}
              </div>
            )}
          </div>
        );
      })}

      {/* Placeholder loading row when we have no assistant message yet (e.g. right after user sent) */}
      {isPlaceholderLoadingRow && (
        <div className="space-y-3">
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
          {showCancelThinking && (
            <button
              type="button"
              onClick={handleCancelThinking}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground pl-9 transition-colors"
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
          )}
        </div>
      )}

      {/* Cancel for when loading is on the last message row (no separate placeholder) */}
      {isLastRowLoading && showCancelThinking && (
        <button
          type="button"
          onClick={handleCancelThinking}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground pl-9 transition-colors"
        >
          <X className="h-3 w-3" />
          Cancel
        </button>
      )}
    </div>
  );
}
