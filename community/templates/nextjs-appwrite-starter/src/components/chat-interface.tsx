"use client";

import { Button } from "@/components/ui/button";
import { account } from "@/lib/appwrite";
import { useTamboThread, useTamboThreadInput } from "@tambo-ai/react";
import { LogOut, Send, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * ChatInterface component - the main chat UI for the Tambo + Appwrite starter.
 * Shows messages from both user and AI, including rendered Tambo components.
 */
export function ChatInterface() {
  const { thread, error: threadError } = useTamboThread();
  const {
    value,
    setValue,
    submit,
    isPending,
    error: inputError,
  } = useTamboThreadInput();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [thread?.messages]);

  // Debug logging
  useEffect(() => {
    console.log("=== THREAD STATE ===");
    console.log("Thread ID:", thread?.id);
    console.log("Messages count:", thread?.messages?.length || 0);
    console.log("Thread error:", threadError);
    console.log("isPending:", isPending);
  }, [thread, isPending, threadError]);

  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
      router.push("/login");
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  const suggestions = [
    "Create a note titled 'Meeting Notes' with 'Discuss Q1 roadmap'",
    "Make a shopping list note with 'Milk, Eggs, Bread'",
    "Create a todo note titled 'Tasks' with 'Review PR, Deploy app'",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isPending) return;

    try {
      // Must set streamResponse: true for messages to persist in thread
      await submit({
        streamResponse: true,
      });
      console.log("Submit completed successfully");
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  if (!thread) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading conversation...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Image
            src="/Tambo-Lockup.svg"
            alt="Tambo"
            width={100}
            height={32}
            className="h-6 w-auto"
          />
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-lg font-light">+</span>
            <div className="flex items-center gap-1.5">
              <Image
                src="/appwrite-icon.svg"
                alt="Appwrite"
                width={20}
                height={20}
                className="h-5 w-5"
              />
              <span className="text-sm font-medium">Appwrite</span>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          {/* Show errors if any */}
          {(threadError || inputError) && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-xl">
              <p className="font-semibold">Error:</p>
              <p className="text-sm">
                {threadError?.message || inputError?.message}
              </p>
            </div>
          )}

          {thread.messages.length === 0 ? (
            <div className="text-center py-16 animate-fade-in">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">
                Welcome to Tambo + Appwrite
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Ask the AI to create notes. They&apos;ll be saved to your
                Appwrite database automatically.
              </p>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-3">
                  Try these examples:
                </p>
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setValue(suggestion)}
                    className="block w-full max-w-md mx-auto text-left px-4 py-3 rounded-xl border border-border bg-card hover:bg-accent hover:border-accent-foreground/20 transition-all duration-200 text-sm"
                  >
                    &ldquo;{suggestion}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          ) : (
            thread.messages.map((message) => (
              <div
                key={message.id}
                className={`flex animate-fade-in ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border shadow-sm"
                  }`}
                >
                  {/* Render text content */}
                  {Array.isArray(message.content) ? (
                    message.content.map((part, i) =>
                      part.type === "text" ? (
                        <p
                          key={i}
                          className="whitespace-pre-wrap leading-relaxed"
                        >
                          {part.text}
                        </p>
                      ) : null,
                    )
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {String(message.content)}
                    </p>
                  )}

                  {/* Render component if present */}
                  {message.renderedComponent && (
                    <div className="mt-3">{message.renderedComponent}</div>
                  )}
                </div>
              </div>
            ))
          )}

          {isPending && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-card border border-border rounded-2xl px-4 py-3 shadow-sm">
                <span className="animate-thinking-gradient">Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card/80 backdrop-blur-sm p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-3">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ask AI to create a note..."
            disabled={isPending}
            className="flex-1 px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 disabled:opacity-50"
          />
          <Button
            type="submit"
            disabled={isPending || !value.trim()}
            className="px-6 rounded-xl transition-all duration-200 hover:scale-105"
          >
            <Send className="w-4 h-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
