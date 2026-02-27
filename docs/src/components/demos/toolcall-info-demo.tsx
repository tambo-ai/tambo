"use client";

import { ToolcallInfo } from "@tambo-ai/react-ui-base/toolcall-info";
import type { TamboThreadMessage } from "@tambo-ai/react";
import { ChevronDown } from "lucide-react";

const mockMessage: TamboThreadMessage = {
  id: "demo-toolcall-1",
  role: "assistant",
  content: [
    {
      type: "tool_use",
      id: "tool-1",
      name: "get_weather",
      input: { city: "San Francisco", units: "fahrenheit" },
    },
  ],
  createdAt: new Date().toISOString(),
  metadata: {},
};

export function ToolcallInfoDemo() {
  return (
    <ToolcallInfo.Root message={mockMessage}>
      <ToolcallInfo.Trigger className="flex items-center gap-2 text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100">
        <ToolcallInfo.StatusIcon />
        <ToolcallInfo.StatusText />
        <ChevronDown className="h-3.5 w-3.5" />
      </ToolcallInfo.Trigger>
      <ToolcallInfo.Content className="mt-2 flex flex-col gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800">
        <ToolcallInfo.ToolName className="text-sm font-medium text-neutral-900 dark:text-neutral-100" />
        <ToolcallInfo.Parameters className="rounded-md bg-neutral-100 p-2 font-mono text-xs text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300" />
        <ToolcallInfo.Result className="rounded-md bg-neutral-100 p-2 font-mono text-xs text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300" />
      </ToolcallInfo.Content>
    </ToolcallInfo.Root>
  );
}
