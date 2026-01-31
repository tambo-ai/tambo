"use client";

import React from "react";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThreadHistoryContext } from "@/components/tambo/thread-history";

interface ContactButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClick?: () => void;
}

/**
 * Contact list button component for the sidebar
 */
export const ContactButton = React.forwardRef<
  HTMLButtonElement,
  ContactButtonProps
>(({ onClick, ...props }, ref) => {
  const { isCollapsed } = useThreadHistoryContext();

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={cn(
        "flex items-center rounded-md mb-4 hover:bg-backdrop transition-colors cursor-pointer relative",
        isCollapsed ? "p-1 justify-center" : "p-2 gap-2",
      )}
      title="Contacts"
      {...props}
    >
      <Users className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
      <span
        className={cn(
          "text-sm font-medium whitespace-nowrap absolute left-8 pb-0.5",
          isCollapsed
            ? "opacity-0 max-w-0 overflow-hidden pointer-events-none"
            : "opacity-100 transition-all duration-300 delay-100",
        )}
      >
        Contacts
      </span>
    </button>
  );
});
ContactButton.displayName = "ContactButton";
