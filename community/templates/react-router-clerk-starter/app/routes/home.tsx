import { useState, useRef } from "react";
import { SignedIn, SignedOut, UserButton, RedirectToSignIn } from "@clerk/react-router";
import { useTambo } from "@tambo-ai/react";
import { ArrowUp, Sparkles, User, MessageCircle } from "lucide-react";

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
  const [selectedPrompt, setSelectedPrompt] = useState<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { thread, sendThreadMessage, isIdle } = useTambo();

  const messages = thread?.messages || [];
  const isLoading = !isIdle;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !sendThreadMessage) return;

    await sendThreadMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        handleSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  const handlePromptClick = (prompt: string, idx: number) => {
    setInput(prompt);
    setSelectedPrompt(idx);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const suggestedPrompts = [
    { title: "Get started", text: "What can you help me with?", primary: true },
    { title: "User card", text: "Show me a user card for Sarah Johnson", primary: false },
    { title: "Examples", text: "Show me what components you can generate", primary: false },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7FFFC3]">
              <img src="/tamboai.png" alt="Tambo AI" className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Tambo AI</h1>
              <p className="text-[11px] text-gray-400">React Router v7 + Clerk</p>
            </div>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-100/50 overflow-hidden">
          {/* Chat Messages */}
          <div className="h-[calc(100vh-18rem)] overflow-y-auto p-8">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center max-w-sm animate-fade-in">
                  {/* Icon with mint green background */}
                  <div className="relative inline-block mb-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#7FFFC3] mx-auto shadow-lg shadow-[#7FFFC3]/30">
                      <MessageCircle className="h-10 w-10 text-gray-800" />
                    </div>
                  </div>

                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Start a conversation
                  </h2>
                  <p className="text-gray-500 text-sm mb-8">
                    Ask me to generate UI components with natural language
                  </p>

                  {/* Suggestion buttons */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    {suggestedPrompts.map((prompt, idx) => {
                      const isSelected = selectedPrompt === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => handlePromptClick(prompt.text, idx)}
                          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isSelected
                              ? "bg-[#7FFFC3] text-gray-800 shadow-md shadow-[#7FFFC3]/20 scale-105"
                              : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100"
                            }`}
                        >
                          {prompt.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {messages
                  .filter((message: TamboMessage) => message.role !== "tool")
                  .map((message: TamboMessage) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 message-enter ${message.role === "user" ? "justify-end" : "justify-start"
                        }`}
                    >
                      {message.role === "assistant" && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#7FFFC3]">
                          <Sparkles className="h-4 w-4 text-gray-800" />
                        </div>
                      )}

                      <div className="max-w-[75%] space-y-3">
                        {/* Text content */}
                        {Array.isArray(message.content) && message.content.length > 0 && (
                          <div
                            className={`rounded-2xl px-4 py-3 ${message.role === "user"
                              ? "bg-gray-900 text-white"
                              : "bg-gray-50 text-gray-800 border border-gray-100"
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
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>
                      )}
                    </div>
                  ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex gap-3 message-enter">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#7FFFC3]">
                      <Sparkles className="h-4 w-4 text-gray-800" />
                    </div>
                    <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3">
                      <span className="animate-thinking-gradient font-medium text-sm">
                        Thinking...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-100 bg-gray-50/50 p-4">
            <form onSubmit={handleSubmit}>
              <div className="relative flex flex-col rounded-xl bg-white border border-gray-200 shadow-sm p-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="flex-1 bg-transparent text-gray-900 resize-none text-sm min-h-[80px] max-h-[200px] focus:outline-none placeholder:text-gray-400"
                  disabled={isLoading}
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="w-9 h-9 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all hover:scale-105"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-gray-400 mt-6">
          Powered by <span className="font-medium text-gray-500">Tambo AI</span> • <span className="font-medium text-gray-500">React Router v7</span> • <span className="font-medium text-gray-500">Clerk</span>
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
