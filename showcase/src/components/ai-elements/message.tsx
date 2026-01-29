"use client";

/**
 * AI Elements Message Components (Pattern Demo)
 *
 * These components demonstrate the Vercel AI Elements Message component API pattern.
 * They are simplified implementations for comparison purposes, showing how
 * AI Elements uses a `from` prop pattern for role-based styling.
 *
 * @see https://ai-sdk.dev/elements
 */

import * as React from "react";
import { cn } from "@/lib/utils";

interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  from: "user" | "assistant";
  children: React.ReactNode;
}

/**
 * Root container for a message. Uses `from` prop instead of `role`.
 * Applies group classes for conditional styling in children.
 */
const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  ({ from, children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "group flex",
          from === "user"
            ? "is-user justify-end"
            : "is-assistant justify-start",
          className,
        )}
        data-role={from}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Message.displayName = "Message";

interface MessageContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Content wrapper that applies role-based styling via group variants.
 */
const MessageContent = React.forwardRef<HTMLDivElement, MessageContentProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-2 text-sm text-foreground max-w-[80%] rounded-2xl px-4 py-3",
          "group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground",
          "group-[.is-assistant]:bg-muted",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
MessageContent.displayName = "MessageContent";

interface MessageResponseProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Renders message text content. In AI Elements, this handles markdown rendering.
 */
const MessageResponse = React.forwardRef<HTMLDivElement, MessageResponseProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("prose prose-sm max-w-none", className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);
MessageResponse.displayName = "MessageResponse";

export { Message, MessageContent, MessageResponse };
export type { MessageProps, MessageContentProps, MessageResponseProps };
