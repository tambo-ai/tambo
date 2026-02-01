import { TamboComponent, TamboTool } from "@tambo-ai/react";
import { z } from "zod";
import StatusCard from "@/components/tambo/StatusCard";

export const components: TamboComponent[] = [
  {
    name: "StatusCard",
    description: "A simple card to show API status.",
    component: StatusCard,
    propsSchema: z.object({ message: z.string(), timestamp: z.string() }),
  },
];

export const tools: TamboTool[] = [
  {
    name: "check_api",
    description: "Checks if the Hono API is responding.",
    inputSchema: z.object({}),
    outputSchema: z.any(),
    tool: async () => {
      const res = await fetch("/api/hello");
      return res.json();
    },
  },
];
