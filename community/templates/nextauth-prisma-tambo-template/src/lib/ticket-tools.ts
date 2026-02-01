import type { TamboTool } from "@tambo-ai/react";
import { z } from "zod";

/**
 * Creates a new ticket via API
 */
const createTicket = async (input: {
  title: string;
  description: string;
  userId: string;
}) => {
  const response = await fetch("/api/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: input.title,
      description: input.description,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create ticket");
  }

  const result = await response.json();

  // Notify dashboard of new ticket
  window.dispatchEvent(new CustomEvent("ticketCreated", { detail: result }));

  return result;
};

/**
 * Fetches all tickets for the current user via API
 */
const fetchUserTickets = async () => {
  const response = await fetch("/api/tickets");

  if (!response.ok) {
    throw new Error("Failed to fetch tickets");
  }

  return response.json();
};

/**
 * Updates a ticket's status via API
 */
const updateTicketStatus = async (input: {
  ticketId: string;
  status: string;
}) => {
  const response = await fetch(`/api/tickets/${input.ticketId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: input.status }),
  });

  if (!response.ok) {
    throw new Error("Failed to update ticket");
  }

  const result = await response.json();

  window.dispatchEvent(new CustomEvent("ticketUpdated", { detail: result }));

  return result;
};

export const createTicketTool: TamboTool = {
  name: "createTicket",
  description:
    "Creates a new support ticket with a title and description based on the user's natural language request",
  tool: createTicket,
  inputSchema: z.object({
    title: z.string().describe("The title/subject of the ticket"),
    description: z
      .string()
      .describe("Detailed description of the issue or request"),
    userId: z.string().describe("The ID of the user creating the ticket"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    ticket: z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      status: z.string(),
      createdAt: z.string(),
    }),
  }),
};

export const fetchUserTicketsTool: TamboTool = {
  name: "fetchUserTickets",
  description: "Retrieves all tickets for a specific user",
  tool: fetchUserTickets,
  inputSchema: z.object({
    userId: z.string().describe("The ID of the user whose tickets to fetch"),
  }),
  outputSchema: z.object({
    tickets: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        status: z.string(),
        createdAt: z.string(),
      }),
    ),
  }),
  annotations: {
    readOnlyHint: true,
  },
};

export const updateTicketStatusTool: TamboTool = {
  name: "updateTicketStatus",
  description: "Updates the status of a ticket (e.g., 'open' to 'closed')",
  tool: updateTicketStatus,
  inputSchema: z.object({
    ticketId: z.string().describe("The ID of the ticket to update"),
    status: z
      .string()
      .describe("The new status for the ticket (e.g., 'open', 'closed')"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    ticket: z.object({
      id: z.string(),
      title: z.string(),
      status: z.string(),
    }),
  }),
};

export const ticketTools = [
  createTicketTool,
  fetchUserTicketsTool,
  updateTicketStatusTool,
];
