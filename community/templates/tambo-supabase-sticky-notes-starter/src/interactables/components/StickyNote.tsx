"use client";

import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import * as React from "react";
import { Trash2 } from "lucide-react";
import { z } from "zod";

export const stickyNoteSchema = z.object({
  content: z.string(),
  color: z.enum(["yellow", "red", "green", "blue", "purple", "pink"]),
  id: z.number().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
});

export type StickyNoteProps = z.infer<typeof stickyNoteSchema>;

/**
 * StickyNote - Interactive display component
 * Draggable note card 
 */
export function StickyNote({
  content,
  color = "yellow",
  id,
  x = 0,
  y = 0,
}: StickyNoteProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [position, setPosition] = React.useState({ x, y });
  const dragRef = React.useRef({ startX: 0, startY: 0, noteX: 0, noteY: 0 });

  React.useEffect(() => {
    setPosition({ x, y });
  }, [x, y]);

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMove = (clientX: number, clientY: number) => {
      const dx = clientX - dragRef.current.startX;
      const dy = clientY - dragRef.current.startY;
      setPosition({
        x: dragRef.current.noteX + dx,
        y: dragRef.current.noteY + dy,
      });
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    const handleEnd = async () => {
      setIsDragging(false);
      if (id) {
        await supabase
          .from("notes")
          .update({ x: position.x, y: position.y })
          .eq("id", id);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleEnd);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, id, position.x, position.y]);

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragRef.current = {
      startX: clientX,
      startY: clientY,
      noteX: position.x,
      noteY: position.y,
    };
  };

  const handleDelete = async () => {
    if (id) await supabase.from("notes").delete().eq("id", id);
  };

  const colors = {
    yellow: {
      accent: "bg-amber-400",
      border: "border-[#D9E8E2]",
      text: "text-amber-700",
      bg: "bg-[#F2F8F5]",
      hover: "hover:shadow-amber-200/60",
    },
    red: {
      accent: "bg-red-400",
      border: "border-[#D9E8E2]",
      text: "text-red-700",
      bg: "bg-[#F2F8F5]",
      hover: "hover:shadow-red-200/60",
    },
    green: {
      accent: "bg-[#80FFCE]",
      border: "border-[#D9E8E2]",
      text: "text-emerald-700",
      bg: "bg-[#F2F8F5]",
      hover: "hover:shadow-emerald-200/60",
    },
    blue: {
      accent: "bg-blue-400",
      border: "border-[#D9E8E2]",
      text: "text-blue-700",
      bg: "bg-[#F2F8F5]",
      hover: "hover:shadow-blue-200/60",
    },
    purple: {
      accent: "bg-purple-400",
      border: "border-[#D9E8E2]",
      text: "text-purple-700",
      bg: "bg-[#F2F8F5]",
      hover: "hover:shadow-purple-200/60",
    },
    pink: {
      accent: "bg-pink-400",
      border: "border-[#D9E8E2]",
      text: "text-pink-700",
      bg: "bg-[#F2F8F5]",
      hover: "hover:shadow-pink-200/60",
    },
  };

  const c = colors[color];

  const contentLength = content.length;
  const noteWidth = contentLength > 200 ? "w-[400px]" : contentLength > 100 ? "w-[360px]" : "w-[320px]";
  const minHeight = contentLength > 200 ? "min-h-[280px]" : contentLength > 100 ? "min-h-[240px]" : "min-h-[200px]";

  return (
    <div
      className="absolute touch-none"
      style={{ left: position.x, top: position.y }}
      onMouseDown={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        handleStart(e.clientX, e.clientY);
      }}
      onTouchStart={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        const touch = e.touches[0];
        handleStart(touch.clientX, touch.clientY);
      }}
    >
      <div
        className={cn(
          noteWidth,
          minHeight,
          "backdrop-blur-sm rounded-2xl border-2 overflow-hidden shadow-xl",
          c.bg,
          c.border,
          c.hover,
          isDragging
            ? "cursor-grabbing shadow-2xl scale-[1.03] ring-2 ring-[#80FFCE]/30"
            : "cursor-grab hover:shadow-2xl hover:scale-[1.01]",
          "transition-all duration-300 ease-out",
        )}
      >
        <div className={cn("h-2.5", c.accent)} />

        <div className="px-5 py-3.5 flex items-center justify-between border-b-2 border-[#D9E8E2] bg-gradient-to-br from-white/60 to-white/30">
          <span
            className={cn(
              "text-[11px] font-bold uppercase tracking-widest",
              c.text,
            )}
          >
            {color}
          </span>
          <button
            onClick={handleDelete}
            className="p-2 rounded-lg hover:bg-white/80 text-gray-500 hover:text-red-600 transition-all duration-200 hover:scale-110"
            title="Delete note"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 bg-white/40">
          <p className="text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap break-words font-medium">
            {content}
          </p>
        </div>

        <div className="px-5 py-3 border-t-2 border-[#D9E8E2] bg-gradient-to-br from-white/40 to-[#F2F8F5]/60 flex items-center justify-between text-[11px] text-gray-600 font-semibold">
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#80FFCE]"></div>
            {id ? `#${id}` : "Syncing..."}
          </span>
          <span className="tracking-wide">
            {new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
