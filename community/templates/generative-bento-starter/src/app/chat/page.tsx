"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { useTambo } from "@tambo-ai/react";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function ChatPage() {
  const { thread, sendThreadMessage } = useTambo();
  const messages = thread?.messages || [];

  const sendMessage = (content: string) => {
    sendThreadMessage(content);
  };

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  // Helper to render message content which might be an array or string
  const renderContent = (content: any) => {
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      return content.map((part, i) => {
        if (part.type === "text") return <span key={i}>{part.text}</span>;
        return null;
      });
    }
    return null;
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-100 dark:bg-neutral-950 transition-colors">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <span className="font-semibold text-neutral-800 dark:text-neutral-200">
          Tambo Assistant
        </span>
        <ThemeToggle />
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-neutral-500 opacity-60">
            <p>Start a conversation to manage your bookmarks.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[85%] md:max-w-[70%] px-4 py-3 rounded-2xl ${
                msg.role === "user"
                  ? "bg-black text-white dark:bg-white dark:text-black rounded-br-none"
                  : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-bl-none shadow-sm"
              }`}
            >
              <div className="whitespace-pre-wrap">
                {renderContent(msg.content)}
              </div>
            </div>

            {/* Render Generative Component if available */}
            {msg.role === "assistant" && msg.renderedComponent && (
              <div className="mt-4 w-full max-w-3xl animate-in fade-in slide-in-from-bottom-2 duration-500">
                {msg.renderedComponent}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask to create a bookmark..."
            className="w-full px-5 py-3 pr-12 rounded-full bg-neutral-100 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-black dark:focus:ring-white text-neutral-900 dark:text-white placeholder:text-neutral-500 transition-all outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="absolute right-2 p-2 bg-black dark:bg-white text-white dark:text-black rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
