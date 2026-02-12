"use client";

import { useEffect, useRef } from "react";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SerializedMessage } from "@/devtools-server/types";

import { ContentBlockViewer } from "./content-block-viewer";

interface MessageDetailViewProps {
  messages: SerializedMessage[];
  threadName?: string;
}

const ROLE_VARIANTS: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  user: "default",
  assistant: "secondary",
  system: "outline",
};

/**
 * Renders the messages for a selected thread with role badges and content blocks.
 *
 * @returns A scrollable message list with auto-scroll to bottom.
 */
export function MessageDetailView({
  messages,
  threadName,
}: MessageDetailViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
        No messages
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-4 p-4">
        {threadName && (
          <h3 className="font-heading text-lg font-semibold">{threadName}</h3>
        )}
        {messages.map((message) => (
          <div key={message.id} className="flex flex-col gap-2 border-b pb-4">
            <div className="flex items-center gap-2">
              <Badge variant={ROLE_VARIANTS[message.role] ?? "outline"}>
                {message.role}
              </Badge>
              {message.createdAt && (
                <span className="text-xs text-muted-foreground">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2 pl-2">
              {message.content.map((block, i) => (
                <ContentBlockViewer key={i} block={block} />
              ))}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
