"use client";

import { TamboChatInput } from "./chat-input";
import { TamboMessageList } from "./message-list";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const PANEL_BREAKPOINT_PX = 768;
const PANEL_DEFAULT_WIDTH_PX = 400;
/** On mobile/small screens: leave this many px so notes stay visible behind. */
const PANEL_MOBILE_MIN_VISIBLE_PX = 56;
const PANEL_MOBILE_MAX_WIDTH_PX = 380;

interface AskTamboSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Returns panel width when open. Desktop: fixed width. Mobile/tablet: viewport minus a sliver so notes stay visible behind.
 */
function getOpenPanelWidth(): number {
  if (typeof window === "undefined") return PANEL_DEFAULT_WIDTH_PX;
  if (window.innerWidth >= PANEL_BREAKPOINT_PX) {
    return PANEL_DEFAULT_WIDTH_PX;
  }
  const width = window.innerWidth - PANEL_MOBILE_MIN_VISIBLE_PX;
  return Math.min(PANEL_MOBILE_MAX_WIDTH_PX, Math.max(280, width));
}

/**
 * Shared chat content: header, messages, input.
 */
function ChatContent({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="flex items-center justify-between w-full p-4 border-b border-border bg-background">
        <span className="font-heading text-base font-semibold leading-tight tracking-tighter text-foreground">
          ask tambo
        </span>
        <button
          type="button"
          className="p-1 rounded-md hover:bg-muted transition-colors cursor-pointer text-foreground"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        <TamboMessageList />
      </div>
      <div className="p-4 border-t border-border flex-shrink-0 bg-background">
        <TamboChatInput />
      </div>
    </>
  );
}

/**
 * "Ask tambo" panel: slides in from the right and pushes the entire page left.
 * On mobile/tablet uses fixed width so notes remain visible behind.
 */
export function AskTamboSheet({ open, onOpenChange }: AskTamboSheetProps) {
  const [width, setWidth] = useState(open ? getOpenPanelWidth() : 0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(open ? getOpenPanelWidth() : 0), 0);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleResize = () => setWidth(getOpenPanelWidth());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [open]);

  return (
    <div
      className={cn(
        "h-full min-h-0 flex flex-col bg-background border-l border-border overflow-hidden shrink-0 transition-[width] duration-300 ease-in-out",
      )}
      style={{
        width,
        maxWidth: width > 0 ? Math.min(width, 600) : undefined,
      }}
      aria-hidden={!open}
    >
      {width > 0 && (
        <div className="flex flex-col h-full min-h-0 min-w-0">
          <ChatContent onClose={() => onOpenChange(false)} />
        </div>
      )}
    </div>
  );
}
