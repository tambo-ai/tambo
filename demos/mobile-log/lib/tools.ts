import { z } from "zod";
import { defineTool } from "@tambo-ai/react";

let pendingResolve: ((value: { selected: string }) => void) | null = null;

export function resolvePrompt(value: { selected: string }) {
  if (pendingResolve) {
    pendingResolve(value);
    pendingResolve = null;
  }
}

export const askMultipleChoice = defineTool({
  name: "ask_multiple_choice",
  description:
    "Present the user with a multiple choice question rendered as tappable buttons. Use when there are 2-6 discrete options. Do NOT use for open-ended questions.",
  inputSchema: z.object({
    question: z.string(),
    options: z.array(z.string()).min(2).max(6),
  }),
  outputSchema: z.object({ selected: z.string() }),
  tool: async () =>
    await new Promise<{ selected: string }>((resolve, reject) => {
      pendingResolve = resolve;
      // Safety valve: reject after 5 minutes to prevent permanent deadlock
      setTimeout(() => {
        if (pendingResolve === resolve) {
          pendingResolve = null;
          reject(new Error("Prompt timed out"));
        }
      }, 300_000);
    }),
});

export const tools = [askMultipleChoice];
