"use client";

import {
  MessageInput,
  MessageInputSubmitButton,
  MessageInputTextarea,
  MessageInputToolbar,
} from "@/components/tambo/message-input";
import { ScrollableMessageContainer } from "@/components/tambo/scrollable-message-container";
import {
  ThreadContent,
  ThreadContentMessages,
} from "@/components/tambo/thread-content";
import { components, tools } from "@/lib/tambo";
import { TamboProvider } from "@tambo-ai/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { SettingsPanel } from "./components/settings-panel";

export default function InteractablesPage() {
  const [isChatOpen, setIsChatOpen] = useState(true);

  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      components={components}
      tools={tools}
      tamboUrl={process.env.NEXT_PUBLIC_TAMBO_URL}
    >
      <div className="flex h-screen bg-[#0b0d10] text-[#d1d5db] overflow-hidden">

        {/* Chat Sidebar */}
        <aside
          className={`
            relative
            transition-[width] duration-300
            ${isChatOpen ? "w-[360px]" : "w-0"}
            overflow-hidden
            border-r border-[#24262b]
            bg-[#0f1115]
            flex flex-col
          `}
        >
          {isChatOpen && (
            <>
              {/* Header */}
              <div className="px-5 py-4 border-b border-[#24262b] bg-[#0c0e12]">
                <h2 className="text-xs tracking-[0.3em] text-orange-500 font-semibold">
                  AI CONSOLE
                </h2>
              </div>

              {/* Messages */}
              <div className="flex-1 relative min-h-0">
              <ScrollableMessageContainer>
                <ThreadContent className="flex-1 min-h-0" variant="default">
                  <ThreadContentMessages />
                </ThreadContent>
              </ScrollableMessageContainer>
              </div>

              {/* Input */}
              <div className="border-t border-[#24262b] p-4 bg-[#0c0e12]">
                <MessageInput variant="bordered">
                  <MessageInputTextarea
                    placeholder="Transmit command…"
                    className="bg-[#0b0d10] border border-[#24262b]"
                  />
                  <MessageInputToolbar>
                    <MessageInputSubmitButton />
                  </MessageInputToolbar>
                </MessageInput>
              </div>
            </>
          )}

          {/* Toggle Button */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="
              absolute
              top-1/2
              -right-8
              -translate-y-1/2
              border
              border-[#24262b]
              bg-[#0c0e12]
              p-2
              transition-colors
              hover:bg-[#14161b]
            "
            aria-label="Toggle chat panel"
          >
            {isChatOpen ? (
              <ChevronLeft className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-[#0b0d10]">
          <div className="p-10">
            <SettingsPanel />
          </div>
        </main>
      </div>
    </TamboProvider>
  );
}
