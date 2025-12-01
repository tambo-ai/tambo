import { ThreadMessagesModalSkeleton } from "@/components/skeletons/observability-skeletons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getSafeContent } from "@/lib/thread-hooks";
import { cn } from "@/lib/utils";
import { RouterOutputs } from "@/trpc/react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  calculateThreadStats,
  createMessageItems,
  formatToolParameters,
  formatToolResponseContent,
} from "../utils";
import { StatsHeader } from "./stats-header";
import { ThreadMessages } from "./thread-messages";

type ThreadType = RouterOutputs["thread"]["getThread"];
type MessageType = ThreadType["messages"][0];

interface ThreadMessagesModalProps {
  thread: ThreadType;
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
}

// Helper function to search in all content types
function searchInMessage(message: MessageType, query: string): boolean {
  const lowerQuery = query.toLowerCase();

  // Search in message content
  const safeContent = getSafeContent(message.content as any);
  const textContent = typeof safeContent === "string" ? safeContent : "";
  if (textContent.toLowerCase().includes(lowerQuery)) return true;

  // Search in tool call arguments
  if (message.toolCallRequest?.parameters) {
    const formattedParams = formatToolParameters(
      message.toolCallRequest.parameters as {
        parameterName: string;
        parameterValue: string;
      }[],
    );
    if (formattedParams.toLowerCase().includes(lowerQuery)) return true;
  }

  // Search in component props
  if (message.componentDecision?.props) {
    const propsStr = JSON.stringify(message.componentDecision.props, null, 2);
    if (propsStr.toLowerCase().includes(lowerQuery)) return true;
  }

  // Search in additional context
  if (
    message.role === "user" && // only search in user messages since we don't have context for assistant messages
    message.additionalContext &&
    Object.keys(message.additionalContext).length > 0
  ) {
    const contextStr = JSON.stringify(message.additionalContext, null, 2);
    if (contextStr.toLowerCase().includes(lowerQuery)) return true;
  }

  return false;
}

// Helper function to find all matches across messages
interface SearchMatch {
  messageId: string;
  messageType: "message" | "tool_call" | "component";
  contentType:
    | "content"
    | "toolArgs"
    | "toolResponse"
    | "componentProps"
    | "additionalContext";
}

function findAllMatches(thread: ThreadType, query: string): SearchMatch[] {
  if (!query.trim()) return [];

  const matches: SearchMatch[] = [];
  const messages = thread.messages || [];

  messages.forEach((message) => {
    // Skip tool responses that are handled with their requests
    if (message.role === "tool") return;

    // Check message content
    if (searchInMessage(message, query)) {
      matches.push({
        messageId: message.id,
        messageType: "message",
        contentType: "content",
      });
    }

    // Check additional context
    if (
      message.role === "user" && // only search in user messages since we don't have context for assistant messages
      message.additionalContext &&
      Object.keys(message.additionalContext).length > 0
    ) {
      const contextStr = JSON.stringify(message.additionalContext, null, 2);
      if (contextStr.toLowerCase().includes(query.toLowerCase())) {
        matches.push({
          messageId: message.id,
          messageType: "message",
          contentType: "additionalContext",
        });
      }
    }

    // Check tool calls
    if (message.toolCallRequest) {
      const formattedParams = formatToolParameters(
        message.toolCallRequest.parameters as {
          parameterName: string;
          parameterValue: string;
        }[],
      );
      if (formattedParams.toLowerCase().includes(query.toLowerCase())) {
        matches.push({
          messageId: message.id,
          messageType: "tool_call",
          contentType: "toolArgs",
        });
      }

      // Check tool response
      const toolResponse = messages.find(
        (msg) => msg.role === "tool" && msg.toolCallId === message.toolCallId,
      );

      if (toolResponse) {
        const formattedResponse = formatToolResponseContent(
          toolResponse.content,
        );
        if (formattedResponse.toLowerCase().includes(query.toLowerCase())) {
          matches.push({
            messageId: message.id,
            messageType: "tool_call",
            contentType: "toolResponse",
          });
        }
      }
    }

    // Check component decisions
    if (message.componentDecision?.componentName) {
      const propsStr = JSON.stringify(message.componentDecision.props, null, 2);
      if (propsStr.toLowerCase().includes(query.toLowerCase())) {
        matches.push({
          messageId: message.id,
          messageType: "component",
          contentType: "componentProps",
        });
      }
    }
  });

  return matches;
}

export function ThreadMessagesModal({
  thread,
  isOpen,
  onClose,
  isLoading = false,
}: Readonly<ThreadMessagesModalProps>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    string | null
  >(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const messageRefs = useRef<Record<string, HTMLDivElement>>({});

  // Find all search matches
  const searchMatches = useMemo(
    () => findAllMatches(thread, searchQuery),
    [thread, searchQuery],
  );

  const totalMatches = searchMatches.length;
  const hasMatches = totalMatches > 0;

  // Get current match info
  const currentMatch = hasMatches ? searchMatches[currentMatchIndex] : null;

  // Stats based on all messages (not filtered)
  const stats = useMemo(
    () => calculateThreadStats(thread.messages || []),
    [thread.messages],
  );

  const { messageItems, componentItems, errorItems, toolItems } = useMemo(
    () => createMessageItems(thread.messages || []),
    [thread.messages],
  );

  const scrollToMessage = useCallback((messageId: string) => {
    const element = messageRefs.current[messageId];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(messageId);
      setTimeout(() => setHighlightedMessageId(null), 3000);
    }
  }, []);

  // Navigate to current match
  useEffect(() => {
    if (currentMatch) {
      scrollToMessage(currentMatch.messageId);
    }
  }, [currentMatch, scrollToMessage]);

  // Reset match index when search changes
  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchQuery]);

  const handlePreviousMatch = useCallback(() => {
    if (hasMatches) {
      setCurrentMatchIndex((prev) => (prev > 0 ? prev - 1 : totalMatches - 1));
    }
  }, [hasMatches, totalMatches]);

  const handleNextMatch = useCallback(() => {
    if (hasMatches) {
      setCurrentMatchIndex((prev) => (prev < totalMatches - 1 ? prev + 1 : 0));
    }
  }, [hasMatches, totalMatches]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setIsScrolled(scrollTop > 20);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!searchQuery) return;

      if (e.key === "Enter") {
        if (e.shiftKey) {
          handlePreviousMatch();
        } else {
          handleNextMatch();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchQuery, handleNextMatch, handlePreviousMatch]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-6xl h-[90vh] p-4 sm:p-6 flex flex-col gap-4">
        {isLoading ? (
          <ThreadMessagesModalSkeleton />
        ) : (
          <>
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="text-left text-primary text-base sm:text-lg truncate">
                Thread {thread.id}
              </DialogTitle>
              <DialogDescription className="sr-only">
                View messages and details for thread {thread.id}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-1 flex-shrink-0">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground" />
                  <Input
                    placeholder="Search messages, tools, components..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 text-primary text-sm sm:text-base"
                  />
                </div>

                {/* Search navigation controls */}
                {searchQuery && (
                  <div className="flex items-center gap-1">
                    {hasMatches && (
                      <span className="text-xs text-muted-foreground px-2">
                        {currentMatchIndex + 1} / {totalMatches}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handlePreviousMatch}
                      disabled={!hasMatches}
                      className="h-8 w-8"
                      title="Previous match (Shift+Enter)"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleNextMatch}
                      disabled={!hasMatches}
                      className="h-8 w-8"
                      title="Next match (Enter)"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {searchQuery && !hasMatches && (
                <p className="text-sm text-muted-foreground">
                  No matches found for &quot;{searchQuery}&quot;
                </p>
              )}
            </div>

            {/* Normal header */}
            <div
              className={cn(
                "flex-shrink-0 transition-all duration-200",
                isScrolled && "hidden",
              )}
            >
              <StatsHeader
                stats={stats}
                messageItems={messageItems}
                componentItems={componentItems}
                errorItems={errorItems}
                toolItems={toolItems}
                onScrollToMessage={scrollToMessage}
              />
            </div>

            {/* Scrollable content area */}
            <div
              onScroll={handleScroll}
              className="flex-1 min-h-0 overflow-y-auto relative [&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar-track]:hidden [&::-webkit-scrollbar-thumb]:hidden"
            >
              {/* Sticky condensed header */}
              {isScrolled && (
                <div className="sticky top-0 z-20">
                  <StatsHeader
                    stats={stats}
                    messageItems={messageItems}
                    componentItems={componentItems}
                    errorItems={errorItems}
                    toolItems={toolItems}
                    onScrollToMessage={scrollToMessage}
                    isCondensed
                  />
                </div>
              )}

              <ThreadMessages
                thread={thread}
                searchQuery={searchQuery}
                messageRefs={messageRefs}
                highlightedMessageId={highlightedMessageId}
                currentMatchMessageId={currentMatch?.messageId}
                searchMatches={searchMatches}
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
