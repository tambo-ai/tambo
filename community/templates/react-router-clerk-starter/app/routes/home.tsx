import { useState, useRef } from "react";
import { SignedIn, SignedOut, UserButton, RedirectToSignIn } from "@clerk/react-router";
import { useTambo } from "@tambo-ai/react";
import { ArrowUp, Sparkles, User } from "lucide-react";

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

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const suggestedPrompts = [
    { title: "Get started", text: "What can you help me with?" },
    { title: "User card", text: "Show me a user card for Sarah Johnson" },
    { title: "Example", text: "Show me what components you can generate" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img src="/tamboai.png" alt="Tambo AI" className="h-8 w-8" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Tambo AI</h1>
              <p className="text-xs text-gray-500">React Router v7 + Clerk</p>
            </div>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Chat Messages */}
          <div className="h-[calc(100vh-16rem)] overflow-y-auto p-6">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center max-w-md animate-fade-in">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mx-auto mb-6">
                    <Sparkles className="h-8 w-8 text-gray-600" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Start a conversation
                  </h2>
                  <p className="text-gray-500 mb-6">
                    Ask me to generate UI components with natural language
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {suggestedPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handlePromptClick(prompt.text)}
                        className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
                      >
                        {prompt.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages
                  .filter((message: TamboMessage) => message.role !== "tool")
                  .map((message: TamboMessage) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 message-enter ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7FFFC3]">
                          <Sparkles className="h-4 w-4 text-gray-800" />
                        </div>
                      )}

                      <div className="max-w-[80%] space-y-3">
                        {/* Text content */}
                        {Array.isArray(message.content) && message.content.length > 0 && (
                          <div
                            className={`rounded-2xl px-4 py-3 ${
                              message.role === "user"
                                ? "bg-gray-900 text-white"
                                : "bg-gray-100 text-gray-900"
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
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                      )}
                    </div>
                  ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex gap-3 message-enter">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7FFFC3]">
                      <Sparkles className="h-4 w-4 text-gray-800" />
                    </div>
                    <div className="rounded-2xl bg-gray-100 px-4 py-3">
                      <span className="animate-thinking-gradient font-medium">
                        Thinking...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <form onSubmit={handleSubmit}>
              <div className="relative flex flex-col rounded-xl bg-white shadow-md border border-gray-200 p-2 px-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="flex-1 p-3 bg-transparent text-gray-900 resize-none text-sm min-h-[60px] max-h-[200px] focus:outline-none placeholder:text-gray-400"
                  disabled={isLoading}
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="w-10 h-10 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  >
                    <ArrowUp className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Powered by <span className="text-gray-600">Tambo AI</span> • <span className="text-gray-600">React Router v7</span> • <span className="text-gray-600">Clerk Auth</span>
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
