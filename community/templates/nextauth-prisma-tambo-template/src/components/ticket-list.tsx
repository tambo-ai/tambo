"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { useState } from "react";
import { Badge } from "./ui/badge";

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
}

interface TicketListProps {
  tickets: Ticket[];
  onStatusUpdate?: (ticketId: string, status: string) => void;
}

export function TicketList({ tickets, onStatusUpdate }: TicketListProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusToggle = async (
    ticketId: string,
    currentStatus: string,
  ) => {
    setUpdatingId(ticketId);
    const newStatus = currentStatus === "open" ? "closed" : "open";
    await onStatusUpdate?.(ticketId, newStatus);
    setUpdatingId(null);
  };

  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          No tickets yet. Ask me to create one!
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <Card key={ticket.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{ticket.title}</CardTitle>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </div>
              </div>
              <Badge
                variant={ticket.status === "open" ? "default" : "secondary"}
              >
                {ticket.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {ticket.description}
            </p>
            {onStatusUpdate && (
              <Button
                onClick={() => handleStatusToggle(ticket.id, ticket.status)}
                disabled={updatingId === ticket.id}
                variant="outline"
                size="sm"
                className="mt-4"
              >
                {updatingId === ticket.id && "Updating..."}
                {updatingId !== ticket.id &&
                  ticket.status === "open" &&
                  "Close Ticket"}
                {updatingId !== ticket.id &&
                  ticket.status !== "open" &&
                  "Reopen Ticket"}
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
