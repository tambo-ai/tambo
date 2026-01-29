"use client";

import { z } from "zod";
import { TicketList } from "./ticket-list";

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
}

interface TicketingSystemProps {
  tickets: Ticket[];
}

export function TicketingSystem({ tickets }: TicketingSystemProps) {
  return (
    <div className="w-full max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Tickets</h2>
        <div className="text-sm text-muted-foreground">
          {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}
        </div>
      </div>
      <TicketList tickets={tickets} />
    </div>
  );
}

export const TicketingSystemPropsSchema = z
  .object({
    tickets: z
      .array(
        z.object({
          id: z.string().describe("Unique ticket identifier"),
          title: z.string().describe("Ticket title/summary"),
          description: z.string().describe("Detailed ticket description"),
          status: z.string().describe("Current status (open/closed)"),
          createdAt: z.string().describe("ISO timestamp of creation"),
        }),
      )
      .describe("Array of ticket objects to display"),
  })
  .describe("Displays a list of support tickets for the current user");
