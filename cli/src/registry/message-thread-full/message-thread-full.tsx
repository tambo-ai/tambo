"use client";

import * as React from "react";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { ChatThread } from "@/components/ui/chat-thread";
import { ChatInput } from "@/components/ui/chat-input";

const messageThreadFullVariants = cva("flex flex-col w-full h-full", {
  variants: {
    variant: {
      default: "bg-background",
      solid: "bg-muted/50",
      bordered: "border rounded-lg p-4",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

/**
 * Represents a full message thread component
 * @property {string} className - Optional className for custom styling
 * @property {VariantProps<typeof messageThreadFullVariants>["variant"]} variant - Optional variant for custom styling
 */

export interface MessageThreadFullProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: VariantProps<typeof messageThreadFullVariants>["variant"];
  contextKey?: string;
}

const MessageThreadFull = React.forwardRef<
  HTMLDivElement,
  MessageThreadFullProps
>(({ className, variant, contextKey, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(messageThreadFullVariants({ variant }), className)}
      {...props}
    >
      <div className="flex-1 overflow-y-auto p-4">
        <ChatThread variant={variant} />
      </div>
      <div className="p-4 border-t">
        <ChatInput variant={variant} contextKey={contextKey} />
      </div>
    </div>
  );
});
MessageThreadFull.displayName = "MessageThreadFull";

export { MessageThreadFull, messageThreadFullVariants };
