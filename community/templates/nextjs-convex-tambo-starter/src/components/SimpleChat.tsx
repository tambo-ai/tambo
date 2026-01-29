"use client";

import {
  useTamboClient,
  useTamboThread,
  useTamboThreadInput,
  useTamboThreadList,
} from "@tambo-ai/react";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Menu,
  MessageSquare,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function SimpleChat() {
  const { thread, switchCurrentThread, startNewThread, currentThreadId } =
    useTamboThread();
  const { value, setValue, submit, isPending } = useTamboThreadInput();
  const { data: threadData, refetch: refetchThreads } = useTamboThreadList();
  const client = useTamboClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.messages]);

  const handleSuggestion = (text: string) => {
    setValue(text);
  };

  const deleteThread = async (threadId: string) => {
    try {
      await client.beta.threads.delete(threadId);
      await refetchThreads();
      if (currentThreadId === threadId) {
        startNewThread();
      }
    } catch (error) {
      console.error("Failed to delete thread:", error);
    }
  };

  const hasMessages = thread.messages.length > 0;

  if (showHistory) {
    return (
      <div className="flex flex-col h-full bg-[#080808]">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <button
            onClick={() => setShowHistory(false)}
            className="p-2 hover:bg-white/5 rounded-full text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-sm font-medium text-white">History</h2>
          <button
            onClick={() => {
              startNewThread();
              setShowHistory(false);
            }}
            className="p-2 hover:bg-white/5 rounded-full text-white/70 hover:text-white transition-colors"
            title="New Chat"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {threadData?.items?.map((t) => (
            <div
              key={t.id}
              onClick={() => {
                switchCurrentThread(t.id);
                setShowHistory(false);
              }}
              className={`group min-h-[4rem] p-3 rounded-xl cursor-pointer transition-all border border-transparent ${
                t.id === thread.id
                  ? "bg-white/10 border-white/10"
                  : "hover:bg-white/5 hover:border-white/5"
              } mb-2 flex items-start justify-between gap-3`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {t.name || "New Chat"}
                </div>
                <div className="text-xs text-white/40 mt-1">
                  {(() => {
                    if (!t.createdAt) return "Just now";
                    try {
                      const timestamp = Number(t.createdAt);
                      // If it's a number and valid Unix timestamp
                      const date = !isNaN(timestamp)
                        ? new Date(
                            timestamp * (timestamp < 10000000000 ? 1000 : 1),
                          )
                        : new Date(t.createdAt);

                      if (isNaN(date.getTime())) return "Invalid date";
                      return formatDistanceToNow(date, { addSuffix: true });
                    } catch (e) {
                      return "Just now";
                    }
                  })()}
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteThread(t.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#080808]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              refetchThreads();
              setShowHistory(true);
            }}
            className="p-2 -ml-2 hover:bg-white/5 rounded-full text-white/50 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-white/90">Chat</span>
        </div>
        <button
          onClick={() => startNewThread()}
          className="p-2 -mr-2 hover:bg-white/5 rounded-full text-white/50 hover:text-white transition-colors block"
          title="New Chat"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {hasMessages ? (
          thread.messages.map((message) => {
            // Hide tool outputs / function results if they are raw JSON
            const role = message.role as string;
            if (role === "tool" || role === "function" || role === "data") {
              return null;
            }

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Content */}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    message.role === "user"
                      ? "bg-white/10 text-white"
                      : "bg-transparent text-white/80"
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {Array.isArray(message.content) ? (
                      message.content.map((part, i) =>
                        part.type === "text" ? (
                          <span key={i}>{part.text}</span>
                        ) : null,
                      )
                    ) : (
                      <span>{String(message.content)}</span>
                    )}
                  </div>
                  {message.renderedComponent}
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-white/20" />
            </div>
            <h3 className="text-white font-medium mb-1">Welcome back</h3>
            <p className="text-white/40 text-sm mb-8">
              What would you like to do today?
            </p>

            <div className="w-full space-y-2">
              {[
                "Add sales leads with name of jay, email of jay@example.com, status of new, and notes of cracked dev jay)",
                "List all my current leads",
                "Show me leads marked as Closed",
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestion(suggestion)}
                  className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all text-sm text-white/70 hover:text-white"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 pt-2 bg-[#080808]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="relative flex items-center gap-2"
        >
          <input
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Type a message..."
            disabled={isPending}
            autoFocus
          />
          <button
            type="submit"
            disabled={isPending || !value.trim()}
            className="absolute right-2 p-1.5 bg-white text-black rounded-lg hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
