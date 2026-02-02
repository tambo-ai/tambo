import { useTambo, GenerationStage } from "@tambo-ai/react";
import { useEffect, useRef, useState, useMemo } from "react";
import { ThreadHistory } from "./thread-history";
import { MessageInput } from "./message-input";
import { Message } from "./message";

// ============================================================================
// Message Thread
// ============================================================================

function MessageThread() {
  const { thread, generationStage, isIdle } = useTambo();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const lastScrollTop = useRef(0);

  const isGenerating = !isIdle;

  // Filter messages: exclude tool/system
  const messages = useMemo(() => {
    if (!thread?.messages) return [];

    return thread.messages.filter(
      (msg) => msg.role !== "tool" && msg.role !== "system",
    );
  }, [thread?.messages]);

  // Auto-scroll during streaming
  useEffect(() => {
    if (!scrollRef.current || !shouldAutoScroll) return;

    const scroll = () => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior:
          generationStage === GenerationStage.STREAMING_RESPONSE
            ? "auto"
            : "smooth",
      });
    };

    if (generationStage === GenerationStage.STREAMING_RESPONSE) {
      requestAnimationFrame(scroll);
    } else {
      const timeout = setTimeout(scroll, 50);
      return () => clearTimeout(timeout);
    }
  }, [messages, generationStage, shouldAutoScroll]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 8;

    if (scrollTop < lastScrollTop.current) {
      setShouldAutoScroll(false);
    } else if (isAtBottom) {
      setShouldAutoScroll(true);
    }
    lastScrollTop.current = scrollTop;
  };

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar]:w-1.5"
    >
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
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
            <h2 className="text-lg font-medium text-slate-900">
              Start a conversation
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Ask me to manage your bookmarks
            </p>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.map((message, index) => (
            <Message
              key={message.id}
              message={message}
              isLoading={isGenerating && index === messages.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Export
// ============================================================================

export function MessageThreadFull() {
  return (
    <div className="flex h-full w-full">
      <ThreadHistory />
      <div className="flex flex-1 flex-col min-w-0">
        <MessageThread />
        <MessageInput />
      </div>
    </div>
  );
}
