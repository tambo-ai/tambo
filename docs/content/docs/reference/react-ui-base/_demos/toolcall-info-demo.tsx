"use client";

import { ToolcallInfo } from "@tambo-ai/react-ui-base/toolcall-info";
import type { TamboThreadMessage } from "@tambo-ai/react";
import { ChevronDown } from "lucide-react";
import { useMemo } from "react";
import { useDemoControls } from "@/components/demos/demo-controls";

export function ToolcallInfoDemo() {
  const { state } = useDemoControls({
    state: {
      options: ["completed", "running"] as const,
      default: "completed",
      label: "State",
    },
  });

  const mockMessage = useMemo(
    () =>
      ({
        id: "demo-toolcall-1",
        role: "assistant" as const,
        content: [
          {
            type: "tool_use" as const,
            id: "tool-1",
            name: "get_weather",
            input: { city: "San Francisco", units: "fahrenheit" },
            hasCompleted: state === "completed",
          },
        ],
        createdAt: new Date().toISOString(),
        metadata: {},
      }) as TamboThreadMessage,
    [state],
  );

  return (
    <ToolcallInfo.Root
      message={mockMessage}
      isLoading={state === "running"}
      defaultExpanded
    >
      <ToolcallInfo.Trigger className="flex items-center gap-2 text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100">
        <ToolcallInfo.StatusIcon />
        <ToolcallInfo.StatusText />
        <ChevronDown className="h-3.5 w-3.5 transition-transform [[data-state=open]_&]:rotate-180" />
      </ToolcallInfo.Trigger>
      <ToolcallInfo.Content className="mt-2 flex flex-col gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800">
        <ToolcallInfo.ToolName className="text-sm font-medium text-neutral-900 dark:text-neutral-100" />
        <ToolcallInfo.Parameters className="whitespace-pre-wrap rounded-md bg-neutral-100 p-2 font-mono text-xs text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300" />
        <ToolcallInfo.Result className="whitespace-pre-wrap rounded-md bg-neutral-100 p-2 font-mono text-xs text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300" />
      </ToolcallInfo.Content>
    </ToolcallInfo.Root>
  );
}
