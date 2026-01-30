import { prisma } from "./prisma";
import { z } from "zod";
import { defineTool } from "@tambo-ai/react";

export const tools = [
  defineTool({
    name: "recordObservation",
    description: "Records a Six Sigma process observation into the database",
    inputSchema: z.object({
      process: z.string().describe("The name of the process being observed"),
      finding: z.string().describe("The specific data or finding discovered"),
      severity: z.enum(["Low", "Medium", "High", "Critical"])
    }),
    execute: async (data) => {
      const observation = await prisma.observation.create({ data });
      return observation;
    },
  }),
];