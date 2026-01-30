"use client";

import { useTamboThread, useTamboThreadInput } from "@tambo-ai/react";
import { Send, Bot, User } from "lucide-react";
import { useEffect, useRef } from "react";

export default function Chat() {
  const { thread } = useTamboThread();
  const { value, setValue, submit, isPending } = useTamboThreadInput();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [thread.messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      submit();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">CRM Assistant</h3>
          <p className="text-xs text-gray-500">Online</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {thread.messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              Start a conversation to manage your contacts
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Try: &quot;Add a new contact&quot; or &quot;Show all
              contacts&quot;
            </p>
          </div>
        )}

        {thread.messages.map((message) => {
          // Check if message should be hidden
          const shouldHideMessage = Array.isArray(message.content)
            ? message.content.every(
                (part) =>
                  part.type === "text" &&
                  part.text &&
                  (part.text.trim() === "}" ||
                    part.text.includes('{"success"') ||
                    part.text.includes('{"error"') ||
                    part.text.trim() === ""),
              )
            : String(message.content).trim() === "}" ||
              String(message.content).includes('{"success"') ||
              String(message.content).includes('{"error"') ||
              String(message.content).trim() === "";

          // Skip message if it should be hidden and has no component
          if (shouldHideMessage && !message.renderedComponent) {
            return null;
          }

          return (
            <div
              key={message.id}
              className={`flex gap-3 animate-in slide-in-from-bottom-2 duration-300 ${
                message.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === "user"
                    ? "bg-blue-500"
                    : "bg-gray-100 border border-gray-200"
                }`}
              >
                {message.role === "user" ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-gray-600" />
                )}
              </div>

              {/* Message Content */}
              <div
                className={`max-w-[70%] ${
                  message.role === "user" ? "items-end" : "items-start"
                } flex flex-col gap-1`}
              >
                {!shouldHideMessage && (
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      message.role === "user"
                        ? "bg-blue-500 text-white rounded-br-md"
                        : "bg-gray-100 text-gray-900 rounded-bl-md"
                    }`}
                  >
                    {Array.isArray(message.content)
                      ? message.content.map((part, i) => {
                          if (part.type === "text" && part.text) {
                            // Hide unwanted content
                            if (
                              part.text.includes('{"success"') ||
                              part.text.includes('{"error"') ||
                              part.text.trim() === "}" ||
                              part.text.trim() === ""
                            ) {
                              return null;
                            }
                            return (
                              <p key={i} className="text-sm leading-relaxed">
                                {part.text}
                              </p>
                            );
                          }
                          return null;
                        })
                      : (() => {
                          const content = String(message.content);
                          if (
                            content.includes('{"success"') ||
                            content.includes('{"error"') ||
                            content.trim() === "}" ||
                            content.trim() === ""
                          ) {
                            return null;
                          }
                          return (
                            <p className="text-sm leading-relaxed">{content}</p>
                          );
                        })()}
                  </div>
                )}

                {/* Rendered Component */}
                {message.renderedComponent && (
                  <div className="mt-2 animate-in fade-in duration-500">
                    {message.renderedComponent}
                  </div>
                )}

                {/* Timestamp */}
                {(!shouldHideMessage || message.renderedComponent) && (
                  <p className="text-xs text-gray-400 px-2">
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {isPending && (
          <div className="flex gap-3 animate-in slide-in-from-bottom-2 duration-300">
            <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
              <Bot className="w-4 h-4 text-gray-600" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-100">
        <form onSubmit={handleSubmit} className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Type a message..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
              disabled={isPending}
            />
          </div>
          <button
            type="submit"
            disabled={isPending || !value.trim()}
            className="w-10 h-10 bg-black hover:bg-gray-800 disabled:bg-gray-300 rounded-full flex items-center justify-center transition-colors duration-200"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
      </div>
    </div>
  );
}
