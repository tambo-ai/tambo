"use client";

import { useState, useMemo, type ChangeEvent } from "react";
import { TamboProvider } from "../tambo/TamboProvider";
import { MessageList } from "./MessageList";
import { InputForm } from "./InputForm";
import { useTamboThread, useTamboThreadList } from "@tambo-ai/react";
import {
  Plus,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Loader2,
  ExternalLink,
} from "lucide-react";

/**
 * Main layout component for the chat interface.
 * Handles the sidebar state, thread list management, and main chat area layout.
 */
function ChatLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { thread, currentThreadId, switchCurrentThread, startNewThread } =
    useTamboThread();

  // Get real threads from the SDK
  const { data: threadsData, isLoading: isLoadingThreads } =
    useTamboThreadList();

  // Filter threads based on search input
  const filteredThreads = useMemo(() => {
    const threads = threadsData?.items || [];
    return threads.filter((t) =>
      (t.name || "New Thread")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
    );
  }, [threadsData, searchQuery]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] max-w-[1600px] mx-auto bg-white border border-zinc-200 shadow-2xl rounded-[32px] overflow-hidden mt-4 animate-fade-in">
      {/* Sidebar */}
      <div
        className={`
                ${isSidebarOpen ? "w-80" : "w-0"} 
                transition-all duration-500 ease-in-out border-r border-zinc-100 bg-zinc-50/50 flex flex-col overflow-hidden
            `}
      >
        <div className="p-6">
          <button
            onClick={() => startNewThread()}
            className="w-full h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center gap-2 font-semibold hover:bg-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-zinc-200"
          >
            <Plus size={18} />
            New Thread
          </button>
        </div>

        <div className="px-6 mb-4">
          <div className="relative group">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 transition-colors"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search history..."
              className="w-full h-10 rounded-xl bg-white border border-zinc-200 pl-9 pr-4 text-xs focus:ring-4 focus:ring-zinc-100 focus:border-zinc-300 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-1">
          <div className="px-3 py-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center justify-between">
            Recent Threads
            {isLoadingThreads && <Loader2 size={10} className="animate-spin" />}
          </div>

          {filteredThreads.map((t) => (
            <button
              key={t.id}
              onClick={() => switchCurrentThread(t.id)}
              className={`
                                w-full p-3 rounded-2xl flex items-center gap-3 transition-all hover:bg-white hover:shadow-sm group text-left
                                ${t.id === currentThreadId ? "bg-white shadow-sm border border-zinc-100" : "text-zinc-500 hover:text-zinc-900"}
                            `}
            >
              <MessageSquare
                size={16}
                className={
                  t.id === currentThreadId
                    ? "text-zinc-900"
                    : "text-zinc-400 group-hover:text-zinc-900 flex-shrink-0"
                }
              />
              <span className="text-sm font-medium truncate flex-1">
                {t.name || "New Thread"}
              </span>
            </button>
          ))}

          {!isLoadingThreads && filteredThreads.length === 0 && (
            <div className="p-8 text-center text-xs text-zinc-400 italic">
              No threads found
            </div>
          )}
        </div>

        <div className="p-6 border-t border-zinc-100">
          <div className="flex items-center gap-3 p-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
              <img
                src="/Octo-Icon.svg"
                alt="Tambo Logo"
                className="w-5 h-5 invert"
              />
            </div>{" "}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-zinc-900 truncate">
                Assistant
              </div>
              <div className="text-[10px] text-zinc-400 font-medium tracking-tighter uppercase">
                Tambo AI
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white relative">
        {/* Header */}
        <div className="h-16 border-b border-zinc-50 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl hover:bg-zinc-50 text-zinc-400 hover:text-zinc-900 transition-all"
            >
              {isSidebarOpen ? (
                <PanelLeftClose size={20} />
              ) : (
                <PanelLeftOpen size={20} />
              )}
            </button>
            <h2 className="font-bold text-zinc-900 tracking-tight truncate max-w-md">
              {thread?.name || "Current Session"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              Live Engine
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-12 py-8 space-y-8 scroll-smooth scrollbar-thin scrollbar-thumb-zinc-100 hover:scrollbar-thumb-zinc-200">
          <MessageList />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-8 pt-2">
          <div className="max-w-4xl mx-auto">
            <InputForm />
            <div className="mt-4 text-center">
              <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-[0.2em] flex items-center justify-center gap-1">
                Powered by Tambo Intelligence and UI components
                <a
                  href="https://docs.tambo.co/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-zinc-900 transition-all inline-flex items-center ml-0.5"
                >
                  <ExternalLink size={10} strokeWidth={3} />
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Top-level component that provides the Tambo context to the chat application.
 * Wraps the ChatLayout with TamboProvider.
 */
export function ChatInterface() {
  return (
    <TamboProvider>
      <ChatLayout />
    </TamboProvider>
  );
}
