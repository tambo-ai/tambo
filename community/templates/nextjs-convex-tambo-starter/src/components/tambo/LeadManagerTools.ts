import { z } from "zod";

export const getLeadTools = (mutations: {
  addLead: any;
  updateStatus: any;
  removeLead: any;
  convex: any;
  api: any;
}) => [
  {
    name: "listLeads",
    description:
      "Fetches the current list of leads from the CRM. Use this to find lead IDs for updates or deletions, or to give the user a summary of their leads.",
    parameters: {
      type: "object",
      properties: {},
    },
    inputSchema: z.object({}),
    outputSchema: z.object({
      success: z.boolean(),
      leads: z.array(z.any()),
      count: z.number(),
    }),
    component: () => null,
    tool: async () => {
      try {
        const leads = await mutations.convex.query(mutations.api.leads.list);
        return {
          success: true,
          leads: leads,
          count: leads.length,
        };
      } catch (error: any) {
        return { success: false, error: error.message, leads: [], count: 0 };
      }
    },
  },
  {
    name: "addLead",
    description:
      "Adds a new sales lead to the CRM. Use this when the user wants to track a new prospect.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "The full name of the lead" },
        email: { type: "string", description: "The email address of the lead" },
        status: {
          type: "string",
          enum: ["New", "Contacted", "Closed"],
          description: "The current status of the lead",
        },
        notes: { type: "string", description: "Optional notes about the lead" },
      },
      required: ["name", "email", "status"],
    },
    // Required for Tambo to validate the tool input
    inputSchema: z.object({
      name: z.string().describe("The full name of the lead"),
      email: z.string().email().describe("The email address of the lead"),
      status: z
        .string()
        .describe(
          "The current status of the lead: 'New', 'Contacted', 'Closed'",
        ),
      notes: z.string().optional().describe("Optional notes about the lead"),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string().optional(),
      lead: z.any().optional(),
      error: z.string().optional(),
    }),
    // component is required to be a valid TamboComponent
    component: () => null,
    tool: async (args: any) => {
      try {
        // Normalize status
        const normalizedStatus =
          args.status.charAt(0).toUpperCase() +
          args.status.slice(1).toLowerCase();

        // Ensure status is valid
        const validStatuses = ["New", "Contacted", "Closed"];
        const status = validStatuses.includes(normalizedStatus)
          ? normalizedStatus
          : "New";

        // STRICTLY construct leadData to avoid passing extra args (like 'reasoning') to Convex
        const leadData = {
          name: args.name,
          email: args.email,
          status: status,
          notes: args.notes,
        };

        await mutations.addLead(leadData);
        return {
          success: true,
          message: `Successfully added lead: ${args.name}`,
          lead: leadData,
        };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  },
  {
    name: "updateLead",
    description:
      "Updates an existing lead's information such as status or notes. Requires the lead's ID.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "The Convex ID of the lead" },
        status: {
          type: "string",
          enum: ["New", "Contacted", "Closed"],
          description: "Optional new status",
        },
        notes: {
          type: "string",
          description: "Optional new notes or updates to existing notes",
        },
      },
      required: ["id"],
    },
    // Required for Tambo to validate the tool input
    inputSchema: z.object({
      id: z.string().describe("The Convex ID of the lead"),
      status: z
        .string()
        .optional()
        .describe("Optional new status: 'New', 'Contacted', 'Closed'"),
      notes: z
        .string()
        .optional()
        .describe("Optional new notes or updates to existing notes"),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string().optional(),
      lead: z.any().optional(),
      error: z.string().optional(),
    }),
    component: () => null,
    tool: async (args: any) => {
      try {
        const updates: any = {};

        if (args.status) {
          // Normalize status
          const normalizedStatus =
            args.status.charAt(0).toUpperCase() +
            args.status.slice(1).toLowerCase();

          const validStatuses = ["New", "Contacted", "Closed"];
          updates.status = validStatuses.includes(normalizedStatus)
            ? normalizedStatus
            : undefined;
        }

        if (args.notes) {
          updates.notes = args.notes;
        }

        if (Object.keys(updates).length === 0) {
          return { success: false, error: "No updates provided" };
        }

        await mutations.updateStatus({ id: args.id, ...updates });
        return {
          success: true,
          message: `Successfully updated lead ${args.id}`,
          lead: updates,
        };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  },
  {
    name: "removeLead",
    description:
      "Removes a lead from the CRM. Use this ONLY if the user explicitly asks to delete a lead.",
    parameters: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The Convex ID of the lead to remove",
        },
      },
      required: ["id"],
    },
    inputSchema: z.object({
      id: z.string().describe("The Convex ID of the lead to remove"),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
    component: () => null,
    tool: async (args: any) => {
      try {
        await mutations.removeLead({ id: args.id });
        return {
          success: true,
          message: `Successfully removed lead with ID ${args.id}`,
        };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  },
];
