import { getSafeContent } from "@/lib/thread-hooks";
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
}

export function ThreadMessages({
  thread,
  searchQuery,
  messageRefs,
  highlightedMessageId,
}: Readonly<ThreadMessagesProps>) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyId = useCallback((id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

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

      if (message.actionType === "tool_response") {
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
            msg.actionType === "tool_response" &&
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

  const filteredGroups = useMemo(() => {
    if (!searchQuery) return messageGroups;

    const query = searchQuery.toLowerCase().trim();
    return messageGroups.filter((group) => {
      const safeContent = getSafeContent(group.message.content as ReactNode);
      const textContent = typeof safeContent === "string" ? safeContent : "";
      return textContent.toLowerCase().includes(query);
    });
  }, [messageGroups, searchQuery]);

  // Create elements with date separators
  const elementsWithDateSeparators = useMemo(() => {
    const elements: ReactNode[] = [];

    filteredGroups.forEach((group, index) => {
      const message = group.message;
      const prevMessage = index > 0 ? filteredGroups[index - 1].message : null;

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
            highlightedMessageId && "opacity-40 scale-[0.98]",
          )}
        >
          {group.type === "tool_call" ? (
            <ToolCallMessage
              message={message}
              toolResponse={group.toolResponse}
              isHighlighted={isHighlighted}
              copiedId={copiedId}
              onCopyId={handleCopyId}
            />
          ) : group.type === "component" ? (
            <ComponentMessage
              message={message}
              isHighlighted={isHighlighted}
              copiedId={copiedId}
              onCopyId={handleCopyId}
            />
          ) : (
            <MessageContent
              message={message}
              isUserMessage={isUserMessage}
              isHighlighted={isHighlighted}
              copiedId={copiedId}
              onCopyId={handleCopyId}
            />
          )}
        </motion.div>,
      );
    });

    return elements;
  }, [
    filteredGroups,
    highlightedMessageId,
    messageRefs,
    copiedId,
    handleCopyId,
  ]);

  return (
    <div className="space-y-6 pb-4 px-2">
      <AnimatePresence initial={false}>
        {elementsWithDateSeparators}
      </AnimatePresence>
    </div>
  );
}
