"use client";

import * as React from "react";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { ChatThread } from "@/components/ui/chat-thread";
import { ChatInput } from "@/components/ui/chat-input";

const messageThreadPanelVariants = cva("grid h-full", {
  variants: {
    variant: {
      default: "grid-cols-1 md:grid-cols-2 divide-x",
      solid: "grid-cols-1 md:grid-cols-2 divide-x bg-muted/50",
      bordered: "grid-cols-1 md:grid-cols-2 divide-x border rounded-lg",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

/**
 * Represents a message thread panel component
 * @property {string} className - Optional className for custom styling
 * @property {VariantProps<typeof messageThreadPanelVariants>["variant"]} variant - Optional variant for custom styling
 * @property {string} contextKey - Optional context key for the Tambo thread
 * @property {React.ReactNode} children - Optional content to render in the left panel of the grid
 */

export interface MessageThreadPanelProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: VariantProps<typeof messageThreadPanelVariants>["variant"];
  contextKey?: string;
  children?: React.ReactNode;
}

const MessageThreadPanel = React.forwardRef<
  HTMLDivElement,
  MessageThreadPanelProps
>(({ className, variant, contextKey, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(messageThreadPanelVariants({ variant }), className)}
      {...props}
    >
      <div className="h-full">{children}</div>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4">
          <ChatThread
            variant={variant}
            ref={(el) => {
              if (el) {
                // Only auto-scroll if user is already near the bottom
                const isNearBottom =
                  el.scrollHeight - el.clientHeight - el.scrollTop < 100;
                if (isNearBottom) {
                  el.scrollTop = el.scrollHeight;
                }
              }
            }}
          />
        </div>
        <div className="p-4 border-t">
          <ChatInput variant={variant} contextKey={contextKey} />
        </div>
      </div>
    </div>
  );
});
MessageThreadPanel.displayName = "MessageThreadPanel";

export { MessageThreadPanel, messageThreadPanelVariants };
