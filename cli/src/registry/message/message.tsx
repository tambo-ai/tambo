"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import type { TamboThreadMessage } from "@tambo-ai/react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { createMarkdownComponents } from "@/components/ui/markdownComponents";

/**
 * Represents a message component
 * @property {string} className - Optional className for custom styling
 * @property {VariantProps<typeof messageVariants>["variant"]} variant - Optional variant for custom styling
 */

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
  "relative inline-block rounded-lg px-3 py-2 text-[15px] leading-relaxed transition-all duration-200 font-medium max-w-full [&_p]:my-1 [&_ul]:-my-5 [&_ol]:-my-5",
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
  message: TamboThreadMessage;
  variant?: VariantProps<typeof messageVariants>["variant"];
  className?: string;
  isLoading?: boolean;
}

const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  (
    { className, role, content, variant, message, isLoading, ...props },
    ref,
  ) => {
    const safeContent = React.useMemo(() => {
      if (!content) return "";
      if (typeof content === "string") return content;
      return content.map((item) => item.text ?? "").join("");
    }, [content]);

    return (
      <div
        ref={ref}
        className={cn(messageVariants({ variant, align: role }), className)}
        {...props}
      >
        <div className="flex flex-col">
          <div className={cn(bubbleVariants({ role }))}>
            <div className="break-words whitespace-pre-wrap">
              <div className="text-sm mb-1 opacity-50">
                {role === "user" ? "You" : "Tambo AI"}
              </div>
              {!content ? (
                <span className="text-muted-foreground italic">
                  Empty message
                </span>
              ) : typeof content === "string" ? (
                <ReactMarkdown components={createMarkdownComponents()}>
                  {safeContent}
                </ReactMarkdown>
              ) : (
                content.map((item, index) => (
                  <span key={index}>
                    {item.text ? (
                      <ReactMarkdown components={createMarkdownComponents()}>
                        {item.text}
                      </ReactMarkdown>
                    ) : (
                      ""
                    )}
                  </span>
                ))
              )}
              {isLoading && role === "assistant" && !content && (
                <div className="flex items-center gap-1 h-4 p-1 mt-1">
                  <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.2s]"></span>
                  <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.1s]"></span>
                </div>
              )}
            </div>
          </div>
          {message.renderedComponent && role === "assistant" && (
            <div className="mt-4 w-full max-w-md">
              {message.renderedComponent}
            </div>
          )}
        </div>
      </div>
    );
  },
);
Message.displayName = "Message";

export { Message, messageVariants };
