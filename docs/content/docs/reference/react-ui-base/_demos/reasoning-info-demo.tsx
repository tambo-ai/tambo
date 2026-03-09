"use client";

import { useDemoControls } from "@/components/demos/demo-controls";
import { DemoPreview } from "@/components/demos/demo-preview";
import type { Content, TamboThreadMessage } from "@tambo-ai/react";
import { ReasoningInfo } from "@tambo-ai/react-ui-base/reasoning-info";
import { ChevronDown } from "lucide-react";
import { useMemo } from "react";

export const reasoningInfoDemoCode = `
import { ReasoningInfo } from "@tambo-ai/react-ui-base/reasoning-info";
import type { TamboThreadMessage } from "@tambo-ai/react";
import { ChevronDown } from "lucide-react";

// message.reasoning is a string[] of reasoning steps
// message.reasoningDurationMS is the total thinking time
export function DemoReasoningInfo({ message }: { message: TamboThreadMessage }) {
  return (
    <ReasoningInfo.Root message={message} isLoading={false} autoCollapse={false}>
      <ReasoningInfo.Trigger className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100">
        <ChevronDown className="h-3.5 w-3.5" />
        <ReasoningInfo.StatusText />
      </ReasoningInfo.Trigger>
      <ReasoningInfo.Content className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800">
        <ReasoningInfo.Steps className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300" />
      </ReasoningInfo.Content>
    </ReasoningInfo.Root>
  );
}`.trimStart();

export function ReasoningInfoDemoPreview() {
  return (
    <DemoPreview code={reasoningInfoDemoCode}>
      <ReasoningInfoDemo />
    </DemoPreview>
  );
}

function ReasoningInfoDemo() {
  const { state } = useDemoControls({
    state: {
      options: ["completed", "thinking"] as const,
      default: "completed",
      label: "State",
    },
  });

  const mockMessage = useMemo(
    () =>
      ({
        id: "demo-reasoning-1",
        role: "assistant",
        content:
          state === "completed"
            ? [
                {
                  type: "text",
                  text: "Based on my analysis, the optimal approach is to use a hash map for O(1) lookups.",
                } satisfies Content,
              ]
            : [],
        reasoning: [
          "First, I need to understand the constraints of the problem — we need fast lookups with potentially millions of entries.",
          "A sorted array with binary search gives O(log n), but a hash map gives O(1) amortized.",
          "The trade-off is memory usage, but for this data size the overhead is acceptable.",
        ],
        reasoningDurationMS: state === "completed" ? 4200 : undefined,
      }) satisfies TamboThreadMessage,
    [state],
  );

  return (
    <ReasoningInfo.Root
      message={mockMessage}
      isLoading={state === "thinking"}
      autoCollapse={false}
    >
      <ReasoningInfo.Trigger className="flex items-center gap-2 text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100">
        <ChevronDown className="h-3.5 w-3.5 transition-transform [[data-state=open]_&]:rotate-180" />
        <ReasoningInfo.StatusText />
      </ReasoningInfo.Trigger>
      <ReasoningInfo.Content className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800">
        <ReasoningInfo.Steps className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300" />
      </ReasoningInfo.Content>
    </ReasoningInfo.Root>
  );
}
