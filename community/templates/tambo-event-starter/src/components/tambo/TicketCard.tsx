"use client";

import React from "react";
import { motion } from "framer-motion";
import { Ticket, Check, Star, Sparkles } from "lucide-react";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { TicketCardProps, TicketType } from "@/types";
import { eventData } from "@/lib/mock-data";

const ticketStyles: Record<TicketType, { gradient: string; icon: React.ReactNode }> = {
  general: { 
    gradient: "from-blue-500 to-indigo-600", 
    icon: <Ticket className="w-6 h-6" /> 
  },
  vip: { 
    gradient: "from-purple-500 to-pink-600", 
    icon: <Star className="w-6 h-6" /> 
  },
  student: { 
    gradient: "from-green-500 to-emerald-600", 
    icon: <Sparkles className="w-6 h-6" /> 
  },
  "early-bird": { 
    gradient: "from-amber-500 to-orange-600", 
    icon: <Sparkles className="w-6 h-6" /> 
  },
};

export const TicketCard: React.FC<TicketCardProps> = ({
  highlightedType,
  showAvailableOnly = false,
}) => {
  // Get tickets from mock data
  const allTickets = eventData.tickets;
  const tickets = showAvailableOnly 
    ? allTickets.filter(t => t.available) 
    : allTickets;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
          <div className="flex items-center gap-3">
            <Ticket className="w-6 h-6 text-white" />
            <div>
              <h3 className="text-xl font-bold text-white">Ticket Options</h3>
              <p className="text-indigo-100 text-sm">Choose your experience</p>
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tickets.map((ticket, index) => {
              const style = ticketStyles[ticket.type];
              const isHighlighted = highlightedType === ticket.type;

              return (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={ticket.available ? { y: -5, scale: 1.02 } : undefined}
                  className={`relative rounded-2xl overflow-hidden border border-white/10 ${
                    !ticket.available ? "opacity-60" : ""
                  } ${isHighlighted ? "ring-4 ring-indigo-500 ring-offset-2 ring-offset-slate-900" : ""}`}
                >
                  {/* Popular badge */}
                  {ticket.type === "general" && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge variant="success" size="sm">Most Popular</Badge>
                    </div>
                  )}

                  {/* Header */}
                  <div className={`bg-gradient-to-br ${style.gradient} p-5 text-white`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        {style.icon}
                      </div>
                      <span className="font-bold text-lg">{ticket.name}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">
                        {ticket.price === 0 ? "FREE" : `$${ticket.price}`}
                      </span>
                      {ticket.price > 0 && <span className="text-white/70">/ person</span>}
                    </div>
                  </div>

                  {/* Perks */}
                  <div className="p-5 bg-white/5">
                    <ul className="space-y-2 mb-4">
                      {ticket.perks.slice(0, 5).map((perk, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-white/80">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Availability */}
                    {ticket.spotsRemaining !== undefined && ticket.available && (
                      <p className="text-xs text-white/50 mb-3">
                        {ticket.spotsRemaining} spots remaining
                      </p>
                    )}

                    <Button
                      className="w-full"
                      variant={ticket.available ? "primary" : "outline"}
                      disabled={!ticket.available}
                    >
                      {ticket.available ? "Select Ticket" : "Sold Out"}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TicketCard;
