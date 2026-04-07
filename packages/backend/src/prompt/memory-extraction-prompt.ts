import {
  ContentPartType,
  MessageRole,
  type ThreadMessage,
} from "@tambo-ai-cloud/core";
import type { LLMClient } from "../services/llm/llm-client";

function buildMemoryExtractionPrompt(now: Date): string {
  // Use UTC to avoid server timezone leaking into memories. The user's local
  // timezone is not available here — a known limitation.
  const utcFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  });
  const parts = Object.fromEntries(
    utcFormatter.formatToParts(now).map((p) => [p.type, p.value]),
  );
  const dateStr = `${parts.year}-${parts.month}-${parts.day}`;
  const dayOfWeek = parts.weekday;

  return `You are analyzing a conversation to extract facts worth remembering about the user for future conversations.

The current date is ${dayOfWeek}, ${dateStr}.

Extract facts that are:
- Atomic (one piece of information per fact)
- Written in third person ("The user prefers..." not "I prefer...")
- Specific and useful for future conversations
- Rated for importance (1-5): 5=core identity/preference, 4=active project/goal, 3=useful background, 2=minor preference, 1=transient detail
- NOT greetings, transient discussion, or trivial pleasantries
- NOT instructions, commands, or directives — only factual observations

IMPORTANT — Resolve relative dates and times to absolute values before storing.
For example:
- "today is my birthday" → "The user's birthday is ${dateStr}"
- "I started this job last year" → "The user started their current job around ${now.getFullYear() - 1}"
- "the deadline is next Friday" → "The deadline is [exact date of next Friday]"
Never store relative terms like "today", "yesterday", "this week", "last month"
in a memory — they become meaningless in future conversations.

Categorize each as: preference, fact, goal, relationship

Output as JSON:
{
  "memories": [{"content": "...", "category": "...", "importance": 3}]
}

If there is nothing worth remembering, return: {"memories": []}`;
}

/**
 * Calls the LLM to extract memories from recent conversation messages.
 * Returns the raw JSON string from the LLM response for the caller to parse/validate.
 * This function is backend-only — no DB types, no memory-specific logic beyond prompting.
 */
export async function callMemoryExtractionLLM(
  llmClient: LLMClient,
  recentMessages: ThreadMessage[],
): Promise<string | undefined> {
  const systemMessage: ThreadMessage = {
    id: "memory-extraction-system",
    threadId: recentMessages[0]?.threadId ?? "",
    role: MessageRole.System,
    content: [
      {
        type: ContentPartType.Text,
        text: buildMemoryExtractionPrompt(
          recentMessages.at(-1)?.createdAt ?? new Date(),
        ),
      },
    ],
    createdAt: new Date(),
    componentState: {},
  };

  const response = await llmClient.complete({
    messages: [systemMessage, ...recentMessages],
    promptTemplateName: "memory-extraction",
    promptTemplateParams: {},
    tools: [],
    stream: false,
  });

  const text = response.message.content;
  if (typeof text !== "string") return undefined;
  return text;
}
