"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import sanitizeHtml from "sanitize-html";

const messageVariants = cva("flex", {
  variants: {
    variant: {
      default: "",
      solid: [
        "[&_div]:shadow",
        "[&_div]:shadow-zinc-900/10",
        "[&_div]:dark:shadow-zinc-900/20",
      ].join(" "),
      bordered: ["[&_div]:border", "[&_div]:border-border"].join(" "),
    },
    align: {
      user: "justify-end",
      assistant: "justify-start",
    },
  },
  defaultVariants: {
    variant: "default",
    align: "user",
  },
});

/**
 * Represents a bubble component
 * @property {string} role - Role of the bubble (user or assistant)
 * @property {string} className - Optional className for custom styling
 * @property {VariantProps<typeof bubbleVariants>["role"]} role - Role of the bubble (user or assistant)
 */
const bubbleVariants = cva(
  "relative inline-block rounded-lg px-3 py-2 text-[15px] leading-relaxed transition-all duration-200 font-medium max-w-full",
  {
    variants: {
      role: {
        user: "bg-primary text-primary-foreground hover:bg-primary/90",
        assistant: "bg-muted text-foreground hover:bg-muted/90",
      },
    },
    defaultVariants: {
      role: "user",
    },
  },
);

export interface MessageProps {
  role: "user" | "assistant";
  content: string | { type: string; text?: string }[];
  variant?: VariantProps<typeof messageVariants>["variant"];
  className?: string;
}

const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  ({ className, role, content, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(messageVariants({ variant, align: role }), className)}
        {...props}
      >
        <div className={cn(bubbleVariants({ role }))}>
          <p className="break-words whitespace-pre-wrap">
            {!content ? (
              <span className="text-muted-foreground italic">
                Empty message
              </span>
            ) : typeof content === "string" ? (
              sanitizeHtml(content)
            ) : (
              content.map((item, index) => (
                <span key={index}>
                  {item.text ? sanitizeHtml(item.text) : ""}
                </span>
              ))
            )}
          </p>
        </div>
      </div>
    );
  },
);
Message.displayName = "Message";

export { Message, messageVariants };
