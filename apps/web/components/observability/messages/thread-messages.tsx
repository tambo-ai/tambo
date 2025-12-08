import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { type RouterOutputs } from "@/trpc/react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { FC, ReactNode, useCallback, useMemo, useState } from "react";
import { isSameDay } from "../utils";
import { ComponentMessage } from "./component-message";
import { DateSeparator } from "./date-separator";
import { MessageContent } from "./message-content";
import { ToolCallMessage } from "./tool-call-message";

type ThreadType = RouterOutputs["thread"]["getThread"];
type MessageType = ThreadType["messages"][0];

type MessageGroup = {
  type: "message" | "tool_call" | "component";
  message: MessageType;
  toolResponse?: MessageType;
};

// Helper function to determine alignment classes
const getAlignmentClasses = (
  groupType: MessageGroup["type"],
  isUserMessage: boolean,
): string => {
  if (groupType === "tool_call" || groupType === "component") {
    return "items-start";
  }
  return isUserMessage ? "items-end" : "items-start";
};

// Helper function to generate message key
const getMessageKey = (group: MessageGroup): string => {
  if (group.type === "tool_call") {
    return `tool-${group.message.id}`;
  }
  if (group.type === "component") {
    return `component-${group.message.id}`;
  }
  return `msg-${group.message.id}`;
};

// Helper function to get container classes
const getContainerClasses = (
  group: MessageGroup,
  isUserMessage: boolean,
  searchQuery?: string,
  hasMatch?: boolean,
  isCurrentMatch?: boolean,
): string => {
  return cn(
    "group flex flex-col relative transition-all duration-300",
    getAlignmentClasses(group.type, isUserMessage),
    // apply opacity to non-matching messages when searching
    searchQuery && !hasMatch && "opacity-40",
    // highlight current match
    isCurrentMatch && "ring-2 ring-yellow-400 rounded-lg p-2",
  );
};

// Subcomponent to render individual message content
interface MessageRendererProps {
  group: MessageGroup;
  isUserMessage: boolean;
  isHighlighted: boolean;
  searchQuery?: string;
}

const MessageRenderer: FC<MessageRendererProps> = ({
  group,
  isUserMessage,
  isHighlighted,
  searchQuery,
}) => {
  if (group.type === "tool_call") {
    return (
      <ToolCallMessage
        message={group.message}
        toolResponse={group.toolResponse}
        isHighlighted={isHighlighted}
        searchQuery={searchQuery}
      />
    );
  }

  if (group.type === "component") {
    return (
      <ComponentMessage
        message={group.message}
        isHighlighted={isHighlighted}
        searchQuery={searchQuery}
      />
    );
  }

  return (
    <MessageContent
      message={group.message}
      isUserMessage={isUserMessage}
      isHighlighted={isHighlighted}
      searchQuery={searchQuery}
    />
  );
};

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
  // Track which parent groups are open (default to false/collapsed)
  const [openParentGroups, setOpenParentGroups] = useState<
    Record<string, boolean>
  >({});

  // Track if system message is collapsed (default to false/collapsed)
  const [isSystemMessageCollapsed, setIsSystemMessageCollapsed] =
    useState(true);

  // Toggle a parent group's open/closed state
  const toggleParentGroup = useCallback((parentId: string) => {
    setOpenParentGroups((prev) => ({
      ...prev,
      [parentId]: !prev[parentId],
    }));
  }, []);

  // Toggle system message collapse state
  const toggleSystemMessage = useCallback(() => {
    setIsSystemMessageCollapsed((prev) => !prev);
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
    const groups: MessageGroup[] = [];

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

  // Group sequential messages by parentMessageId
  const parentGroupedMessages = useMemo(() => {
    const grouped: Array<{
      parentMessageId: string | null;
      groups: MessageGroup[];
    }> = [];

    let currentParentId: string | null = null;
    let currentGroupSet: MessageGroup[] = [];

    messageGroups.forEach((group) => {
      const parentId = group.message.parentMessageId ?? null;

      if (parentId && parentId === currentParentId) {
        // Same parent as previous, add to current group
        currentGroupSet.push(group);
      } else {
        // Different parent (or no parent), save previous group and start new one
        if (currentGroupSet.length > 0) {
          grouped.push({
            parentMessageId: currentParentId,
            groups: currentGroupSet,
          });
        }
        currentParentId = parentId;
        currentGroupSet = [group];
      }
    });

    // Don't forget the last group
    if (currentGroupSet.length > 0) {
      grouped.push({
        parentMessageId: currentParentId,
        groups: currentGroupSet,
      });
    }

    return grouped;
  }, [messageGroups]);

  // highlight matches in messages
  const elementsWithDateSeparators = useMemo(() => {
    const elements: ReactNode[] = [];

    parentGroupedMessages.forEach((parentGroup, parentGroupIndex) => {
      const shouldWrapInContainer = !!parentGroup.parentMessageId;
      const containerElements: ReactNode[] = [];

      parentGroup.groups.forEach((group, index) => {
        const message = group.message;
        const prevMessage =
          index > 0
            ? parentGroup.groups[index - 1].message
            : parentGroupIndex > 0
              ? parentGroupedMessages[parentGroupIndex - 1].groups[
                  parentGroupedMessages[parentGroupIndex - 1].groups.length - 1
                ].message
              : null;

        // Add date separator if this is the first message or if the date changed
        if (
          !prevMessage ||
          !isSameDay(prevMessage.createdAt, message.createdAt)
        ) {
          const separator = (
            <DateSeparator
              key={`date-${message.createdAt}`}
              date={message.createdAt}
            />
          );
          if (shouldWrapInContainer) {
            containerElements.push(separator);
          } else {
            elements.push(separator);
          }
        }

        const isUserMessage = message.role === "user";
        const isHighlighted = highlightedMessageId === message.id;
        const isCurrentMatch = currentMatchMessageId === message.id;
        const hasMatch = hasSearchMatch(message.id);
        const key = getMessageKey(group);

        // Check if this is the first system message in the thread
        const isFirstSystemMessage =
          message.role === "system" && message.id === thread.messages[0]?.id;

        const messageElement = (
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
            className={getContainerClasses(
              group,
              isUserMessage,
              searchQuery,
              hasMatch,
              isCurrentMatch,
            )}
          >
            {isFirstSystemMessage ? (
              <Collapsible
                open={!isSystemMessageCollapsed}
                onOpenChange={toggleSystemMessage}
              >
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-4">
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full">
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          !isSystemMessageCollapsed && "rotate-180",
                        )}
                      />
                      System prompt (click to expand)
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                    <MessageRenderer
                      group={group}
                      isUserMessage={isUserMessage}
                      isHighlighted={isHighlighted}
                      searchQuery={searchQuery}
                    />
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ) : (
              <MessageRenderer
                group={group}
                isUserMessage={isUserMessage}
                isHighlighted={isHighlighted}
                searchQuery={searchQuery}
              />
            )}
          </motion.div>
        );

        if (shouldWrapInContainer) {
          containerElements.push(messageElement);
        } else {
          elements.push(messageElement);
        }
      });

      // Wrap messages with same parentMessageId in a collapsible container
      if (shouldWrapInContainer && containerElements.length > 0) {
        const parentId = parentGroup.parentMessageId!;
        const isOpen = openParentGroups[parentId] ?? false;

        elements.push(
          <Collapsible
            key={`parent-${parentId}`}
            open={isOpen}
            onOpenChange={() => toggleParentGroup(parentId)}
          >
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-4">
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full">
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      isOpen && "rotate-180",
                    )}
                  />
                  Child messages
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4">
                {containerElements}
              </CollapsibleContent>
            </div>
          </Collapsible>,
        );
      }
    });

    return elements;
  }, [
    parentGroupedMessages,
    highlightedMessageId,
    currentMatchMessageId,
    messageRefs,
    searchQuery,
    hasSearchMatch,
    openParentGroups,
    toggleParentGroup,
    isSystemMessageCollapsed,
    toggleSystemMessage,
    thread.messages,
  ]);

  return (
    <div className="space-y-6 pb-4 px-2">
      <AnimatePresence initial={false}>
        {elementsWithDateSeparators}
      </AnimatePresence>
    </div>
  );
}
