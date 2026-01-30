"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTamboV1 } from "@tambo-ai/react/v1";
import type { TamboV1Message } from "@tambo-ai/react/v1/types/message";
import { FC } from "react";

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

const V1MessageItem: FC<V1MessageItemProps> = ({ message, isLoading }) => {
  const isAssistant = message.role === "assistant";

  return (
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
        {message.content.map((content, contentIndex) => (
          <V1ContentPart key={contentIndex} content={content} />
        ))}
        {isLoading && (
          <span className="inline-block animate-pulse ml-1">▋</span>
        )}
      </Card>
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
          <Card className="p-2 bg-background">
            <p className="text-sm font-medium text-muted-foreground">
              Component: {content.name}
            </p>
            {content.renderedComponent && (
              <div className="mt-2">{content.renderedComponent}</div>
            )}
          </Card>
        </div>
      );
    case "tool_use":
      return (
        <div className="my-1 text-xs text-muted-foreground">
          <p>🔧 Using tool: {content.name}</p>
        </div>
      );
    case "tool_result":
      return (
        <div className="my-1 text-xs text-muted-foreground">
          <p>✓ Tool result received</p>
        </div>
      );
    default:
      return null;
  }
};
