import { useState, useRef } from "react";
import { SignedIn, SignedOut, UserButton, RedirectToSignIn } from "@clerk/react-router";
import { useTambo } from "@tambo-ai/react";
import { Send, Sparkles, User, MessageSquare } from "lucide-react";

// Message types from Tambo thread
interface TamboMessageContent {
  type: string;
  text?: string;
}

interface TamboMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: TamboMessageContent[];
  renderedComponent?: React.ReactNode;
}

export function meta() {
  return [
    { title: "React Router v7 + Clerk + Tambo" },
    { name: "description", content: "AI-powered chat with generative UI" },
  ];
}

function ChatInterface() {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { thread, sendThreadMessage, isIdle } = useTambo();

  const messages = thread?.messages || [];
  const isLoading = !isIdle;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !sendThreadMessage) return;

    await sendThreadMessage(input);
    setInput("");
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    // Focus the input after setting value
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const suggestedPrompts = [
    "Show me a user card for Sarah Johnson",
    "Get user info for john.doe@example.com",
    "Create a user card for Mike Chen",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg blur opacity-50" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-lg overflow-hidden">
                <img src="/tamboai.png" alt="Tambo AI" className="h-10 w-10 object-contain" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Tambo AI</h1>
              <p className="text-xs text-slate-400">React Router v7 + Clerk</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-400 font-medium">Connected</span>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="container mx-auto max-w-4xl px-4 py-6">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
          {/* Chat Messages */}
          <div className="h-[calc(100vh-14rem)] overflow-y-auto p-6">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center max-w-md animate-fade-in">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-xl opacity-30 animate-pulse-glow" />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto">
                      <MessageSquare className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Start a conversation
                  </h2>
                  <p className="text-slate-400 mb-6">
                    Ask me to generate UI components with natural language
                  </p>
                  <div className="space-y-2">
                    {suggestedPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handlePromptClick(prompt)}
                        className="block w-full text-left px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-slate-200 text-sm hover:bg-slate-700 hover:border-indigo-500/50 transition-all duration-200"
                      >
                        <span className="text-indigo-400 mr-2">→</span>
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages
                  .filter((message: TamboMessage) => message.role !== "tool")
                  .map((message: TamboMessage, index: number) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 message-enter ${message.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {message.role === "assistant" && (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                      )}

                      <div className="max-w-[80%] space-y-3">
                        {/* Text content */}
                        {Array.isArray(message.content) && message.content.length > 0 && (
                          <div
                            className={`rounded-2xl px-4 py-3 ${message.role === "user"
                              ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg"
                              : "bg-slate-700/80 text-slate-100 border border-slate-600/50"
                              }`}
                          >
                            {message.content.map((part: TamboMessageContent, idx: number) => {
                              if (part.type === "text") {
                                return <span key={idx}>{part.text}</span>;
                              }
                              return null;
                            })}
                          </div>
                        )}

                        {/* Generated component */}
                        {message.renderedComponent && (
                          <div className="animate-slide-up">
                            {message.renderedComponent}
                          </div>
                        )}
                      </div>

                      {message.role === "user" && (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-600 border border-slate-500">
                          <User className="h-4 w-4 text-slate-200" />
                        </div>
                      )}
                    </div>
                  ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex gap-3 message-enter">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500">
                      <Sparkles className="h-4 w-4 text-white animate-pulse" />
                    </div>
                    <div className="rounded-2xl bg-slate-700/80 border border-slate-600/50 px-4 py-3">
                      <div className="flex gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" />
                        <span className="h-2 w-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0.15s" }} />
                        <span className="h-2 w-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: "0.3s" }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-700/50 bg-slate-900/50 p-4">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me to generate a component..."
                className="flex-1 rounded-xl bg-slate-800 border border-slate-600 px-4 py-3 text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 font-medium text-white transition-all hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed btn-glow"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-4">
          Powered by <span className="text-indigo-400">Tambo AI</span> • <span className="text-purple-400">React Router v7</span> • <span className="text-pink-400">Clerk Auth</span>
        </p>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        <ChatInterface />
      </SignedIn>
    </>
  );
}
