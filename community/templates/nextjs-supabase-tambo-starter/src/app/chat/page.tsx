"use client";

import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { useMcpServers } from "@/components/tambo/mcp-config-modal";
import { components, tools } from "@/lib/tambo";
import { TamboProvider } from "@tambo-ai/react";

export default function Home() {
  const mcpServers = useMcpServers();

  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      components={components}
      tools={tools}
      tamboUrl={process.env.NEXT_PUBLIC_TAMBO_URL}
      mcpServers={mcpServers}
    >
      {/* Tactical Ops Root */}
      <div className="h-screen w-full bg-[#0b0d10] text-[#d1d5db] flex">

        {/* Main Panel */}
        <div className="flex-1">
          <div
            className="
              h-full
              w-full
              rounded-md
              border
              border-[#24262b]
              bg-[#0f1115]
              overflow-hidden
              flex
              flex-col
            "
          >
            {/* Header Bar */}
            <div
              className="
                flex
                items-center
                justify-between
                px-5
                py-3
                border-b
                border-[#24262b]
                bg-[#0c0e12]
              "
            >
              <div className="flex items-center gap-3">
                <span className="text-xs tracking-widest text-orange-500 font-semibold">
                  TACTICAL COMMAND
                </span>
                <span className="text-xs text-gray-500">
                  / MESSAGE INTERFACE
                </span>
              </div>

              <span className="text-[11px] text-gray-500">
                SYSTEM STATUS: ONLINE
              </span>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-[#0f1115]">
              <MessageThreadFull />
            </div>
          </div>
        </div>
      </div>
    </TamboProvider>
  );
}
