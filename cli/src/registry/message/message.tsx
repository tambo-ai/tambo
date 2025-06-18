"use client";

import { createMarkdownComponents } from "@/components/ui/markdownComponents";
import { checkHasContent, getSafeContent } from "@/lib/thread-hooks";
import { cn } from "@/lib/utils";
import type { TamboThreadMessage } from "@tambo-ai/react";
import type TamboAI from "@tambo-ai/typescript-sdk";
import { cva, type VariantProps } from "class-variance-authority";
import stringify from "json-stringify-pretty-compact";
import { Check, ChevronDown, ExternalLink, Loader2, X } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

/**
 * CSS variants for the message container
 * @typedef {Object} MessageVariants
 * @property {string} default - Default styling
 * @property {string} solid - Solid styling with shadow effects
 */
const messageVariants = cva("flex", {
  variants: {
    variant: {
      default: "",
      solid: [
        "[&>div>div:first-child]:shadow-md",
        "[&>div>div:first-child]:bg-container/50",
        "[&>div>div:first-child]:hover:bg-container",
        "[&>div>div:first-child]:transition-all",
        "[&>div>div:first-child]:duration-200",
      ].join(" "),
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

/**
 * @typedef MessageContextValue
 * @property {"user" | "assistant"} role - The role of the message sender.
 * @property {VariantProps<typeof messageVariants>["variant"]} [variant] - Optional styling variant for the message container.
 * @property {TamboThreadMessage} message - The full Tambo thread message object.
 * @property {boolean} [isLoading] - Optional flag to indicate if the message is in a loading state.
 */
interface MessageContextValue {
  role: "user" | "assistant";
  variant?: VariantProps<typeof messageVariants>["variant"];
  message: TamboThreadMessage;
  isLoading?: boolean;
}

/**
 * React Context for sharing message data and settings among sub-components.
 * @internal
 */
const MessageContext = React.createContext<MessageContextValue | null>(null);

/**
 * Hook to access the message context.
 * Throws an error if used outside of a Message component.
 * @returns {MessageContextValue} The message context value.
 * @throws {Error} If used outside of Message.
 * @internal
 */
const useMessageContext = () => {
  const context = React.useContext(MessageContext);
  if (!context) {
    throw new Error("Message sub-components must be used within a Message");
  }
  return context;
};

// --- Sub-Components ---

/**
 * Props for the Message component.
 * Extends standard HTMLDivElement attributes.
 */
export interface MessageProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "content"> {
  /** The role of the message sender ('user' or 'assistant'). */
  role: "user" | "assistant";
  /** The full Tambo thread message object. */
  message: TamboThreadMessage;
  /** Optional styling variant for the message container. */
  variant?: VariantProps<typeof messageVariants>["variant"];
  /** Optional flag to indicate if the message is in a loading state. */
  isLoading?: boolean;
  /** The child elements to render within the root container. Typically includes Message.Bubble and Message.RenderedComponentArea. */
  children: React.ReactNode;
}

/**
 * The root container for a message component.
 * It establishes the context for its children and applies alignment styles based on the role.
 * @component Message
 * @example
 * ```tsx
 * <Message role="user" message={messageData} variant="solid">
 *   <Message.Bubble />
 *   <Message.RenderedComponentArea />
 * </Message>
 * ```
 */
const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  (
    { children, className, role, variant, isLoading, message, ...props },
    ref,
  ) => {
    const contextValue = React.useMemo(
      () => ({ role, variant, isLoading, message }),
      [role, variant, isLoading, message],
    );

    return (
      <MessageContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn(messageVariants({ variant }), className)}
          data-message-role={role}
          data-message-id={message.id}
          {...props}
        >
          {children}
        </div>
      </MessageContext.Provider>
    );
  },
);
Message.displayName = "Message";

/**
 * Loading indicator with bouncing dots animation
 *
 * A reusable component that displays three animated dots for loading states.
 * Used in message content and tool status areas.
 *
 * @component
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Standard HTML div props
 * @param {string} [props.className] - Optional CSS classes to apply
 * @returns {JSX.Element} Animated loading indicator component
 */
const LoadingIndicator: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => {
  return (
    <div className={cn("flex items-center gap-1", className)} {...props}>
      <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></span>
      <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.2s]"></span>
      <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.1s]"></span>
    </div>
  );
};
LoadingIndicator.displayName = "LoadingIndicator";

/**
 * Gets the appropriate status message for a tool call
 *
 * This function extracts and formats status messages for tool calls based on
 * the current loading state and available status information.
 *
 * @param {TamboThreadMessage} message - The thread message object containing tool call data
 * @param {boolean | undefined} isLoading - Whether the tool call is currently in progress
 * @returns {string | null} The formatted status message or null if not a tool call
 */
function getToolStatusMessage(
  message: TamboThreadMessage,
  isLoading: boolean | undefined,
) {
  const isToolCall = message.actionType === "tool_call";
  if (!isToolCall) return null;

  const toolCallMessage = isLoading
    ? `Calling ${message.toolCallRequest?.toolName ?? "tool"}`
    : `Called ${message.toolCallRequest?.toolName ?? "tool"}`;
  const toolStatusMessage = isLoading
    ? message.component?.statusMessage
    : message.component?.completionStatusMessage;
  return toolStatusMessage ?? toolCallMessage;
}

/**
 * Props for the MessageContent component.
 * Extends standard HTMLDivElement attributes.
 */
export interface MessageContentProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "content"> {
  /** Optional override for the message content. If not provided, uses the content from the message object in the context. */
  content?: string | { type: string; text?: string }[];
  /** Optional flag to render as Markdown. Default is true. */
  markdown?: boolean;
}

/**
 * Displays the message content with optional markdown formatting.
 * @component MessageContent
 */
const MessageContent = React.forwardRef<HTMLDivElement, MessageContentProps>(
  (
    { className, children, content: contentProp, markdown = true, ...props },
    ref,
  ) => {
    const [isToolcallExpanded, setIsToolcallExpanded] = useState(false);
    const { message, isLoading } = useMessageContext();
    const contentToRender = children ?? contentProp ?? message.content;
    const toolDetailsId = React.useId();

    const safeContent = React.useMemo(
      () => getSafeContent(contentToRender as TamboThreadMessage["content"]),
      [contentToRender],
    );
    const hasContent = React.useMemo(
      () => checkHasContent(contentToRender as TamboThreadMessage["content"]),
      [contentToRender],
    );

    const showLoading = isLoading && !hasContent;
    const toolStatusMessage = getToolStatusMessage(message, isLoading);
    const hasToolError = message.actionType === "tool_call" && message.error;

    const toolCallRequest: TamboAI.ToolCallRequest | undefined =
      // Temporary until we have a better way to get the tool call request from a server-side tool call
      message.toolCallRequest ?? message.component?.toolCallRequest;
    return (
      <div
        ref={ref}
        className={cn(
          "relative block rounded-3xl px-4 py-2 text-[15px] leading-relaxed transition-all duration-200 font-medium max-w-full [&_p]:py-1 [&_ul]:py-4 [&_ol]:py-4 [&_li]:list-item",
          className,
        )}
        data-slot="message-content"
        {...props}
      >
        {showLoading ? (
          <div
            className="flex items-center justify-start h-4 py-1"
            data-slot="message-loading-indicator"
          >
            <LoadingIndicator />
          </div>
        ) : (
          <div
            className={cn("break-words", !markdown && "whitespace-pre-wrap")}
            data-slot="message-content-text"
          >
            {!contentToRender ? (
              <span className="text-muted-foreground italic">
                Empty message
              </span>
            ) : React.isValidElement(contentToRender) ? (
              contentToRender
            ) : markdown ? (
              <ReactMarkdown components={createMarkdownComponents()}>
                {typeof safeContent === "string" ? safeContent : ""}
              </ReactMarkdown>
            ) : (
              safeContent
            )}
          </div>
        )}
        {toolStatusMessage && (
          <div className="flex flex-col items-start text-xs opacity-50 pt-2">
            <div className="flex flex-col gap-2">
              <button
                type="button"
                aria-expanded={isToolcallExpanded}
                aria-controls={toolDetailsId}
                onClick={() => setIsToolcallExpanded(!isToolcallExpanded)}
                className={cn(
                  "flex items-center gap-1 cursor-pointer hover:bg-gray-100 rounded-md p-1 select-none",
                )}
              >
                {hasToolError ? (
                  <X className="w-3 h-3 text-bold text-red-500" />
                ) : isLoading ? (
                  <Loader2 className="w-3 h-3 text-muted-foreground text-bold animate-spin" />
                ) : (
                  <Check className="w-3 h-3 text-bold text-green-500" />
                )}
                <span>{toolStatusMessage}</span>
                <ChevronDown
                  className={cn(
                    "w-3 h-3 transition-transform duration-200",
                    !isToolcallExpanded && "-rotate-90",
                  )}
                />
              </button>
              <div
                id={toolDetailsId}
                className={cn(
                  "flex flex-col gap-1 pl-4 overflow-hidden transition-[max-height,opacity] duration-300",
                  isToolcallExpanded
                    ? "max-h-96 opacity-100"
                    : "max-h-0 opacity-0",
                )}
              >
                <span className="whitespace-pre-wrap">
                  tool: {toolCallRequest?.toolName}
                </span>
                <span className="whitespace-pre-wrap">
                  parameters:{"\n"}
                  {stringify(keyifyParameters(toolCallRequest?.parameters))}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);
MessageContent.displayName = "MessageContent";

function keyifyParameters(
  parameters: TamboAI.ToolCallRequest["parameters"] | undefined,
) {
  if (!parameters) return;
  return Object.fromEntries(
    parameters.map((p) => [p.parameterName, p.parameterValue]),
  );
}

/**
 * Props for the MessageRenderedComponentArea component.
 * Extends standard HTMLDivElement attributes.
 */
export type MessageRenderedComponentAreaProps =
  React.HTMLAttributes<HTMLDivElement>;

/**
 * Displays the `renderedComponent` associated with an assistant message.
 * Shows a button to view in canvas if a canvas space exists, otherwise renders inline.
 * Only renders if the message role is 'assistant' and `message.renderedComponent` exists.
 * @component Message.RenderedComponentArea
 */
const MessageRenderedComponentArea = React.forwardRef<
  HTMLDivElement,
  MessageRenderedComponentAreaProps
>(({ className, children, ...props }, ref) => {
  const { message, role } = useMessageContext();
  const [canvasExists, setCanvasExists] = React.useState(false);

  // Check if canvas exists on mount and window resize
  React.useEffect(() => {
    const checkCanvasExists = () => {
      const canvas = document.querySelector('[data-canvas-space="true"]');
      setCanvasExists(!!canvas);
    };

    // Check on mount
    checkCanvasExists();

    // Set up resize listener
    window.addEventListener("resize", checkCanvasExists);

    // Clean up
    return () => {
      window.removeEventListener("resize", checkCanvasExists);
    };
  }, []);

  if (!message.renderedComponent || role !== "assistant") {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn("pt-2", className)}
      data-slot="message-rendered-component-area"
      {...props}
    >
      {children ??
        (canvasExists ? (
          <div className="flex justify-start pl-4">
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(
                    new CustomEvent("tambo:showComponent", {
                      detail: {
                        messageId: message.id,
                        component: message.renderedComponent,
                      },
                    }),
                  );
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-secondary transition-colors duration-200 cursor-pointer group"
              aria-label="View component in canvas"
            >
              View component
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="w-full pt-4 px-2">{message.renderedComponent}</div>
        ))}
    </div>
  );
});
MessageRenderedComponentArea.displayName = "Message.RenderedComponentArea";

// --- Exports ---
export {
  LoadingIndicator,
  Message,
  MessageContent,
  MessageRenderedComponentArea,
  messageVariants,
};
