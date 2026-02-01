import { TamboComponent, TamboTool } from "@tambo-ai/react";
import { DataTableViewer } from "@/components/tambo/DataTableViewer";
import { z } from "zod";

export const components: TamboComponent[] = [
  {
    name: "DataTableViewer",
    description: "A high-performance table for viewing analytics records.",
    component: DataTableViewer,
    // 💡 FIX: Make data optional so it doesn't crash if AI calls it without data initially
    propsSchema: z.object({
      data: z.array(z.any()).optional().default([]),
      title: z.string().optional(),
    }),
  },
];

export const tools: TamboTool[] = [
  {
    name: "queryAnalytics",
    description: "Fetch live analytics data from the Drizzle database.",
    tool: async () => {
      const baseUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost:3000";

      const response = await fetch(`${baseUrl}/api/analytics`, {
        cache: "no-store",
      });

      const results = await response.json();

      return {
        data: results,
        title: "Latest Analytics Report",
      };
    },

    inputSchema: z.object({}),

    outputSchema: z.object({
      data: z.array(z.any()),
      title: z.string().optional(),
    }),

    // 👇 THIS IS THE MISSING PIECE
    component: DataTableViewer,
  },
];
