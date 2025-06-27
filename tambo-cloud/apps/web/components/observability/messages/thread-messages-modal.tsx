import { ThreadMessagesModalSkeleton } from "@/components/skeletons/observability-skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getSafeContent } from "@/lib/thread-hooks";
import { RouterOutputs } from "@/trpc/react";
import { Search, X } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { calculateThreadStats, createMessageItems } from "../utils";
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

export function ThreadMessagesModal({
  thread,
  isOpen,
  onClose,
  isLoading = false,
}: Readonly<ThreadMessagesModalProps>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    string | null
  >(null);
  const messageRefs = useRef<Record<string, HTMLDivElement>>({});

  const filteredMessages = useMemo(() => {
    const messages = thread.messages || [];
    let filtered = messages;

    if (searchQuery) {
      filtered = filtered.filter((msg: MessageType) => {
        const safeContent = getSafeContent(msg.content as any);
        const textContent = typeof safeContent === "string" ? safeContent : "";
        return textContent.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    return filtered;
  }, [thread.messages, searchQuery]);

  const stats = useMemo(
    () => calculateThreadStats(filteredMessages),
    [filteredMessages],
  );

  const { messageItems, componentItems, errorItems, toolItems } = useMemo(
    () => createMessageItems(filteredMessages),
    [filteredMessages],
  );

  const scrollToMessage = useCallback((messageId: string) => {
    const element = messageRefs.current[messageId];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(messageId);
      setTimeout(() => setHighlightedMessageId(null), 3000);
    }
  }, []);

  const toggleSection = useCallback((section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:w-3/4 max-w-full sm:max-w-4xl p-4 sm:p-6 [&>button]:hidden flex flex-col gap-4"
      >
        {isLoading ? (
          <ThreadMessagesModalSkeleton />
        ) : (
          <>
            <SheetHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-left text-primary text-base sm:text-lg truncate">
                  Thread {thread.id}
                </SheetTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="hover:bg-transparent flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
              <SheetDescription className="sr-only">
                View messages and details for thread {thread.id}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 mt-1 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground" />
                <Input
                  placeholder="Search chat log..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-primary text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="flex-shrink-0">
              <StatsHeader
                stats={stats}
                messageItems={messageItems}
                componentItems={componentItems}
                errorItems={errorItems}
                toolItems={toolItems}
                openSections={openSections}
                onToggleSection={toggleSection}
                onScrollToMessage={scrollToMessage}
              />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar-track]:hidden [&::-webkit-scrollbar-thumb]:hidden">
              <ThreadMessages
                thread={thread}
                searchQuery={searchQuery}
                messageRefs={messageRefs}
                highlightedMessageId={highlightedMessageId}
              />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
