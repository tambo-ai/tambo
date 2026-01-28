"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { FlowCanvas } from "@/components/flow/flow-canvas";
import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { TamboProvider } from "@tambo-ai/react";
import { components, tools } from "@/lib/tambo";

export default function Home() {
  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      components={components}
      tools={tools}
    >
      <div className="flex h-screen overflow-hidden bg-background font-sans text-foreground">
        <Sidebar className="hidden md:block" />
        <main className="flex-1 flex flex-col relative overflow-hidden">
          {/* The generative canvas */}
          <FlowCanvas className="absolute inset-0 z-0" />

          {/* The chat overlay */}
          <div className="absolute right-0 top-0 bottom-0 w-[450px] z-10 pointer-events-none">
            <div className="h-full pointer-events-auto bg-background/95 backdrop-blur border-l shadow-xl flex flex-col">
              <div className="p-4 border-b font-medium">Generative Flow Assistant</div>
              <div className="flex-1 overflow-hidden">
                <MessageThreadFull />
              </div>
            </div>
          </div>
        </main>
      </div>
    </TamboProvider>
  );
}
