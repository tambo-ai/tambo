import { cn } from "@/lib/utils";
import { type RouterOutputs } from "@/trpc/react";
import { AnimatePresence, motion } from "framer-motion";
import { ReactNode, useCallback, useMemo, useState } from "react";
import { isSameDay } from "../utils";
import { ComponentMessage } from "./component-message";
import { DateSeparator } from "./date-separator";
import { MessageContent } from "./message-content";
import { ToolCallMessage } from "./tool-call-message";

type ThreadType = RouterOutputs["thread"]["getThread"];
type MessageType = ThreadType["messages"][0];

interface ThreadMessagesProps {
  thread: ThreadType;
  searchQuery?: string;
  messageRefs?: React.MutableRefObject<Record<string, HTMLDivElement>>;
  highlightedMessageId?: string | null;
  currentMatchMessageId?: string | null;
  searchMatches?: Array<{
    messageId: string;
    messageType: "message" | "tool_call" | "component";
    contentType:
      | "content"
      | "toolArgs"
      | "toolResponse"
      | "componentProps"
      | "additionalContext";
  }>;
}

export function ThreadMessages({
  thread,
  searchQuery,
  messageRefs,
  highlightedMessageId,
  currentMatchMessageId,
  searchMatches = [],
}: Readonly<ThreadMessagesProps>) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyId = useCallback(async (id: string) => {
    await navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // Check if a message has a search match
  const hasSearchMatch = useCallback(
    (messageId: string) => {
      return searchMatches.some((match) => match.messageId === messageId);
    },
    [searchMatches],
  );

  // Group messages and extract tool calls with their responses
  const messageGroups = useMemo(() => {
    const messages = thread.messages || [];
    const groups: Array<{
      type: "message" | "tool_call" | "component";
      message: MessageType;
      toolResponse?: MessageType;
    }> = [];

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];

      if (message.role === "tool") {
        continue;
      }

      // Always add the message first (user or assistant)
      groups.push({
        type: "message",
        message,
      });

      // If this message has a tool call, add a separate tool call entry
      if (message.toolCallRequest) {
        // Look for the corresponding tool response
        const toolResponse = messages.find(
          (msg, idx) =>
            idx > i &&
            msg.role === "tool" &&
            msg.toolCallId === message.toolCallId,
        );

        groups.push({
          type: "tool_call",
          message,
          toolResponse,
        });
      }

      // If this message has a component decision, add a separate component entry
      if (message.componentDecision?.componentName) {
        groups.push({
          type: "component",
          message,
        });
      }
    }

    return groups;
  }, [thread.messages]);

  // highlight matches in messages
  const elementsWithDateSeparators = useMemo(() => {
    const elements: ReactNode[] = [];

    messageGroups.forEach((group, index) => {
      const message = group.message;
      const prevMessage = index > 0 ? messageGroups[index - 1].message : null;

      // Add date separator if this is the first message or if the date changed
      if (
        !prevMessage ||
        !isSameDay(prevMessage.createdAt, message.createdAt)
      ) {
        elements.push(
          <DateSeparator
            key={`date-${message.createdAt}`}
            date={message.createdAt}
          />,
        );
      }

      const isUserMessage = message.role === "user";
      const isHighlighted = highlightedMessageId === message.id;
      const isCurrentMatch = currentMatchMessageId === message.id;
      const hasMatch = hasSearchMatch(message.id);
      const key =
        group.type === "tool_call"
          ? `tool-${message.id}`
          : group.type === "component"
            ? `component-${message.id}`
            : `msg-${message.id}`;

      elements.push(
        <motion.div
          key={key}
          ref={(el) => {
            if (el && messageRefs) messageRefs.current[message.id] = el;
          }}
          initial={{ height: 0, opacity: 0, y: 20 }}
          animate={{ height: "auto", opacity: 1, y: 0 }}
          exit={{ height: 0, opacity: 0, y: -20 }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0.0, 0.2, 1],
            layout: { duration: 0.2 },
          }}
          className={cn(
            "group flex flex-col relative transition-all duration-300",
            group.type === "tool_call" || group.type === "component"
              ? "items-start"
              : isUserMessage
                ? "items-end"
                : "items-start",
            // apply opacity to non-matching messages when searching
            searchQuery && !hasMatch && "opacity-40",
            // highlight current match
            isCurrentMatch && "ring-2 ring-yellow-400 rounded-lg p-2",
          )}
        >
          {group.type === "tool_call" ? (
            <ToolCallMessage
              message={message}
              toolResponse={group.toolResponse}
              isHighlighted={isHighlighted}
              copiedId={copiedId}
              onCopyId={handleCopyId}
              searchQuery={searchQuery}
            />
          ) : group.type === "component" ? (
            <ComponentMessage
              message={message}
              isHighlighted={isHighlighted}
              copiedId={copiedId}
              onCopyId={handleCopyId}
              searchQuery={searchQuery}
            />
          ) : (
            <MessageContent
              message={message}
              isUserMessage={isUserMessage}
              isHighlighted={isHighlighted}
              copiedId={copiedId}
              onCopyId={handleCopyId}
              searchQuery={searchQuery}
            />
          )}
        </motion.div>,
      );
    });

    return elements;
  }, [
    messageGroups,
    highlightedMessageId,
    currentMatchMessageId,
    messageRefs,
    copiedId,
    handleCopyId,
    searchQuery,
    hasSearchMatch,
  ]);

  return (
    <div className="space-y-6 pb-4 px-2">
      <AnimatePresence initial={false}>
        {elementsWithDateSeparators}
      </AnimatePresence>
    </div>
  );
}
