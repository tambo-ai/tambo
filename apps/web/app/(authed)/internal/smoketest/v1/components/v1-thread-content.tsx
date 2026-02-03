"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTamboV1 } from "@tambo-ai/react/v1";
import type { TamboV1Message } from "@tambo-ai/react/v1/types/message";
import { Check, ChevronDown, Loader2, X } from "lucide-react";
import { FC, useState } from "react";
import {
  extractTamboDisplayProps,
  filterTamboProps,
  formatToolResultContent,
} from "./tool-display-utils";

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

  // Separate content into regular content and tool content
  const regularContent = message.content.filter(
    (c) => c.type === "text" || c.type === "component",
  );
  const toolContent = message.content.filter(
    (c) => c.type === "tool_use" || c.type === "tool_result",
  );

  return (
    <div className="flex flex-col gap-2">
      {/* Regular text/component content */}
      {regularContent.length > 0 && (
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
            {regularContent.map((content, contentIndex) => (
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
          <V1ContentPart
            content={content}
            isLoading={isLoading && contentIndex === toolContent.length - 1}
          />
        </div>
      ))}
    </div>
  );
};

interface V1ContentPartProps {
  content: TamboV1Message["content"][number];
  isLoading?: boolean;
}

const V1ContentPart: FC<V1ContentPartProps> = ({ content, isLoading }) => {
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
      return <ToolUseInfo content={content} isLoading={isLoading} />;
    case "tool_result":
      return <ToolResultInfo content={content} />;
    default:
      return null;
  }
};

interface ToolUseInfoProps {
  content: Extract<TamboV1Message["content"][number], { type: "tool_use" }>;
  isLoading?: boolean;
}

const ToolUseInfo: FC<ToolUseInfoProps> = ({ content, isLoading }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const input = (content.input ?? {}) as Record<string, unknown>;
  const tamboProps = extractTamboDisplayProps(input);
  const filteredParams = filterTamboProps(input);

  // Use status message based on loading state
  const statusMessage = isLoading
    ? tamboProps._tambo_statusMessage
    : tamboProps._tambo_completionStatusMessage;
  const displayMessage =
    statusMessage ?? `${isLoading ? "Calling" : "Called"} ${content.name}`;

  return (
    <div className="flex flex-col items-start text-xs opacity-70 max-w-3xl">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="group flex items-center gap-1 cursor-pointer hover:bg-muted rounded-md p-1 select-none"
      >
        <ToolStatusIcon isLoading={isLoading} isError={false} />
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
                {JSON.stringify(filteredParams, null, 2)}
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
