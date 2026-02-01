"use client";

import { useTamboThread, useTamboThreadInput } from "@tambo-ai/react";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
interface MessageContent {
  content?: string | { text?: string } | Array<{ text?: string }>;
  text?: string;
}
export function Dashboard() {
  const { thread } = useTamboThread();
  const { value, setValue, submit, isPending } = useTamboThreadInput();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [thread.messages]);

  // Log thread changes for debugging
  useEffect(() => {
    console.log("Thread updated:", {
      messageCount: thread.messages.length,
      lastMessage: thread.messages[thread.messages.length - 1],
    });
  }, [thread.messages]);

  const [suggestions] = useState([
    "Create a dashboard for Kaushalendra using https://github.com/Kaushalendra-Marcus data to highlight performance and impact",
    "Compare Kaushalendra vs Meenakshi expenses, savings, burn rate, and financial risk",
    "Show sales metrics with growth rate 117% in $",
    "Analyze Tambo AI revenue, burn rate, runway, and overall growth health",
    "Display system performance metrics (CPU, memory, uptime)",
    "Display system health status",
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      console.log("Submitting:", value);
      submit();
      setValue("");
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setValue(suggestion);
    setTimeout(() => {
      const form = document.querySelector("form");
      if (form) {
        form.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        );
      }
    }, 50);
  };

  // Fixed getMessageContent function
  const getMessageContent = (message: MessageContent): string => {
    try {
      if (typeof message.content === "string") {
        const contentStr = message.content;
        if (
          contentStr.startsWith("[") &&
          contentStr.includes('"type":"text"')
        ) {
          try {
            const parsedArray = JSON.parse(contentStr) as Array<{
              text?: string;
            }>;
            if (Array.isArray(parsedArray) && parsedArray.length > 0) {
              const firstItem = parsedArray[0];
              if (firstItem && firstItem.text) {
                return firstItem.text;
              }
            }
          } catch (e) {
            console.log("JSON parse failed:", e);
          }
        }
        if (contentStr.startsWith("{") && contentStr.includes('"text"')) {
          try {
            const parsedObj = JSON.parse(contentStr) as { text?: string };
            if (parsedObj && parsedObj.text) {
              return parsedObj.text;
            }
          } catch (e) {
            console.log("JSON parse failed:", e);
          }
        }

        return contentStr;
      }

      if (
        message.content &&
        typeof message.content === "object" &&
        !Array.isArray(message.content)
      ) {
        const contentObj = message.content as { text?: string };
        if (contentObj.text) {
          return contentObj.text;
        }
      }

      if (message.content && Array.isArray(message.content)) {
        const contentArray = message.content as Array<{ text?: string }>;
        if (contentArray.length > 0) {
          const firstItem = contentArray[0];
          if (firstItem && firstItem.text) {
            return firstItem.text;
          }
        }
      }

      if (message.text) {
        return message.text;
      }

      if (message.content && typeof message.content === "object") {
        return JSON.stringify(message.content);
      }

      return "";
    } catch (error) {
      console.error("Error getting message content:", error);
      return "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9 overflow-hidden rounded-lg border border-gray-200 bg-gradient-to-br from-blue-500 to-purple-600">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="text-sm">
                <span className="font-semibold text-gray-900">
                  AI Dashboard Assistant
                </span>
                <span className="mx-2 text-gray-400">•</span>
                <span className="text-gray-600">
                  Ask for data visualizations
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-xs font-medium text-green-700">
                Connected
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {thread.messages.filter((m) => m.role !== "system").length === 0 && (
          <div className="mb-8 rounded-xl border border-gray-200 bg-gradient-to-r from-blue-50 to-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-white shadow-md">
                <Image
                  src="/logo.png"
                  alt="AI Assistant"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Welcome to AI Dashboard
                </h2>
                <p className="text-sm text-gray-600">
                  I can create data visualizations, analyze metrics, and
                  generate reports.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">
                Try asking me to:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 space-y-4">
          {thread.messages
            .filter((msg) => msg.role !== "system")
            .map((message) => {
              const content = getMessageContent(message);

              return (
                <div key={message.id}>
                  {/* User message */}
                  {message.role === "user" && content && (
                    <div className="mb-4 flex justify-end">
                      <div className="max-w-[80%] rounded-2xl rounded-br-none bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3 shadow-md">
                        <p className="text-white font-medium">{content}</p>
                      </div>
                    </div>
                  )}

                  {/* Assistant message */}
                  {message.role === "assistant" && (
                    <div className="mb-6">
                      <div className="mb-3 flex items-start gap-3">
                        <div className="relative mt-1 h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border-2 border-white shadow-sm">
                          <Image
                            src="/logo.png"
                            alt="AI Assistant"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* Render component */}
                          {message.renderedComponent && (
                            <div className="mb-4">
                              {message.renderedComponent}
                            </div>
                          )}

                          {/* Text explanation */}
                          {content && (
                            <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
                              <p className="text-gray-700 leading-relaxed">
                                {content}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="sticky bottom-6 rounded-xl border border-gray-200 bg-white p-5 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Example: 'Create a dashboard for Kaushalendra using https://github.com/Kaushalendra-Marcus data to highlight performance and impact'"
                className="flex-1 rounded-xl border border-gray-300 bg-white px-5 py-3.5 text-gray-900 placeholder-gray-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                disabled={isPending}
                autoFocus
              />
              <button
                type="submit"
                disabled={isPending || !value.trim()}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3.5 font-semibold text-white shadow-md transition-all hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    <span>Processing...</span>
                  </span>
                ) : (
                  "Send"
                )}
              </button>
            </div>

            {thread.messages.filter((m) => m.role !== "system").length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-gray-500">Try:</span>
                {suggestions.slice(0, 3).map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-100"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
