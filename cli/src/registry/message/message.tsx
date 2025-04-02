"use client";

import { createMarkdownComponents } from "@/components/ui/markdownComponents";
import { cn } from "@/lib/utils";
import type { TamboThreadMessage } from "@tambo-ai/react";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import ReactMarkdown from "react-markdown";

/**
 * A component that renders a chat message with support for markdown content and custom styling
 * @component
 * @example
 * ```tsx
 * <Message
 *   role="user"
 *   content="Hello, how are you?"
 *   message={threadMessage}
 *   variant="solid"
 * />
 * ```
 */

/**
 * CSS variants for the message container
 * @typedef {Object} MessageVariants
 * @property {string} default - Default styling
 * @property {string} solid - Solid styling with shadow effects
 * @property {string} bordered - Bordered styling
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
 * CSS variants for the message bubble
 * @typedef {Object} BubbleVariants
 * @property {string} user - Styling for user messages
 * @property {string} assistant - Styling for assistant messages
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

/**
 * Props for the Message component
 * @interface
 */
export interface MessageProps {
  /** The role of the message sender - either 'user' or 'assistant' */
  role: "user" | "assistant";
  /**
   * The content of the message. Can be either a string or an array of content objects
   * @example
   * // String content
   * "Hello, how are you?"
   *
   * // Array of content objects
   * [
   *   { type: "text", text: "Hello" },
   *   { type: "text", text: "How are you?" }
   * ]
   */
  content: string | { type: string; text?: string }[];
  /** The Tambo thread message object containing additional message data */
  message: TamboThreadMessage;
  /** Optional styling variant for the message container */
  variant?: VariantProps<typeof messageVariants>["variant"];
  /** Optional CSS class name for additional styling */
  className?: string;
  /** Optional flag to indicate if the message is in a loading state */
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
