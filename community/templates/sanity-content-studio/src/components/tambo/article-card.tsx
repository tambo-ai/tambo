"use client";

import { cn } from "@/lib/utils";
import { ArrowRight, Clock } from "lucide-react";

interface ArticleCardProps {
  title: string;
  excerpt: string;
  status: string;
  publishedAt: string | null;
}

export function ArticleCard({
  title,
  excerpt,
  status,
  publishedAt,
}: ArticleCardProps) {
  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <article className="h-[200px] w-full border border-zinc-800 bg-[#0A0C0D]/70 rounded-[4px] grid grid-rows-[78%_22%] overflow-hidden group shadow-sm cursor-pointer hover:border-zinc-700 transition-colors">
      
      {/* Top Section */}
      <div className="bg-[#050505] p-3 flex flex-col border-b border-zinc-800 relative">
        <div className="flex justify-between items-center mb-2">
          {/* Status Ticker */}
           <div className={cn(
             "px-2 py-0.5 rounded-[2px] text-[10px] font-medium tracking-wider uppercase border",
             status === "published" 
               ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
               : "bg-amber-500/10 text-amber-500 border-amber-500/20"
           )}>
             {status}
           </div>
           
           {/* Date */}
           {formattedDate && (
            <div className="text-[10px] text-zinc-500 tracking-wide flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              <span>{formattedDate}</span>
            </div>
           )}
        </div>

        {/* Content Preview */}
        <div className="flex-1 text-left text-[13px] tracking-wide text-zinc-400 line-clamp-3 leading-relaxed">
          {excerpt || "No content preview available..."}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="flex items-center justify-between px-3 text-[13px] tracking-wider font-medium text-zinc-300 bg-[#0A0C0D]/40">
        <span className="truncate pr-2">{title}</span>
        <ArrowRight className="w-4 h-4 text-zinc-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
      </div>

    </article>
  );
}
