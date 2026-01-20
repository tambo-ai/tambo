import {
  totalMessageUsageSchema,
  totalUsersSchema,
} from "@/lib/schemas/project";
import { z } from "zod/v3";
import type { RegisterToolFn, ToolContext } from "./types";

/**
 * Input schema for the `fetchTotalMessageUsage` function.
 * Accepts a period argument.
 */
export const fetchTotalMessageUsageInputSchema = z.object({
  period: z
    .string()
    .optional()
    .describe(
      "Time period filter: 'all time', 'per month', or 'per week'. Defaults to 'all time'",
    ),
});

/**
 * Output schema for the `fetchTotalMessageUsage` function.
 * Returns total message usage.
 */
export const fetchTotalMessageUsageOutputSchema =
  totalMessageUsageSchema.extend({
    period: z.string(),
  });

/**
 * Input schema for the `fetchTotalUsers` function.
 * Accepts a period argument.
 */
export const fetchTotalUsersInputSchema = z.object({
  period: z
    .string()
    .optional()
    .describe(
      "Time period filter: 'all time', 'per month', or 'per week'. Defaults to 'all time'",
    ),
});

/**
 * Output schema for the `fetchTotalUsers` function.
 * Returns total user count.
 */
export const fetchTotalUsersOutputSchema = totalUsersSchema.extend({
  period: z.string(),
});

/**
 * Register dashboard statistics management tools
 */
export function registerDashboardTools(
  registerTool: RegisterToolFn,
  ctx: ToolContext,
) {
  /**
   * Registers a tool to fetch total message usage statistics.
   * @param {Object} params - Parameters object
   * @param {string} params.period - Time period filter ('all time', 'per month', 'per week'). Defaults to 'all time' if not specified.
   * @returns {Object} Object containing total message count and period
   */
  registerTool({
    name: "fetchTotalMessageUsage",
    description:
      "Fetches total message usage statistics with period filtering. Period can be 'all time', 'per month', or 'per week'.",
    tool: async (params) => {
      // Use 'all time' as default if period is not provided or invalid
      const validPeriod = params.period || "all time";
      const result = await ctx.trpcClient.project.getTotalMessageUsage.query({
        period: validPeriod,
      });
      return {
        totalMessages: result.totalMessages,
        period: validPeriod,
      };
    },
    inputSchema: fetchTotalMessageUsageInputSchema,
    outputSchema: fetchTotalMessageUsageOutputSchema,
  });

  /**
   * Registers a tool to fetch total user count statistics.
   * @param {Object} params - Parameters object
   * @param {string} params.period - Time period filter ('all time', 'per month', 'per week'). Defaults to 'all time' if not specified.
   * @returns {Object} Object containing total user count and period
   */
  registerTool({
    name: "fetchTotalUsers",
    description:
      "Fetches total user count statistics with period filtering. Period can be 'all time', 'per month', or 'per week'.",
    tool: async (params) => {
      // Use 'all time' as default if period is not provided or invalid
      const validPeriod = params.period || "all time";
      const result = await ctx.trpcClient.project.getTotalUsers.query({
        period: validPeriod,
      });
      return {
        totalUsers: result.totalUsers,
        period: validPeriod,
      };
    },
    inputSchema: fetchTotalUsersInputSchema,
    outputSchema: fetchTotalUsersOutputSchema,
  });
}
