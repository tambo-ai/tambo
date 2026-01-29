"use client";

import { useState, useEffect } from "react";
import { TicketDashboard } from "@/components/ticket-dashboard";
import { TopBar } from "@/components/top-bar";
import { CreateTicketDialog } from "@/components/create-ticket-dialog";
import { MessageThreadFull } from "@/components/ui/message-thread-full";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ChatPage() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsChatOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopBar
        onNewTicket={() => setIsCreateDialogOpen(true)}
        onToggleChat={() => setIsChatOpen((prev) => !prev)}
      />

      <div className="flex-1 overflow-auto">
        <TicketDashboard />
      </div>

      <div
        className={`fixed right-0 top-0 z-50 h-full w-full bg-background shadow-xl transition-transform duration-300 ease-in-out md:w-[500px] ${
          isChatOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-lg font-semibold">Chat Assistant</h2>
            <Button
              onClick={() => setIsChatOpen(false)}
              variant="ghost"
              size="icon"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-hidden">
            <MessageThreadFull className="h-full" variant="default" />
          </div>
        </div>
      </div>

      {isChatOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsChatOpen(false)}
        />
      )}

      <CreateTicketDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onTicketCreated={() => {
          window.dispatchEvent(new CustomEvent("ticketCreated"));
        }}
      />
    </div>
  );
}
