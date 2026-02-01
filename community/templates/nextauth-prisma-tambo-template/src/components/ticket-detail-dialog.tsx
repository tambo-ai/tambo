"use client";

import { Clock, User } from "lucide-react";
import { useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  userName: string;
}

interface TicketDetailDialogProps {
  ticket: Ticket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate?: (ticketId: string, status: string) => void;
}

export function TicketDetailDialog({
  ticket,
  open,
  onOpenChange,
  onStatusUpdate,
}: TicketDetailDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!ticket) return null;

  const handleStatusToggle = async () => {
    setIsUpdating(true);
    const newStatus = ticket.status === "open" ? "closed" : "open";
    await onStatusUpdate?.(ticket.id, newStatus);
    setIsUpdating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-xl">{ticket.title}</DialogTitle>
            <Badge variant={ticket.status === "open" ? "default" : "secondary"}>
              {ticket.status}
            </Badge>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {ticket.userName}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {new Date(ticket.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="whitespace-pre-wrap text-sm">{ticket.description}</p>
          </div>
          {onStatusUpdate && (
            <div className="flex justify-end gap-3 pt-4">
              <Button
                onClick={handleStatusToggle}
                disabled={isUpdating}
                variant={ticket.status === "open" ? "outline" : "default"}
              >
                {isUpdating && "Updating..."}
                {!isUpdating && ticket.status === "open" && "Mark as Closed"}
                {!isUpdating && ticket.status !== "open" && "Reopen Ticket"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
