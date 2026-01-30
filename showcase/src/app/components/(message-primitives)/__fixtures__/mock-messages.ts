/**
 * Mock message data for library comparison demos.
 *
 * These message objects follow the TamboThreadMessage structure
 * and can be used across different library implementations.
 */

export interface TextContentPart {
  type: "text";
  text: string;
}

export interface ToolUseContentPart {
  type: "tool_use";
  toolCallId: string;
  name: string;
  input: Record<string, unknown>;
}

export type ContentPart = TextContentPart | ToolUseContentPart;

/**
 * Type guard for filtering text content parts.
 */
export function isTextContent(part: ContentPart): part is TextContentPart {
  return part.type === "text";
}

/**
 * Mock message structure matching TamboThreadMessage.
 */
export interface MockMessage {
  id: string;
  role: "user" | "assistant";
  content: ContentPart[];
  createdAt: string;
  threadId: string;
  componentState: Record<string, unknown>;
  reasoning?: string[];
  reasoningDurationMS?: number;
}

/**
 * Shared mock messages for demo purposes.
 */
export const mockMessages = {
  user: {
    id: "user-1",
    role: "user" as const,
    content: [
      {
        type: "text" as const,
        text: "Hello! Can you help me with a React component?",
      },
    ] as ContentPart[],
    createdAt: new Date().toISOString(),
    threadId: "demo-thread",
    componentState: {},
  },

  assistant: {
    id: "assistant-1",
    role: "assistant" as const,
    content: [
      {
        type: "text" as const,
        text: "Of course! I'd be happy to help you build a React component. What would you like to create?",
      },
    ] as ContentPart[],
    createdAt: new Date().toISOString(),
    threadId: "demo-thread",
    componentState: {},
  },

  withReasoning: {
    id: "assistant-2",
    role: "assistant" as const,
    content: [
      {
        type: "text" as const,
        text: "Let me create a button component for you.",
      },
    ] as ContentPart[],
    reasoning: [
      "The user is asking for help with a React component. I should consider what type would be most useful and educational.",
      "A button component is a great starting point - it demonstrates props, styling, event handling, and TypeScript patterns.",
    ],
    reasoningDurationMS: 5000,
    createdAt: new Date().toISOString(),
    threadId: "demo-thread",
    componentState: {},
  },

  loading: {
    id: "assistant-3",
    role: "assistant" as const,
    content: [] as ContentPart[],
    createdAt: new Date().toISOString(),
    threadId: "demo-thread",
    componentState: {},
  },
} satisfies Record<string, MockMessage>;

/**
 * Get text content from a message.
 */
export function getTextContent(message: MockMessage): string {
  return message.content
    .filter(isTextContent)
    .map((part) => part.text)
    .join(" ");
}
