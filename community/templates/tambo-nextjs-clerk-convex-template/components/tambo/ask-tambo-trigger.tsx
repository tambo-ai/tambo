"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

export interface AskTamboTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Trigger button to open the "ask tambo" sheet panel.
 * Features a search bar design with "ask tambo" text and keyboard shortcut.
 */
export const AskTamboTrigger = React.forwardRef<
  HTMLButtonElement,
  AskTamboTriggerProps
>(({ className, onClick, ...props }, ref) => {
  const isMac =
    typeof navigator !== "undefined" && navigator.platform.startsWith("Mac");
  const modKey = isMac ? "⌘" : "Ctrl";

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 pl-2 pr-3 py-2 h-9 rounded-lg",
        "bg-white border border-gray-200 shadow-sm",
        "hover:shadow-md hover:border-gray-300 transition-colors duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "min-w-[160px] text-left",
        className,
      )}
      aria-label="Open ask tambo"
      {...props}
    >
      <span className="text-sm text-muted-foreground flex-1">ask tambo</span>
      <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 rounded border text-gray-600 ml-auto">
        {modKey} K
      </kbd>
    </button>
  );
});
AskTamboTrigger.displayName = "AskTamboTrigger";
