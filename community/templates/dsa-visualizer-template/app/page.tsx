"use client";

import { useTamboThread, useTamboThreadInput } from "@tambo-ai/react";
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  Code2,
  Zap,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const { thread } = useTamboThread();
  const { value, setValue, submit, isPending } = useTamboThreadInput();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isPending) {
      submit();
    }
  };

  return (
    <main className="flex h-screen bg-[hsl(var(--background))]">
      {/* Left Sidebar - Problem/Info Panel */}
      <aside className="hidden lg:flex flex-col w-80 border-r border-border bg-[hsl(var(--card))]">
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="p-2 rounded-lg bg-[hsl(var(--primary))]/10">
            <Code2 className="w-6 h-6 text-[hsl(var(--primary))]" />
          </div>
          <div>
            <h1 className="font-bold gradient-text">DSA Visualizer</h1>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Powered by Tambo AI
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="p-4 space-y-3">
          <h2 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
            Features
          </h2>
          <div className="space-y-2">
            <FeatureItem
              icon={Zap}
              label="Array Visualization"
              desc="See sorting algorithms in action"
            />
            <FeatureItem
              icon={BookOpen}
              label="DP Tables"
              desc="Understand dynamic programming"
            />
            <FeatureItem
              icon={Sparkles}
              label="Step-by-Step"
              desc="Walk through any algorithm"
            />
          </div>
        </div>

        {/* Quick Topics */}
        <div className="p-4 space-y-3 border-t border-border">
          <h2 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
            Popular Topics
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              "Two Pointers",
              "Sliding Window",
              "Binary Search",
              "BFS/DFS",
              "Dynamic Programming",
              "Backtracking",
            ].map((topic) => (
              <span
                key={topic}
                className="px-2 py-1 text-xs rounded-md bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted-foreground))]/20 cursor-pointer transition-colors"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-auto p-4 border-t border-border">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-[hsl(var(--muted))]">
              <div className="text-lg font-bold text-[hsl(var(--primary))]">
                50+
              </div>
              <div className="text-xs text-[hsl(var(--muted-foreground))]">
                Algorithms
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[hsl(var(--muted))]">
              <div className="text-lg font-bold text-[hsl(var(--accent))]">
                ∞
              </div>
              <div className="text-xs text-[hsl(var(--muted-foreground))]">
                Visualizations
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center gap-3 p-4 border-b border-border bg-[hsl(var(--card))]">
          <div className="p-2 rounded-lg bg-[hsl(var(--primary))]/10">
            <Code2 className="w-5 h-5 text-[hsl(var(--primary))]" />
          </div>
          <div>
            <h1 className="font-bold gradient-text">DSA Visualizer</h1>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              by Tambo AI
            </p>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-4 space-y-6">
            {thread.messages.length === 0 ? (
              <EmptyState />
            ) : (
              thread.messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-4",
                    message.role === "user" ? "flex-row-reverse" : "flex-row",
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      "flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center",
                      message.role === "user"
                        ? "bg-[hsl(var(--accent))]/10"
                        : "bg-[hsl(var(--primary))]/10",
                    )}
                  >
                    {message.role === "user" ? (
                      <User className="w-5 h-5 text-[hsl(var(--accent))]" />
                    ) : (
                      <Bot className="w-5 h-5 text-[hsl(var(--primary))]" />
                    )}
                  </div>

                  {/* Content */}
                  <div
                    className={cn(
                      "flex-1 space-y-3",
                      message.role === "user" ? "text-right" : "text-left",
                    )}
                  >
                    {/* Role label */}
                    <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                      {message.role === "user" ? "You" : "Tambo AI"}
                    </span>

                    {/* Text content */}
                    {Array.isArray(message.content) ? (
                      message.content.map((part, i) =>
                        part.type === "text" && part.text ? (
                          <div
                            key={i}
                            className={cn(
                              "inline-block px-4 py-3 rounded-2xl text-sm",
                              message.role === "user"
                                ? "bg-[hsl(var(--primary))] text-white rounded-br-md"
                                : "bg-[hsl(var(--card))] border border-border rounded-bl-md",
                            )}
                          >
                            <p className="whitespace-pre-wrap">{part.text}</p>
                          </div>
                        ) : null,
                      )
                    ) : (
                      <div
                        className={cn(
                          "inline-block px-4 py-3 rounded-2xl text-sm",
                          message.role === "user"
                            ? "bg-[hsl(var(--primary))] text-white rounded-br-md"
                            : "bg-[hsl(var(--card))] border border-border rounded-bl-md",
                        )}
                      >
                        <p className="whitespace-pre-wrap">
                          {String(message.content)}
                        </p>
                      </div>
                    )}

                    {/* Rendered component */}
                    {message.renderedComponent && (
                      <div
                        className={cn(
                          "mt-3",
                          message.role === "user" ? "text-left" : "",
                        )}
                      >
                        {message.renderedComponent}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Loading indicator */}
            {isPending && (
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[hsl(var(--primary))]/10 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-[hsl(var(--primary))]" />
                </div>
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl rounded-bl-md bg-[hsl(var(--card))] border border-border">
                  <Loader2 className="w-4 h-4 animate-spin text-[hsl(var(--primary))]" />
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">
                    Thinking...
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-[hsl(var(--card))]">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4">
            <div className="relative flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Ask about any algorithm or data structure..."
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-[hsl(var(--muted))] border border-border focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/50 focus:border-[hsl(var(--primary))] text-sm placeholder:text-[hsl(var(--muted-foreground))] transition-all"
                  disabled={isPending}
                />
                <button
                  type="submit"
                  disabled={isPending || !value.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all btn-glow"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2 text-center">
              Press Enter to send • Powered by Tambo AI
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}

function FeatureItem({
  icon: Icon,
  label,
  desc,
}: {
  icon: React.ElementType;
  label: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors cursor-pointer">
      <div className="p-1.5 rounded-md bg-[hsl(var(--primary))]/10">
        <Icon className="w-4 h-4 text-[hsl(var(--primary))]" />
      </div>
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-[hsl(var(--muted-foreground))]">
          {desc}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* Hero */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-[hsl(var(--primary))]/20 blur-3xl rounded-full" />
        <div className="relative p-5 rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))]/20 to-[hsl(var(--accent))]/20 border border-[hsl(var(--primary))]/20">
          <Sparkles className="w-12 h-12 text-[hsl(var(--primary))]" />
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-2">
        <span className="gradient-text">Master DSA</span> with AI
      </h2>
      <p className="text-[hsl(var(--muted-foreground))] mb-8 max-w-md">
        Get interactive visualizations and step-by-step explanations for any
        algorithm. Just ask!
      </p>

      {/* Example prompts */}
      <div className="grid gap-3 w-full max-w-lg">
        <ExamplePrompt
          text="Visualize binary search on [1, 3, 5, 7, 9, 11] finding 7"
          icon="🔍"
        />
        <ExamplePrompt text="Explain Two Sum with a dry run" icon="🎯" />
        <ExamplePrompt
          text="Show DP table for 0/1 Knapsack with weights [1,2,3] and values [6,10,12]"
          icon="📊"
        />
        <ExamplePrompt text="Visualize sliding window technique" icon="🪟" />
      </div>
    </div>
  );
}

function ExamplePrompt({ text, icon }: { text: string; icon: string }) {
  const { setValue, submit } = useTamboThreadInput();

  const handleClick = () => {
    setValue(text);
    setTimeout(() => submit(), 50);
  };

  return (
    <button
      onClick={handleClick}
      className="group flex items-center gap-3 px-4 py-3 text-left text-sm rounded-xl border border-border bg-[hsl(var(--card))] hover:border-[hsl(var(--primary))]/50 hover:bg-[hsl(var(--primary))]/5 transition-all"
    >
      <span className="text-lg">{icon}</span>
      <span className="flex-1 text-[hsl(var(--foreground))]">{text}</span>
      <Send className="w-4 h-4 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))] transition-colors" />
    </button>
  );
}
