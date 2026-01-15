"use client";

import { cn } from "@/lib/utils";
import { useMessageThreadPanel } from "@/providers/message-thread-panel-provider";
import { XIcon } from "lucide-react";
import * as React from "react";
import { forwardRef, useEffect, useState } from "react";

/**
 * Props for the MessageThreadPanel component
 */
export interface MessageThreadPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: string;
}

/**
 * A simplified panel for the marketing site that prompts users to sign in
 */
export const MessageThreadPanel = forwardRef<
  HTMLDivElement,
  MessageThreadPanelProps
>(({ className, ...props }, ref) => {
  const { isOpen, setIsOpen } = useMessageThreadPanel();
  const [width, setWidth] = useState(isOpen ? 400 : 0);
  const dashboardUrl =
    process.env.NEXT_PUBLIC_DASHBOARD_URL || "https://app.tambo.co";

  useEffect(() => {
    setWidth(isOpen ? 400 : 0);
  }, [isOpen]);

  // Add keyboard shortcut Cmd/Ctrl + K to toggle panel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setIsOpen(!isOpen);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setIsOpen, isOpen]);

  return (
    <div
      ref={ref}
      className={cn(
        "fixed right-0 top-0 h-full flex flex-col bg-background",
        "transition-[width] duration-300 ease-in-out",
        "overflow-hidden border-l border-border z-50",
        className,
      )}
      style={{
        width: `${width}px`,
        maxWidth: "600px",
      }}
      {...props}
    >
      {/* Header */}
      <div className="flex items-center justify-between w-full p-4 border-b border-gray-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <span>ask tambo</span>
        </div>
        <div
          role="button"
          className="p-1 rounded-full hover:bg-muted/70 transition-colors cursor-pointer"
          onClick={() => setIsOpen(false)}
          aria-label="Close"
        >
          <XIcon className="h-4 w-4" />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 items-center justify-center p-8 text-center">
        <p className="text-muted-foreground mb-4">
          Sign in to your Tambo account to chat with Tambo AI about your
          projects.
        </p>
        <a
          href={dashboardUrl}
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          Sign In
        </a>
      </div>
    </div>
  );
});
MessageThreadPanel.displayName = "MessageThreadPanel";
