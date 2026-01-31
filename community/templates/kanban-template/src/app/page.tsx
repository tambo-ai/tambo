"use client";

import { KanbanBoard } from "@/components/tambo/kanban-board";
import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { components, tools } from "@/lib/tambo";
import { useTaskStore } from "@/lib/task-store";
import { TamboProvider } from "@tambo-ai/react";
import Image from "next/image";
import * as React from "react";

function DarkModeToggle() {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  const toggle = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark(!isDark);
  };

  return (
    <button
      onClick={toggle}
      className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

type PriorityFilter = "all" | "high" | "medium" | "low";

function TaskCount() {
  const tasks = useTaskStore((state) => state.tasks);
  const doneCount = tasks.filter((t) => t.status === "done").length;

  if (tasks.length === 0) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="bg-muted px-2 py-0.5 rounded">
        {tasks.length} task{tasks.length !== 1 ? "s" : ""}
      </span>
      {doneCount > 0 && (
        <span className="text-emerald-600">
          {doneCount} done
        </span>
      )}
    </div>
  );
}

function PriorityFilterSelect({
  value,
  onChange,
}: {
  value: PriorityFilter;
  onChange: (v: PriorityFilter) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as PriorityFilter)}
      className="text-xs bg-muted border-0 rounded px-2 py-1 text-muted-foreground focus:ring-1 focus:ring-primary"
    >
      <option value="all">All priorities</option>
      <option value="high">High only</option>
      <option value="medium">Medium only</option>
      <option value="low">Low only</option>
    </select>
  );
}

export default function Home() {
  const [priorityFilter, setPriorityFilter] = React.useState<PriorityFilter>("all");

  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      components={components}
      tools={tools}
      tamboUrl={process.env.NEXT_PUBLIC_TAMBO_URL}
    >
      <div className="h-screen flex flex-col bg-background">
        {/* Header */}
        <header className="border-b border-border px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/Octo-Icon.svg"
              alt="Tambo"
              width={28}
              height={28}
              className="opacity-90"
            />
            <div className="flex items-baseline gap-2">
              <h1 className="text-lg font-display font-semibold tracking-tight">
                kanban
              </h1>
              <span className="text-xs text-muted-foreground font-light">
                powered by tambo
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <TaskCount />
            <PriorityFilterSelect value={priorityFilter} onChange={setPriorityFilter} />
            <DarkModeToggle />
            <a
              href="https://tambo.co"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              docs →
            </a>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Kanban Board */}
          <div className="flex-1 lg:flex-[7] overflow-auto bg-muted/30 bg-dot-pattern">
            <KanbanBoard priorityFilter={priorityFilter} />
          </div>

          {/* Chat Panel */}
          <div className="h-[45vh] lg:h-full lg:flex-[3] border-t lg:border-t-0 lg:border-l border-border bg-background">
            <MessageThreadFull />
          </div>
        </div>
      </div>
    </TamboProvider>
  );
}
