"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTamboV1 } from "@tambo-ai/react/v1";
import type {
  TamboV1Message,
  V1ToolUseContent,
} from "@tambo-ai/react/v1/types/message";
import { Check, ChevronDown, Loader2, X } from "lucide-react";
import { FC, useEffect, useRef, useState } from "react";
import { formatToolResultContent } from "./tool-display-utils";

interface V1ThreadContentProps {
  className?: string;
}

/**
 * Simple V1 message content renderer.
 * Displays messages from the V1 streaming state.
 */
export const V1ThreadContent: FC<V1ThreadContentProps> = ({ className }) => {
  const { messages, isStreaming } = useTamboV1();

  if (messages.length === 0) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <p className="text-muted-foreground text-center py-8">
          No messages yet. Send a message to get started.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn("flex flex-col gap-2 flex-1 overflow-y-auto", className)}
    >
      {messages.map((message, index) => (
        <V1MessageItem
          key={message.id ?? `${message.role}-${index}`}
          message={message}
          isLoading={isStreaming && index === messages.length - 1}
        />
      ))}
    </div>
  );
};

interface V1MessageItemProps {
  message: TamboV1Message;
  isLoading?: boolean;
}

/**
 * Renders a single message, separating tool content from text/component content.
 * Tool calls are rendered separately with neutral styling.
 */
const V1MessageItem: FC<V1MessageItemProps> = ({ message, isLoading }) => {
  const isAssistant = message.role === "assistant";
  const hasReasoning = !!message.reasoning?.length;

  // Separate tool content from other content
  // Non-tool content (text, component, resource) renders in order
  // Tool content renders separately below
  const nonToolContent = message.content.filter(
    (c) => c.type !== "tool_use" && c.type !== "tool_result",
  );
  const toolContent = message.content.filter(
    (c) => c.type === "tool_use" || c.type === "tool_result",
  );

  return (
    <div className="flex flex-col gap-2">
      {/* Reasoning info - shown for assistant messages with reasoning data */}
      {isAssistant && hasReasoning && (
        <div className="flex w-full justify-start">
          <V1ReasoningInfo
            reasoning={message.reasoning ?? []}
            reasoningDurationMS={message.reasoningDurationMS}
          />
        </div>
      )}

      {/* Non-tool content (text, component, resource) in order */}
      {nonToolContent.length > 0 && (
        <div
          className={cn(
            "flex w-full",
            isAssistant ? "justify-start" : "justify-end",
          )}
        >
          <Card
            className={cn(
              "p-3 max-w-3xl",
              isAssistant ? "bg-muted" : "bg-primary text-primary-foreground",
            )}
          >
            {nonToolContent.map((content, contentIndex) => (
              <V1ContentPart key={contentIndex} content={content} />
            ))}
            {isLoading && toolContent.length === 0 && (
              <span className="inline-block animate-pulse ml-1">▋</span>
            )}
          </Card>
        </div>
      )}

      {/* Tool content rendered separately with neutral styling */}
      {toolContent.map((content, contentIndex) => (
        <div key={`tool-${contentIndex}`} className="flex w-full justify-start">
          <V1ContentPart content={content} />
        </div>
      ))}
    </div>
  );
};

interface V1ContentPartProps {
  content: TamboV1Message["content"][number];
}

const V1ContentPart: FC<V1ContentPartProps> = ({ content }) => {
  switch (content.type) {
    case "text":
      return <span className="whitespace-pre-wrap">{content.text}</span>;
    case "component":
      return (
        <div className="my-2">
          {content.renderedComponent ?? (
            <Card className="p-2 bg-background">
              <p className="text-sm font-medium text-muted-foreground">
                Component: {content.name}
              </p>
            </Card>
          )}
        </div>
      );
    case "tool_use":
      return <ToolUseInfo content={content} />;
    case "tool_result":
      return <ToolResultInfo content={content} />;
    case "resource":
      return (
        <div className="my-2 text-sm text-muted-foreground">
          Resource: {content.resource?.name ?? "unknown"}
        </div>
      );
    default:
      return null;
  }
};

interface ToolUseInfoProps {
  content: V1ToolUseContent;
}

const ToolUseInfo: FC<ToolUseInfoProps> = ({ content }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasCompleted = content.hasCompleted ?? false;
  const displayMessage = content.statusMessage ?? `Calling ${content.name}`;

  return (
    <div className="flex flex-col items-start text-xs opacity-70 max-w-3xl">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="group flex items-center gap-1 cursor-pointer hover:bg-muted rounded-md p-1 select-none"
      >
        <ToolStatusIcon isLoading={!hasCompleted} isError={false} />
        <span>{displayMessage}</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform duration-200",
            !isExpanded && "-rotate-90",
          )}
        />
      </button>
      <div
        className={cn(
          "transition-[max-height,opacity,padding] duration-300 overflow-hidden w-full",
          isExpanded
            ? "max-h-[500px] opacity-100 p-2"
            : "max-h-0 opacity-0 p-0",
        )}
      >
        <div className="pl-6 space-y-2 text-muted-foreground">
          <div className="whitespace-pre-wrap">tool: {content.name}</div>
          <div className="whitespace-pre-wrap">
            parameters:
            <pre className="bg-muted/50 rounded-md p-2 mt-1 overflow-x-auto max-h-40">
              <code className="font-mono text-xs whitespace-pre-wrap">
                {JSON.stringify(content.input, null, 2)}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ToolResultInfoProps {
  content: Extract<TamboV1Message["content"][number], { type: "tool_result" }>;
}

const ToolResultInfo: FC<ToolResultInfoProps> = ({ content }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isError = content.isError;

  return (
    <div className="flex flex-col items-start text-xs opacity-70 max-w-3xl">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="group flex items-center gap-1 cursor-pointer hover:bg-muted rounded-md p-1 select-none"
      >
        <ToolStatusIcon isLoading={false} isError={isError} />
        <span>Tool result{isError ? " (error)" : ""}</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform duration-200",
            !isExpanded && "-rotate-90",
          )}
        />
      </button>
      <div
        className={cn(
          "transition-[max-height,opacity,padding] duration-300 overflow-hidden w-full",
          isExpanded
            ? "max-h-[500px] opacity-100 p-2"
            : "max-h-0 opacity-0 p-0",
        )}
      >
        <div className="pl-6 space-y-2 text-muted-foreground">
          <div className="whitespace-pre-wrap">
            result:
            <pre
              className={cn(
                "rounded-md p-2 mt-1 overflow-x-auto max-h-64",
                isError ? "bg-destructive/10" : "bg-muted/50",
              )}
            >
              <code className="font-mono text-xs whitespace-pre-wrap">
                {formatToolResultContent(content.content)}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ToolStatusIconProps {
  isLoading?: boolean;
  isError?: boolean;
}

const ToolStatusIcon: FC<ToolStatusIconProps> = ({ isLoading, isError }) => {
  if (isLoading) {
    return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;
  }
  if (isError) {
    return <X className="h-3 w-3 text-red-500" />;
  }
  return <Check className="h-3 w-3 text-green-500" />;
};

// ============================================================================
// V1 Reasoning Info Component
// ============================================================================

interface V1ReasoningInfoProps {
  reasoning: string[];
  reasoningDurationMS?: number;
}

/**
 * Formats the reasoning duration in a human-readable format.
 */
function formatReasoningDuration(durationMS: number): string {
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
 * Displays reasoning information in a collapsible dropdown.
 * Auto-expands while reasoning, auto-collapses when reasoning completes.
 */
const V1ReasoningInfo: FC<V1ReasoningInfoProps> = ({
  reasoning,
  reasoningDurationMS,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reasoning is complete when we have a duration
  const isComplete = reasoningDurationMS !== undefined;

  // Auto-collapse when reasoning completes
  useEffect(() => {
    if (isComplete) {
      setIsExpanded(false);
    }
  }, [isComplete]);

  // Auto-scroll to bottom when reasoning content changes (only while still thinking)
  useEffect(() => {
    if (
      scrollContainerRef.current &&
      isExpanded &&
      reasoning.length > 0 &&
      !isComplete
    ) {
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({
            top: scrollContainerRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      });
    }
  }, [reasoning, isExpanded, isComplete]);

  const statusText = isComplete
    ? formatReasoningDuration(reasoningDurationMS)
    : "Thinking";

  const showStepNumbers = reasoning.length > 1;

  return (
    <div className="flex flex-col items-start text-xs opacity-50 max-w-3xl">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="group flex items-center gap-1 cursor-pointer hover:bg-muted-foreground/10 rounded-md px-3 py-1 select-none"
      >
        <span
          className={cn(
            !isComplete && "data-loading:animate-thinking-gradient",
          )}
          data-loading={!isComplete || undefined}
        >
          {statusText}
        </span>
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform duration-200",
            !isExpanded && "-rotate-90",
          )}
        />
      </button>
      <div
        ref={scrollContainerRef}
        className={cn(
          "flex flex-col gap-1 px-3 py-3 overflow-auto transition-[max-height,opacity,padding] duration-300 w-full",
          isExpanded
            ? "max-h-96 opacity-100"
            : "max-h-0 opacity-0 p-0 overflow-hidden",
        )}
      >
        <div className="space-y-4">
          {reasoning.map((step, index) => (
            <div key={index} className="flex flex-col gap-1">
              {showStepNumbers && (
                <span className="text-muted-foreground text-xs font-medium">
                  Step {index + 1}:
                </span>
              )}
              {step && (
                <div className="bg-muted/50 rounded-md p-3 text-xs overflow-x-auto overflow-y-auto max-w-full">
                  <div className="whitespace-pre-wrap break-words">{step}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
