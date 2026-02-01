import { defineTool } from "@tambo-ai/react";
import { AdminStats } from "@/components/tambo/AdminStats";
import { UserCard } from "@/components/tambo/UserCard";
import { z } from "zod";

/**
 * Creates the toolset for a specific user role.
 * This allows "baking in" security checks directly into the tool logic.
 */
export function createTools(role: "admin" | "user") {
  return [
    defineTool({
      name: "getSystemHealth",
      description:
        "Retrieves analytics and health metrics for the system. Requires Admin privileges.",
      inputSchema: z.object({
        verbose: z
          .boolean()
          .optional()
          .describe("If true, returns detailed sub-system breakdowns."),
      }),
      outputSchema: z.object({
        status: z.string().optional(),
        message: z.string().optional(),
        data: z
          .object({
            cpu: z.string().optional(),
            disk: z.string().optional(),
            bandwidth: z.string().optional(),
            uptime: z.string().optional(),
          })
          .optional(),
      }),
      tool: async (params) => {
        // 🔐 ROLE CHECK
        if (role !== "admin") {
          return {
            status: "denied",
            message:
              "Access Denied. Your current security clearance level is 'User'. Administrative privileges are required to access System Health metrics and infrastructure diagnostics.",
          };
        }

        // Simulated high-end diagnostics
        return {
          status: "optimal",
          message:
            "System scan complete. All core infrastructure components are operating within optimal parameters. No performance bottlenecks or security anomalies detected.",
          data: {
            cpu: params.verbose
              ? "14.2% (Kernel: 2.1% | User: 12.1%)"
              : "14.2%",
            disk: "45.2 GB usage / 100 GB (SSD Optimized)",
            bandwidth: "1.2 Gbps (Peak Throughput)",
            uptime: "14d 2h 45m (Uptime stability: 99.99%)",
          },
        };
      },
    }),
    defineTool({
      name: "getUserProfile",
      description: "Accesses the authenticated entity's primary profile data.",
      inputSchema: z.object({}),
      outputSchema: z.object({
        status: z.string().optional(),
        message: z.string().optional(),
      }),
      tool: async () => ({
        status: "active",
        message:
          "Identity verified. Displaying current user profile and session data retrieved from the BetterAuth security layer.",
      }),
    }),
  ];
}

// For backward compatibility (defaulting to admin view if imported directly)
export const allTools = createTools("admin");
export const userTools = createTools("user");

/**
 * GENERATIVE UI COMPONENT REGISTRY
 */
export const tamboComponents = [
  {
    name: "getSystemHealth",
    description: "Displays system health or access denied card.",
    component: AdminStats,
    propsSchema: z.object({
      status: z.string().optional(),
      message: z.string().optional(),
      data: z
        .object({
          cpu: z.string().optional(),
          disk: z.string().optional(),
          bandwidth: z.string().optional(),
          uptime: z.string().optional(),
        })
        .optional(),
    }),
  },
  {
    name: "getUserProfile",
    description: "Displays user profile card.",
    component: UserCard,
    propsSchema: z.object({
      status: z.string().optional(),
      message: z.string().optional(),
    }),
  },
];
