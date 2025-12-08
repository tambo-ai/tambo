"use client";

import { cn } from "@/lib/utils";
import { useMessageThreadPanel } from "@/providers/message-thread-panel-provider";
import * as React from "react";

export interface TamboChatTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Trigger button to open the message thread panel
 * Features a search bar design with "Ask Tambo" text and keyboard shortcut
 */
export const TamboChatTrigger = React.forwardRef<
  HTMLButtonElement,
  TamboChatTriggerProps
>(({ className, ...props }, ref) => {
  const { togglePanel } = useMessageThreadPanel();

  const isMac =
    typeof navigator !== "undefined" && navigator.platform.startsWith("Mac");
  const modKey = isMac ? "⌘" : "Ctrl";

  return (
    <button
      ref={ref}
      onClick={togglePanel}
      className={cn(
        "flex items-center gap-2 pl-2 pr-3 py-2 h-9 rounded-lg",
        "bg-white border border-gray-200 shadow-sm",
        "hover:shadow-md hover:border-gray-300 transition-colors duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "min-w-[160px] text-left",
        className,
      )}
      aria-label="Open message thread"
      {...props}
    >
      <span className="text-sm text-muted-foreground flex-1">ask tambo</span>
      <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 rounded border text-gray-600 ml-auto">
        {modKey} K
      </kbd>
    </button>
  );
});
TamboChatTrigger.displayName = "TamboChatTrigger";
