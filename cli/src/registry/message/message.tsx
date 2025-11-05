"use client";

import { markdownComponents } from "@/components/tambo/markdown-components";
import {
  checkHasContent,
  getMessageImages,
  getSafeContent,
} from "@/lib/thread-hooks";
import { cn } from "@/lib/utils";
import type { TamboThreadMessage } from "@tambo-ai/react";
import { useTambo } from "@tambo-ai/react";
import type TamboAI from "@tambo-ai/typescript-sdk";
import { cva, type VariantProps } from "class-variance-authority";
import stringify from "json-stringify-pretty-compact";
import { Check, ChevronDown, ExternalLink, Loader2, X } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { useState } from "react";
import { Streamdown } from "streamdown";

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

/**
 * Get the tool call request from the message, or the component tool call request
 *
 * @param message - The message to get the tool call request from
 * @returns The tool call request
 */
export function getToolCallRequest(
  message: TamboThreadMessage,
): TamboAI.ToolCallRequest | undefined {
  return message.toolCallRequest ?? message.component?.toolCallRequest;
}

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

    // Don't render tool response messages as they're shown in tool call dropdowns
    if (message.role === "tool") {
      return null;
    }

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
 * Props for the MessageImages component.
 */
export type MessageImagesProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Displays images from message content horizontally.
 * @component MessageImages
 */
const MessageImages = React.forwardRef<HTMLDivElement, MessageImagesProps>(
  ({ className, ...props }, ref) => {
    const { message } = useMessageContext();
    const images = getMessageImages(message.content);

    if (images.length === 0) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn("flex flex-wrap gap-2 mb-2", className)}
        data-slot="message-images"
        {...props}
      >
        {images.map((imageUrl: string, index: number) => (
          <div
            key={index}
            className="w-32 h-32 rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <Image
              src={imageUrl}
              alt={`Image ${index + 1}`}
              width={128}
              height={128}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
        ))}
      </div>
    );
  },
);
MessageImages.displayName = "MessageImages";

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
 * Only shows text content - tool calls are handled by ToolcallInfo component.
 * @component MessageContent
 */
const MessageContent = React.forwardRef<HTMLDivElement, MessageContentProps>(
  (
    { className, children, content: contentProp, markdown = true, ...props },
    ref,
  ) => {
    const { message, isLoading } = useMessageContext();
    const contentToRender = children ?? contentProp ?? message.content;

    const safeContent = React.useMemo(
      () => getSafeContent(contentToRender as TamboThreadMessage["content"]),
      [contentToRender],
    );
    const hasContent = React.useMemo(
      () => checkHasContent(contentToRender as TamboThreadMessage["content"]),
      [contentToRender],
    );

    const showLoading = isLoading && !hasContent;

    return (
      <div
        ref={ref}
        className={cn(
          "relative block rounded-3xl px-4 py-2 text-[15px] leading-relaxed transition-all duration-200 font-medium max-w-full [&_p]:py-1 [&_li]:list-item",
          className,
        )}
        data-slot="message-content"
        {...props}
      >
        {showLoading && !message.reasoning ? (
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
              <Streamdown components={markdownComponents}>
                {typeof safeContent === "string" ? safeContent : ""}
              </Streamdown>
            ) : (
              safeContent
            )}
            {message.isCancelled && (
              <span className="text-muted-foreground text-xs">cancelled</span>
            )}
          </div>
        )}
      </div>
    );
  },
);
MessageContent.displayName = "MessageContent";

/**
 * Props for the ToolcallInfo component.
 * Extends standard HTMLDivElement attributes.
 */
export interface ToolcallInfoProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "content"> {
  /** Optional flag to render response content as Markdown. Default is true. */
  markdown?: boolean;
}

function getToolStatusMessage(
  message: TamboThreadMessage,
  isLoading: boolean | undefined,
) {
  if (message.role !== "assistant" || !getToolCallRequest(message)) {
    return null;
  }

  const toolCallMessage = isLoading
    ? `Calling ${getToolCallRequest(message)?.toolName ?? "tool"}`
    : `Called ${getToolCallRequest(message)?.toolName ?? "tool"}`;
  const toolStatusMessage = isLoading
    ? message.component?.statusMessage
    : message.component?.completionStatusMessage;
  return toolStatusMessage ?? toolCallMessage;
}

/**
 * Displays tool call information in a collapsible dropdown.
 * Shows tool name, parameters, and associated tool response.
 * @component ToolcallInfo
 */
const ToolcallInfo = React.forwardRef<HTMLDivElement, ToolcallInfoProps>(
  ({ className, markdown = true, ...props }, ref) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { message, isLoading } = useMessageContext();
    const { thread } = useTambo();
    const toolDetailsId = React.useId();

    const associatedToolResponse = React.useMemo(() => {
      if (!thread?.messages) return null;
      const currentMessageIndex = thread.messages.findIndex(
        (m: TamboThreadMessage) => m.id === message.id,
      );
      if (currentMessageIndex === -1) return null;
      for (let i = currentMessageIndex + 1; i < thread.messages.length; i++) {
        const nextMessage = thread.messages[i];
        if (nextMessage.role === "tool") {
          return nextMessage;
        }
        if (
          nextMessage.role === "assistant" &&
          getToolCallRequest(nextMessage)
        ) {
          break;
        }
      }
      return null;
    }, [message, thread?.messages]);

    if (message.role !== "assistant" || !getToolCallRequest(message)) {
      return null;
    }

    const toolCallRequest: TamboAI.ToolCallRequest | undefined =
      getToolCallRequest(message);
    const hasToolError = message.error;

    const toolStatusMessage = getToolStatusMessage(message, isLoading);

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-start text-xs opacity-50",
          className,
        )}
        data-slot="toolcall-info"
        {...props}
      >
        <div className="flex flex-col w-full">
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-controls={toolDetailsId}
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "flex items-center gap-1 cursor-pointer hover:bg-gray-100 rounded-md p-1 select-none w-fit",
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
                !isExpanded && "-rotate-90",
              )}
            />
          </button>
          <div
            id={toolDetailsId}
            className={cn(
              "flex flex-col gap-1 p-3 pl-7 overflow-auto transition-[max-height,opacity,padding] duration-300 w-full truncate",
              isExpanded ? "max-h-auto opacity-100" : "max-h-0 opacity-0 p-0",
            )}
          >
            <span className="whitespace-pre-wrap pl-2">
              tool: {toolCallRequest?.toolName}
            </span>
            <span className="whitespace-pre-wrap pl-2">
              parameters:{"\n"}
              {stringify(keyifyParameters(toolCallRequest?.parameters))}
            </span>
            <SamplingSubThread parentMessageId={message.id} />
            {associatedToolResponse && (
              <div className="pl-2">
                <span className="whitespace-pre-wrap">result:</span>
                <div>
                  {!associatedToolResponse.content ? (
                    <span className="text-muted-foreground italic">
                      Empty response
                    </span>
                  ) : (
                    formatToolResult(associatedToolResponse.content, markdown)
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);

ToolcallInfo.displayName = "ToolcallInfo";

/**
 * Displays a message's child messages in a collapsible dropdown.
 * Used for MCP sampling sub-threads.
 * @component SamplingSubThread
 */
const SamplingSubThread = ({
  parentMessageId,
  titleText = "finished additional work",
}: {
  parentMessageId: string;
  titleText?: string;
}) => {
  const { thread } = useTambo();
  const [isExpanded, setIsExpanded] = useState(false);
  const samplingDetailsId = React.useId();

  const childMessages = React.useMemo(() => {
    return thread?.messages?.filter(
      (m: TamboThreadMessage) => m.parentMessageId === parentMessageId,
    );
  }, [thread?.messages, parentMessageId]);

  if (!childMessages?.length) return null;

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={samplingDetailsId}
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center gap-1 cursor-pointer hover:bg-muted-foreground/10 rounded-md p-2 select-none w-fit",
        )}
      >
        <span>{titleText}</span>
        <ChevronDown
          className={cn(
            "w-3 h-3 transition-transform duration-200",
            !isExpanded && "-rotate-90",
          )}
        />
      </button>
      <div
        id={samplingDetailsId}
        className={cn(
          "transition-[max-height,opacity] duration-300",
          isExpanded
            ? "max-h-96 opacity-100 overflow-auto"
            : "max-h-0 opacity-0 overflow-hidden",
        )}
        aria-hidden={!isExpanded}
      >
        <div className="pl-2">
          <div className="border-l-2 border-muted-foreground p-2 flex flex-col gap-4">
            {childMessages?.map((m: TamboThreadMessage) => (
              <div key={m.id} className={`${m.role === "user" && "pl-2"}`}>
                <span
                  className={cn(
                    "whitespace-pre-wrap",
                    m.role === "assistant" &&
                      "bg-muted/50 rounded-md p-2 inline-block w-fit",
                  )}
                >
                  {getSafeContent(m.content)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
SamplingSubThread.displayName = "SamplingSubThread";

/**
 * Props for the ReasoningInfo component.
 * Extends standard HTMLDivElement attributes.
 */
export type ReasoningInfoProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "content"
>;

/**
 * Displays reasoning information in a collapsible dropdown.
 * Shows the reasoning strings provided by the LLM when available.
 * @component ReasoningInfo
 */
const ReasoningInfo = React.forwardRef<HTMLDivElement, ReasoningInfoProps>(
  ({ className, ...props }, ref) => {
    const { message, isLoading } = useMessageContext();
    const reasoningDetailsId = React.useId();
    const [isExpanded, setIsExpanded] = useState(true);
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    // Auto-collapse when content arrives and reasoning is not loading
    React.useEffect(() => {
      if (checkHasContent(message.content) && !isLoading) {
        setIsExpanded(false);
      }
    }, [message.content, isLoading]);

    // Auto-scroll to bottom when reasoning content changes
    React.useEffect(() => {
      if (scrollContainerRef.current && isExpanded && message.reasoning) {
        const scroll = () => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
              top: scrollContainerRef.current.scrollHeight,
              behavior: "smooth",
            });
          }
        };

        if (isLoading) {
          // During streaming, scroll immediately
          requestAnimationFrame(scroll);
        } else {
          // For other updates, use a short delay to batch rapid changes
          const timeoutId = setTimeout(scroll, 50);
          return () => clearTimeout(timeoutId);
        }
      }
    }, [message.reasoning, isExpanded, isLoading]);

    // Only show if there's reasoning data
    if (!message.reasoning?.length) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-start text-xs opacity-50",
          className,
        )}
        data-slot="reasoning-info"
        {...props}
      >
        <div className="flex flex-col w-full">
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-controls={reasoningDetailsId}
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "flex items-center gap-1 cursor-pointer hover:bg-muted-foreground/10 rounded-md px-3 py-1 select-none w-fit",
            )}
          >
            <span className={isLoading ? "animate-thinking-gradient" : ""}>
              {isLoading
                ? "Thinking "
                : message.reasoningDurationMS
                  ? formatReasoningDuration(message.reasoningDurationMS) + " "
                  : "Done Thinking "}
              {message.reasoning.length > 1
                ? `(${message.reasoning.length} steps)`
                : ""}
            </span>
            <ChevronDown
              className={cn(
                "w-3 h-3 transition-transform duration-200",
                !isExpanded && "-rotate-90",
              )}
            />
          </button>
          <div
            ref={scrollContainerRef}
            id={reasoningDetailsId}
            className={cn(
              "flex flex-col gap-1 px-3 py-3 overflow-auto transition-[max-height,opacity,padding] duration-300 w-full",
              isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0 p-0",
            )}
          >
            {message.reasoning.map((reasoningStep, index) => (
              <div key={index} className="flex flex-col gap-1">
                {message.reasoning?.length && message.reasoning.length > 1 && (
                  <span className="text-muted-foreground text-xs font-medium">
                    Step {index + 1}:
                  </span>
                )}
                {reasoningStep ? (
                  <div className="bg-muted/50 rounded-md p-3 text-xs overflow-x-auto overflow-y-auto max-w-full">
                    <div className="whitespace-pre-wrap break-words">
                      <Streamdown components={markdownComponents}>
                        {reasoningStep}
                      </Streamdown>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
);

ReasoningInfo.displayName = "ReasoningInfo";

function keyifyParameters(parameters: TamboAI.ToolCallParameter[] | undefined) {
  if (!parameters) return;
  return Object.fromEntries(
    parameters.map((p) => [p.parameterName, p.parameterValue]),
  );
}

/**
 * Formats the reasoning duration in a human-readable format
 * @param durationMS - The duration in milliseconds
 * @returns The formatted duration string
 */
function formatReasoningDuration(durationMS: number) {
  const seconds = Math.floor(Math.max(0, durationMS) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 1) return "Thought for less than 1 second";
  if (seconds < 60)
    return `Thought for ${seconds} ${seconds === 1 ? "second" : "seconds"}`;
  if (minutes < 60)
    return `Thought for ${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  return `Thought for ${hours} ${hours === 1 ? "hour" : "hours"}`;
}

/**
 * Helper function to detect if content is JSON and format it nicely
 * @param content - The content to check and format
 * @returns Formatted content or original content if not JSON
 */
function formatToolResult(
  content: TamboThreadMessage["content"],
  enableMarkdown = true,
): React.ReactNode {
  if (!content) return content;

  // First check if content can be converted to a string for JSON parsing
  let contentString: string | null = null;
  if (typeof content === "string") {
    contentString = content;
  } else if (Array.isArray(content)) {
    contentString = content
      .map((item) => {
        if (item?.type === "text") {
          return item.text ?? "";
        }
        return "";
      })
      .join("");
  }

  // Try to parse as JSON if we have a string
  if (contentString) {
    try {
      const parsed = JSON.parse(contentString);
      return (
        <pre
          className={cn(
            "bg-muted/50 rounded-md p-3 text-xs overflow-x-auto overflow-y-auto max-w-full max-h-64",
          )}
        >
          <code className="font-mono break-words whitespace-pre-wrap">
            {JSON.stringify(parsed, null, 2)}
          </code>
        </pre>
      );
    } catch {
      // JSON parsing failed, render as markdown or plain text
      if (!enableMarkdown) return contentString;
      return (
        <Streamdown components={markdownComponents}>{contentString}</Streamdown>
      );
    }
  }

  // If content is not a string or array, use getSafeContent as fallback
  return getSafeContent(content);
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

  if (
    !message.renderedComponent ||
    role !== "assistant" ||
    message.isCancelled
  ) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(className)}
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
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer group"
              aria-label="View component in canvas"
            >
              View component
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="w-full pt-2 px-2">{message.renderedComponent}</div>
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
  MessageImages,
  MessageRenderedComponentArea,
  messageVariants,
  ReasoningInfo,
  ToolcallInfo,
};
