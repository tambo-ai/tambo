import { TamboComponent, TamboTool } from "@tambo-ai/react";
import { z } from "zod";
import StatusCard from "@/components/tambo/StatusCard";
import LogViewer from "@/components/tambo/LogViewer";

export const components: TamboComponent[] = [
  {
    name: "StatusCard",
    description: "Displays a neutral status card with a title and message.",
    component: StatusCard,
    propsSchema: z.object({
      title: z.string(),
      status: z.enum(["active", "pending", "error"]),
      message: z.string(),
    }),
  },
  {
    name: "LogViewer",
    description: "Displays a list of system activity logs.",
    component: LogViewer,
    propsSchema: z.object({
      logs: z.array(
        z.object({
          id: z.number(),
          event: z.string(),
          time: z.string(),
          type: z.string(),
        }),
      ),
    }),
  },
];

export const tools: TamboTool[] = [
  {
    name: "get_status",
    description: "Fetches system status from the Hono Edge API.",
    inputSchema: z.object({ service: z.string() }),
    outputSchema: z.any(),
    tool: async ({ service }) => {
      const res = await fetch(
        `/api/status?service=${encodeURIComponent(service)}`,
      );
      return res.json();
    },
  },
  {
    name: "get_logs",
    description: "Fetches recent system activity logs from the Hono API.",
    inputSchema: z.object({ limit: z.number().optional() }),
    outputSchema: z.any(),
    tool: async ({ limit }) => {
      const res = await fetch(`/api/logs?limit=${limit || 3}`);
      return res.json();
    },
  },
];
