"use client";

import {
  TamboProvider,
  useTamboThread,
  useTamboThreadInput,
} from "@tambo-ai/react";
import { tools } from "./tools";
import TaskList from "../../components/tambo/TaskList";
import { z } from "zod";

function ChatUI() {
    const { thread } = useTamboThread();
    const { value, setValue, submit, isPending } = useTamboThreadInput();
  
    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="w-full max-w-2xl bg-card rounded-xl shadow-lg border border-border flex flex-col">
  
          {/* Header */}
          <div className="px-4 py-3 border-b border-border font-semibold text-lg bg-accent">
            🤖 Tambo Prisma Chat
          </div>
  
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {thread.messages.map((m) => (
              <div
              key={m.id}
              className={`space-y-2 ${
                m.role === "user" ? "flex justify-end" : "flex justify-start"
              }`}
            >
               {Array.isArray(m.content) &&
  m.content.map((part, i) => {
    if (part.type !== "text") return null;

    // hide raw JSON payloads
    if (part.text.trim().startsWith("{")) return null;

    return (
      <div
        key={i}
        className="bg-muted p-3 rounded-lg text-sm"
      >
        {part.text}
      </div>
    );
  })}

  
                {m.renderedComponent && (
                  <div className="bg-accent p-3 rounded-lg">
                    {m.renderedComponent}
                  </div>
                )}
              </div>
            ))}
          </div>
  
          {/* Input Bar */}
          <div className="p-3 border-t border-border flex gap-2">
            <input
              className="flex-1 rounded-full border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Try: Add task Buy milk"
            />
  
            <button
            
              onClick={() => submit()}
              disabled={isPending}
              className="
              bg-primary text-primary-foreground
              px-6 py-3 rounded-lg
              transition-transform duration-200
              hover:scale-[1.03]
              active:scale-95"
              >
              Send
            </button>
          </div>
  
        </div>
      </div>
    );
  }
  

export default function ChatClient() {
  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      tools={tools}
      components={[
        {
          name: "TaskList",
          description: "Displays a list of tasks",
          component: TaskList,
          propsSchema: z.object({
            tasks: z.array(
              z.object({
                id: z.string(),
                title: z.string(),
                createdAt: z.string(),
              })
            ),
          }),
        },
      ]}
    >
      <ChatUI />
    </TamboProvider>
  );
}
