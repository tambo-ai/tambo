"use client";

import { useEffect, useState } from "react";
import { TicketDetailDialog } from "./ticket-detail-dialog";
import { TicketGrid } from "./ticket-grid";

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  userName: string;
}

export function TicketDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchTickets = async () => {
    try {
      const response = await fetch("/api/tickets");
      if (!response.ok) throw new Error("Failed to fetch tickets");
      const data = await response.json();
      setTickets(data.tickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchTickets();

    const handleTicketCreated = () => void fetchTickets();
    const handleTicketUpdated = () => void fetchTickets();

    window.addEventListener("ticketCreated", handleTicketCreated);
    window.addEventListener("ticketUpdated", handleTicketUpdated);

    return () => {
      window.removeEventListener("ticketCreated", handleTicketCreated);
      window.removeEventListener("ticketUpdated", handleTicketUpdated);
    };
  }, []);

  const handleStatusUpdate = async (ticketId: string, status: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error("Failed to update ticket");

      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === ticketId ? { ...ticket, status } : ticket,
        ),
      );
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev) => (prev ? { ...prev, status } : null));
      }
    } catch (error) {
      console.error("Error updating ticket:", error);
    }
  };

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDetailOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading tickets...</p>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">All Tickets</h2>
          <p className="text-sm text-foreground/60">
            Click on a ticket to view details, or use the AI assistant to create
            new ones
          </p>
        </div>

        <TicketGrid tickets={tickets} onTicketClick={handleTicketClick} />
      </div>

      <TicketDetailDialog
        ticket={selectedTicket}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onStatusUpdate={handleStatusUpdate}
      />
    </>
  );
}
