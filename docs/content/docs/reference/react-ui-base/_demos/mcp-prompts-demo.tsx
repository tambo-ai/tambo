"use client";

import { DemoPreview } from "@/components/demos/demo-preview";
import { McpPrompts } from "@tambo-ai/react-ui-base/mcp-prompts";
import { Sparkles } from "lucide-react";

export const mcpPromptsDemoCode = `
import { McpPrompts } from "@tambo-ai/react-ui-base/mcp-prompts";
import { Sparkles } from "lucide-react";

export function DemoMcpPrompts() {
  return (
    <McpPrompts.Root onInsertText={(text) => console.log("Insert:", text)}>
      <McpPrompts.Trigger className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
        <Sparkles className="h-3.5 w-3.5" />
        Insert Prompt
      </McpPrompts.Trigger>
      <McpPrompts.List
        render={(props, state) => (
          <div {...props} className="mt-1 flex flex-col gap-1 rounded-lg border border-neutral-200 bg-white p-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
            {state.prompts.map((entry) => (
              <McpPrompts.Item
                key={entry.prompt.name}
                name={entry.prompt.name}
                description={entry.prompt.description}
                className="w-full rounded-md px-3 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-100 data-[selected]:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                {entry.prompt.name}
              </McpPrompts.Item>
            ))}
          </div>
        )}
      />
      <McpPrompts.Error
        render={(props, state) => (
          <div {...props} className="mt-2 text-sm text-red-600 dark:text-red-400">
            {state.error}
          </div>
        )}
      />
    </McpPrompts.Root>
  );
}`.trimStart();

export function McpPromptsDemoPreview() {
  return (
    <DemoPreview code={mcpPromptsDemoCode}>
      <McpPromptsDemo />
    </DemoPreview>
  );
}

function McpPromptsDemo() {
  return (
    <McpPrompts.Root onInsertText={(text) => console.log("Insert:", text)}>
      <McpPrompts.Trigger className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
        <Sparkles className="h-3.5 w-3.5" />
        Insert Prompt
      </McpPrompts.Trigger>
      <McpPrompts.List
        render={(props, state) => (
          <div
            {...props}
            className="mt-1 flex flex-col gap-1 rounded-lg border border-neutral-200 bg-white p-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
          >
            {state.prompts.map((entry) => (
              <McpPrompts.Item
                key={entry.prompt.name}
                name={entry.prompt.name}
                description={entry.prompt.description}
                className="w-full rounded-md px-3 py-1.5 text-left text-sm text-neutral-700 transition-colors hover:bg-neutral-100 data-[selected]:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:data-[selected]:bg-neutral-700"
              >
                {entry.prompt.name}
              </McpPrompts.Item>
            ))}
          </div>
        )}
      />
      <McpPrompts.Error
        render={(props, state) => (
          <div
            {...props}
            className="mt-2 text-sm text-red-600 dark:text-red-400"
          >
            {state.error}
          </div>
        )}
      />
    </McpPrompts.Root>
  );
}
