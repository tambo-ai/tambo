"use client";

import { KanbanBoard } from "@/components/tambo/kanban-board";
import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { components, tools } from "@/lib/tambo";
import { TamboProvider } from "@tambo-ai/react";
import { LayoutGrid } from "lucide-react";

export default function Home() {
  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      components={components}
      tools={tools}
      tamboUrl={process.env.NEXT_PUBLIC_TAMBO_URL}
    >
      <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-950">
        {/* Header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <LayoutGrid className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Kanban Board
            </h1>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Kanban Board - 70% on desktop */}
          <div className="flex-1 lg:flex-[7] overflow-auto">
            <KanbanBoard className="h-full" />
          </div>

          {/* Chat Panel - 30% on desktop */}
          <div className="h-[50vh] lg:h-full lg:flex-[3] border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <MessageThreadFull />
          </div>
        </div>
      </div>
    </TamboProvider>
  );
}
