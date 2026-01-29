"use client";

import {
  useTambo,
  useTamboThread,
  useTamboThreadInput,
  useTamboThreadList,
  GenerationStage,
  type TamboThreadMessage,
} from "@tambo-ai/react";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Streamdown } from "streamdown";
import { cn } from "~/lib/utils";
import {
  ArrowLeftToLine,
  ArrowRightToLine,
  PlusIcon,
  SearchIcon,
  SendHorizonal,
  Loader2,
  Check,
  X,
  ChevronDown,
} from "lucide-react";
import DictationButton from "./dictation-button";
import type TamboAI from "@tambo-ai/typescript-sdk";
import stringify from "json-stringify-pretty-compact";

// ============================================================================
// Utilities
// ============================================================================

function getMessageTextContent(message: TamboThreadMessage): string {
  const raw = message.content;
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) {
    return raw
      .filter(
        (part): part is { type: "text"; text: string } =>
          part?.type === "text" && typeof part.text === "string",
      )
      .map((part) => part.text)
      .join(" ");
  }
  return "";
}

function getToolCallRequest(
  message: TamboThreadMessage,
): TamboAI.ToolCallRequest | undefined {
  return message.toolCallRequest ?? message.component?.toolCallRequest;
}

function keyifyParameters(parameters: TamboAI.ToolCallParameter[] | undefined) {
  if (!parameters) return undefined;
  return Object.fromEntries(
    parameters.map((p) => [p.parameterName, p.parameterValue]),
  );
}

function formatToolResult(
  content: TamboThreadMessage["content"],
): React.ReactNode {
  if (!content) return null;

  let contentString: string | null = null;
  if (typeof content === "string") {
    contentString = content;
  } else if (Array.isArray(content)) {
    contentString = content
      .map((item) => {
        if (item?.type === "text") {
          return item.text ?? "";
        }
        return "";
      })
      .join("");
  }

  if (contentString) {
    try {
      const parsed = JSON.parse(contentString);
      return (
        <pre className="text-xs bg-slate-50 p-2 rounded overflow-auto">
          {stringify(parsed)}
        </pre>
      );
    } catch {
      return <div className="text-xs whitespace-pre-wrap">{contentString}</div>;
    }
  }

  return null;
}

// ============================================================================
// Thread History Sidebar
// ============================================================================

function ThreadHistory() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: threads, isLoading, refetch } = useTamboThreadList();
  const {
    thread: currentThread,
    switchCurrentThread,
    startNewThread,
  } = useTamboThread();

  const filteredThreads = useMemo(() => {
    if (isCollapsed || !threads?.items) return [];
    const query = searchQuery.toLowerCase();
    return threads.items.filter((thread) => {
      const nameMatches = thread.name?.toLowerCase().includes(query) ?? false;
      const idMatches = thread.id.toLowerCase().includes(query);
      return idMatches || nameMatches;
    });
  }, [isCollapsed, threads, searchQuery]);

  const handleNewThread = useCallback(async () => {
    await startNewThread();
    await refetch();
  }, [startNewThread, refetch]);

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r border-slate-200 bg-slate-50/50 transition-all duration-300 flex-none",
        isCollapsed ? "w-12" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex flex-col h-full",
          isCollapsed ? "py-4 px-2" : "p-4",
        )}
      >
        {/* Header */}
        <div className="flex items-center mb-4 relative p-1">
          <h2
            className={cn(
              "text-sm text-slate-500 whitespace-nowrap",
              isCollapsed
                ? "opacity-0 max-w-0 overflow-hidden"
                : "opacity-100 max-w-none transition-all duration-300 delay-75",
            )}
          >
            Conversations
          </h2>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="bg-slate-50/50 p-1 hover:bg-slate-100 transition-colors rounded-md cursor-pointer absolute right-1 flex items-center justify-center"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ArrowRightToLine className="h-4 w-4 text-slate-500" />
            ) : (
              <ArrowLeftToLine className="h-4 w-4 text-slate-500" />
            )}
          </button>
        </div>

        {/* New Thread Button */}
        <button
          onClick={handleNewThread}
          className={cn(
            "flex items-center rounded-md mb-4 hover:bg-slate-100 transition-colors cursor-pointer relative",
            isCollapsed ? "p-1 justify-center" : "p-2 gap-2",
          )}
          title="New thread"
        >
          <PlusIcon className="h-4 w-4 bg-green-600 rounded-full text-white p-0.5" />
          <span
            className={cn(
              "text-sm font-medium whitespace-nowrap absolute left-8 pb-[2px]",
              isCollapsed
                ? "opacity-0 max-w-0 overflow-hidden pointer-events-none"
                : "opacity-100 transition-all duration-300 delay-100",
            )}
          >
            New thread
          </span>
        </button>

        {/* Search */}
        <div className="mb-4 relative">
          <button
            onClick={() => setIsCollapsed(false)}
            className={cn(
              "p-1 hover:bg-slate-100 rounded-md cursor-pointer absolute left-1/2 -translate-x-1/2",
              isCollapsed
                ? "opacity-100 pointer-events-auto transition-all duration-300"
                : "opacity-0 pointer-events-none",
            )}
            title="Search threads"
          >
            <SearchIcon className="h-4 w-4 text-slate-400" />
          </button>

          <div
            className={cn(
              isCollapsed
                ? "opacity-0 pointer-events-none"
                : "opacity-100 delay-100 transition-all duration-500",
            )}
          >
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="pl-10 pr-4 py-2 w-full text-sm rounded-md bg-white border border-slate-200 focus:outline-none focus:border-slate-300"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Thread List */}
        <div
          className={cn(
            "overflow-y-auto flex-1 transition-all duration-300 ease-in-out",
            isCollapsed
              ? "opacity-0 max-h-0 overflow-hidden pointer-events-none"
              : "opacity-100 max-h-full pointer-events-auto",
          )}
        >
          {isLoading ? (
            <div className="text-sm text-slate-500 p-2">Loading threads...</div>
          ) : filteredThreads.length === 0 ? (
            <div className="text-sm text-slate-500 p-2">
              {searchQuery ? "No matching threads" : "No previous threads"}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredThreads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => switchCurrentThread(thread.id)}
                  className={cn(
                    "p-2 rounded-md hover:bg-slate-100 cursor-pointer group",
                    currentThread?.id === thread.id ? "bg-slate-100" : "",
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-medium line-clamp-1",
                      currentThread?.id === thread.id
                        ? "text-slate-900"
                        : "text-slate-500",
                    )}
                  >
                    {thread.name ?? `Thread ${thread.id.substring(0, 8)}`}
                  </span>
                  <p className="text-xs text-slate-400 truncate mt-1">
                    {new Date(thread.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Message Components
// ============================================================================

function LoadingIndicator() {
  return (
    <div className="flex items-center gap-1">
      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-600 [animation-delay:-0.3s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-600 [animation-delay:-0.2s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-600 [animation-delay:-0.1s]" />
    </div>
  );
}

function UserMessage({ message }: { message: TamboThreadMessage }) {
  const content = useMemo(() => getMessageTextContent(message), [message]);

  if (!content.trim()) return null;

  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl bg-slate-900 px-4 py-3 text-white">
        <div className="text-sm">{content}</div>
      </div>
    </div>
  );
}

function AssistantMessage({
  message,
  isLoading,
}: {
  message: TamboThreadMessage;
  isLoading: boolean;
}) {
  const content = useMemo(() => getMessageTextContent(message), [message]);
  const hasContent = content.trim().length > 0;

  // Skip if this message has a rendered component
  if (message.renderedComponent) return null;

  // Show loading dots only when streaming text (no tool call active)
  const hasToolCall =
    message.toolCallRequest ?? message.component?.toolCallRequest;
  const showLoading = isLoading && !hasContent && !hasToolCall;

  if (!showLoading && !hasContent) return null;

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-2x py-2 text-black">
        {showLoading ? (
          <LoadingIndicator />
        ) : (
          <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
            <Streamdown>{content}</Streamdown>
          </div>
        )}
      </div>
    </div>
  );
}

function ToolCallInfo({
  message,
  isLoading,
}: {
  message: TamboThreadMessage;
  isLoading: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { thread } = useTambo();

  // Find associated tool response
  const associatedToolResponse = useMemo(() => {
    if (!thread?.messages) return null;
    const currentIndex = thread.messages.findIndex((m) => m.id === message.id);
    if (currentIndex === -1) return null;

    for (let i = currentIndex + 1; i < thread.messages.length; i++) {
      const nextMessage = thread.messages[i];
      if (nextMessage.role === "tool") {
        return nextMessage;
      }
      if (nextMessage.role === "assistant" && getToolCallRequest(nextMessage)) {
        break;
      }
    }
    return null;
  }, [message.id, thread?.messages]);

  const toolCallRequest = getToolCallRequest(message);
  if (!toolCallRequest) return null;

  const hasToolError = !!message.error;

  const toolStatusMessage = isLoading
    ? `Calling ${toolCallRequest.toolName}`
    : `Called ${toolCallRequest.toolName}`;

  return (
    <div className="flex flex-col items-start text-xs opacity-70 mt-1">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 hover:bg-slate-100 rounded px-2 py-1 transition-colors"
      >
        {hasToolError ? (
          <X className="w-3 h-3 text-red-500" />
        ) : isLoading ? (
          <Loader2 className="w-3 h-3 animate-spin text-slate-500" />
        ) : (
          <Check className="w-3 h-3 text-green-500" />
        )}
        <span className="text-slate-600">{toolStatusMessage}</span>
        <ChevronDown
          className={cn(
            "w-3 h-3 transition-transform",
            !isExpanded && "-rotate-90",
          )}
        />
      </button>

      {isExpanded && (
        <div className="flex flex-col gap-2 pl-6 pr-2 py-2 text-slate-600 w-full">
          <div>
            <span className="font-medium">Tool:</span>{" "}
            {toolCallRequest.toolName}
          </div>
          <div>
            <span className="font-medium">Parameters:</span>
            <pre className="text-xs bg-slate-50 p-2 rounded mt-1 overflow-auto">
              {stringify(keyifyParameters(toolCallRequest.parameters))}
            </pre>
          </div>
          {associatedToolResponse && (
            <div>
              <span className="font-medium">Result:</span>
              <div className="mt-1">
                {!associatedToolResponse.content ? (
                  <span className="italic text-slate-400">Empty response</span>
                ) : (
                  formatToolResult(associatedToolResponse.content)
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RenderedComponent({ message }: { message: TamboThreadMessage }) {
  if (!message.renderedComponent) return null;

  return <div className="w-full">{message.renderedComponent}</div>;
}

function Message({
  message,
  isLoading,
}: {
  message: TamboThreadMessage;
  isLoading: boolean;
}) {
  if (message.role === "user") {
    return <UserMessage message={message} />;
  }

  return (
    <div className="space-y-1">
      <AssistantMessage message={message} isLoading={isLoading} />
      <ToolCallInfo message={message} isLoading={isLoading} />
      <RenderedComponent message={message} />
    </div>
  );
}

// ============================================================================
// Message Thread
// ============================================================================

function MessageThread() {
  const { thread, generationStage, isIdle } = useTambo();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const lastScrollTop = useRef(0);

  const isGenerating = !isIdle;

  // Filter messages: exclude tool/system, and skip text-only messages after a component
  const messages = useMemo(() => {
    if (!thread?.messages) return [];

    const filtered = thread.messages.filter(
      (msg) => msg.role !== "tool" && msg.role !== "system",
    );

    const result: typeof filtered = [];

    for (const msg of filtered) {
      result.push(msg);
    }

    return result;
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
// Message Input
// ============================================================================

function MessageInput() {
  const { value, setValue, submit, isPending } = useTamboThreadInput();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isPending) {
      submit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isPending) {
        submit();
      }
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  const suggestions = [
    {
      title: "Save https://remix.run as...",
      query: "Save https://remix.run as a tech resource",
    },
    { title: "Find my tech bookmarks", query: "Find my tech bookmarks" },
    { title: "Show my categories", query: "Show all my bookmark categories" },
  ];

  return (
    <div className="border-t border-slate-200 bg-white">
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl px-4 py-4">
        <div className="relative rounded-xl border border-slate-200 bg-white shadow-sm focus-within:border-slate-300 focus-within:ring-2 focus-within:ring-slate-100">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={isPending}
            rows={1}
            className="w-full resize-none rounded-xl bg-transparent px-4 py-3 pr-24 text-sm placeholder:text-slate-400 focus:outline-none disabled:opacity-50"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <DictationButton />
            <button
              type="submit"
              disabled={isPending || !value.trim()}
              className="rounded-lg bg-slate-900 p-2 text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-slate-900"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizonal className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.title}
              type="button"
              onClick={() => setValue(suggestion.query)}
              disabled={isPending}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50"
            >
              {suggestion.title}
            </button>
          ))}
        </div>
      </form>
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
