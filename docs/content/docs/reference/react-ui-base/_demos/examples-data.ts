import type { ReactTamboThreadMessage } from "@tambo-ai/react";

export const mockMessages: ReactTamboThreadMessage[] = [
  {
    id: "ex-1",
    role: "user" as const,
    content: [{ type: "text" as const, text: "What's the weather in Tokyo?" }],
  },
  {
    id: "ex-2",
    role: "assistant" as const,
    content: [
      {
        type: "text" as const,
        text: "It's currently 18°C and clear in Tokyo. Perfect weather for cherry blossom viewing!",
      },
    ],
  },
  {
    id: "ex-3",
    role: "user" as const,
    content: [{ type: "text" as const, text: "How about this weekend?" }],
  },
  {
    id: "ex-4",
    role: "assistant" as const,
    content: [
      {
        type: "text" as const,
        text: "This weekend looks great — Saturday will be 20°C with sunshine, and Sunday drops to 16°C with light clouds.",
      },
    ],
  },
];
