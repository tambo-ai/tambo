"use client";

import { clsx, type ClassValue } from "clsx";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { Mail, MoreVertical, Tag, User } from "lucide-react";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { api } from "../../convex/_generated/api";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function LeadList() {
  const leads = useQuery(api.leads.list);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !leads)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      <AnimatePresence mode="popLayout">
        {leads.map((lead) => (
          <motion.div
            key={lead._id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="group relative bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 shadow-2xl overflow-hidden"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>

            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 group-hover:bg-white/10 transition-colors">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white tracking-tight">
                      {lead.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-white/50 text-sm mt-0.5">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{lead.email}</span>
                    </div>
                  </div>
                </div>
                <button className="text-white/30 hover:text-white transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2 mt-6">
                <span
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium border",
                    lead.status === "New" &&
                      "bg-blue-500/10 text-blue-400 border-blue-500/20",
                    lead.status === "Contacted" &&
                      "bg-amber-500/10 text-amber-400 border-amber-500/20",
                    lead.status === "Closed" &&
                      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                  )}
                >
                  {lead.status}
                </span>
                {lead.notes && (
                  <span className="text-white/40 text-xs italic line-clamp-1">
                    {lead.notes}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {leads.length === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
          <div className="bg-white/5 p-6 rounded-full border border-white/10 mb-4 animate-pulse">
            <Tag className="w-10 h-10 text-white/20" />
          </div>
          <h3 className="text-xl font-medium text-white">No leads found</h3>
          <p className="text-white/40 mt-2 max-w-xs mb-6">
            Start by asking your AI assistant to add a new lead for you!
          </p>
        </div>
      )}
    </div>
  );
}
