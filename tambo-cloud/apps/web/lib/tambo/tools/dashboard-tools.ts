import {
  totalMessageUsageSchema,
  totalUsersSchema,
} from "@/lib/schemas/project";
import { z } from "zod";
import type { RegisterToolFn, ToolContext } from "./types";

/**
 * Zod schema for the `fetchTotalMessageUsage` function.
 * Defines a period argument and returns total message usage.
 */
export const fetchTotalMessageUsageSchema = z
  .function()
  .args(
    z.object({
      period: z
        .string()
        .optional()
        .describe(
          "Time period filter: 'all time', 'per month', or 'per week'. Defaults to 'all time'",
        ),
    }),
  )
  .returns(
    totalMessageUsageSchema.extend({
      period: z.string(),
    }),
  );

/**
 * Zod schema for the `fetchTotalUsers` function.
 * Defines a period argument and returns total user count.
 */
export const fetchTotalUsersSchema = z
  .function()
  .args(
    z.object({
      period: z
        .string()
        .optional()
        .describe(
          "Time period filter: 'all time', 'per month', or 'per week'. Defaults to 'all time'",
        ),
    }),
  )
  .returns(
    totalUsersSchema.extend({
      period: z.string(),
    }),
  );

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
    tool: async (params: { period?: string }) => {
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
    toolSchema: fetchTotalMessageUsageSchema,
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
    tool: async (params: { period?: string }) => {
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
    toolSchema: fetchTotalUsersSchema,
  });
}
