"use client";

import * as React from "react";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import * as Collapsible from "@radix-ui/react-collapsible";
import { ChatThread } from "@/components/ui/chat-thread";
import { ChatInput } from "@/components/ui/chat-input";

const messageThreadCollapsibleVariants = cva(
  "fixed bottom-4 right-4 w-full max-w-xs sm:max-w-sm md:max-w-md rounded-lg shadow-lg transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-background border",
        solid: "bg-muted/50 backdrop-blur-sm border",
        bordered: "bg-background border-2",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

/**
 * Represents a collapsible message thread component
 * @property {string} className - Optional className for custom styling
 * @property {VariantProps<typeof messageThreadCollapsibleVariants>["variant"]} variant - Optional variant for custom styling
 */

export interface MessageThreadCollapsibleProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: VariantProps<typeof messageThreadCollapsibleVariants>["variant"];
  contextKey?: string;
  defaultOpen?: boolean;
}

const MessageThreadCollapsible = React.forwardRef<
  HTMLDivElement,
  MessageThreadCollapsibleProps
>(({ className, variant, contextKey, defaultOpen = false, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <Collapsible.Root
      ref={ref}
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn(messageThreadCollapsibleVariants({ variant }), className)}
      {...props}
    >
      <Collapsible.Trigger asChild>
        <button
          className={cn(
            "flex items-center justify-between w-full p-4",
            "hover:bg-muted/50 transition-colors",
            "border-b",
          )}
          aria-expanded={isOpen}
          aria-controls="message-thread-content"
        >
          <span>Chat</span>
          <span className="text-xs text-muted-foreground">
            {isOpen ? "Click to collapse" : "Click to expand"}
          </span>
        </button>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <div className="h-[500px] flex flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            <ChatThread variant={variant} />
          </div>
          <div className="p-4 border-t">
            <ChatInput variant={variant} contextKey={contextKey} />
          </div>
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
});
MessageThreadCollapsible.displayName = "MessageThreadCollapsible";

export { MessageThreadCollapsible, messageThreadCollapsibleVariants };
