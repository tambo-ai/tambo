"use client";

import { Clock } from "lucide-react";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader } from "./ui/card";

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  userName: string;
}

interface TicketGridProps {
  tickets: Ticket[];
  onTicketClick?: (ticket: Ticket) => void;
}

export function TicketGrid({ tickets, onTicketClick }: TicketGridProps) {
  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg text-foreground/70">No tickets yet</p>
        <p className="text-sm text-foreground/60">
          List of all Tickets,You can use the Tambo AI assistant to communicate
          with the tickets
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tickets.map((ticket) => (
        <Card
          key={ticket.id}
          className="cursor-pointer transition-shadow hover:shadow-lg"
          onClick={() => onTicketClick?.(ticket)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 font-semibold leading-tight">
                {ticket.title}
              </h3>
              <Badge
                variant={ticket.status === "open" ? "default" : "secondary"}
                className="shrink-0"
              >
                {ticket.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="line-clamp-3 text-sm text-foreground/60">
              {ticket.description}
            </p>
            <div className="mt-4 flex items-center justify-between text-xs text-foreground/50">
              <span className="font-medium">{ticket.userName}</span>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                {new Date(ticket.createdAt).toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
