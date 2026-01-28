"use client";

import dynamic from "next/dynamic";
import { TamboProvider, useTamboThread, useTamboThreadInput } from "@tambo-ai/react";
import { tools } from "@/lib/tambo";

function ChatInterface() {
  const { thread } = useTamboThread();
  const { value, setValue, submit, isPending } = useTamboThreadInput();

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // ✅ Fix: Explicitly handle floating promise
    void submit();
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
        <h1 className="text-sm font-semibold text-zinc-100">Hono AI Assistant</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {thread.messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl ${
              message.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none shadow-md'
            }`}>
              <div className="text-sm leading-relaxed space-y-2">
                {Array.isArray(message.content) ? (
                  message.content.map((part, i) => {
                    // ✅ Fix: Replaced nested ternary with clear if/else logic
                    if (typeof part === 'string') return <p key={i}>{part}</p>;
                    if (typeof part === 'object' && part !== null && 'title' in part) {
                      return (
                        <div key={i} className="p-2 mt-1 bg-zinc-800/50 rounded border border-zinc-700 font-mono text-xs flex justify-between items-center">
                          <span>{(part as any).title}</span>
                          <span className="bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded text-[10px] uppercase">{(part as any).status}</span>
                        </div>
                      );
                    }
                    return <pre key={i} className="text-xs">{JSON.stringify(part, null, 2)}</pre>;
                  })
                ) : (
                  <p>{String(message.content)}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-zinc-900/30 border-t border-zinc-800">
        <form onSubmit={handleFormSubmit} className="flex gap-3 max-w-3xl mx-auto items-center">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ask Hono to 'list tasks'..."
            className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <button 
            type="submit" 
            disabled={!value || isPending}
            className="bg-blue-600 px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
          >
            {isPending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}

const ClientOnlyApp = dynamic(() => Promise.resolve(() => (
  <main className="flex h-screen items-center justify-center bg-zinc-950 p-4 font-sans antialiased">
    <div className="w-full max-w-3xl h-[750px] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl bg-zinc-950">
      <TamboProvider tools={tools} apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}>
        <ChatInterface />
      </TamboProvider>
    </div>
  </main>
)), { ssr: false });

export default function Home() {
  return <ClientOnlyApp />;
}