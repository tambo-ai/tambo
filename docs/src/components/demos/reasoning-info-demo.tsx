"use client";

import { ReasoningInfo } from "@tambo-ai/react-ui-base/reasoning-info";
import type { TamboThreadMessage } from "@tambo-ai/react";
import { ChevronDown } from "lucide-react";

const mockMessage: TamboThreadMessage = {
  id: "demo-reasoning-1",
  role: "assistant",
  content: [
    {
      type: "text",
      text: "Based on my analysis, here is the answer.",
    },
  ],
  createdAt: new Date().toISOString(),
  metadata: {
    reasoning: {
      steps: [
        {
          id: "step-1",
          title: "Analyzing the question",
          content: "First, I considered the key aspects of the problem.",
        },
        {
          id: "step-2",
          title: "Evaluating options",
          content: "Then I compared different approaches.",
        },
        {
          id: "step-3",
          title: "Forming conclusion",
          content: "Finally, I synthesized the findings.",
        },
      ],
    },
  },
};

export function ReasoningInfoDemo() {
  return (
    <ReasoningInfo.Root message={mockMessage}>
      <ReasoningInfo.Trigger className="flex items-center gap-2 text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100">
        <ChevronDown className="h-3.5 w-3.5" />
        <ReasoningInfo.StatusText />
      </ReasoningInfo.Trigger>
      <ReasoningInfo.Content className="mt-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800">
        <ReasoningInfo.Steps />
      </ReasoningInfo.Content>
    </ReasoningInfo.Root>
  );
}
