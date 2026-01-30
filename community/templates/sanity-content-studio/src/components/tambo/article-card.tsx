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
  className,
}: ArticleCardProps & { className?: string }) {
  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <article className={cn(
      "h-full w-full border border-zinc-800 bg-[#0A0C0D]/70 rounded-[4px] flex flex-col overflow-hidden group shadow-sm cursor-pointer hover:border-zinc-700 transition-colors",
      className
    )}>
      
      {/* Top Section */}
      <div className="bg-[#050505] p-5 flex flex-col border-b border-zinc-800 relative flex-1 min-h-0">
        <div className="flex justify-between items-center mb-4">
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
        <div className="text-left text-[13px] tracking-wide text-zinc-400 line-clamp-[8] leading-relaxed">
          {excerpt || "No content preview available..."}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="flex items-center justify-between px-4 py-4 text-[13px] tracking-wider font-medium text-zinc-300 bg-[#0A0C0D]/40 shrink-0">
        <span className="truncate pr-2">{title}</span>
        <ArrowRight className="w-4 h-4 text-zinc-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
      </div>

    </article>
  );
}
