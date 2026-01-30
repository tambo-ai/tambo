"use client";

import type { messageVariants } from "@/components/tambo/message";
import {
  MessageInput,
  MessageInputError,
  MessageInputFileButton,
  MessageInputMcpPromptButton,
  MessageInputMcpResourceButton,
  MessageInputSubmitButton,
  MessageInputTextarea,
  MessageInputToolbar,
  MessageInputMcpConfigButton,
} from "@/components/tambo/message-input";
import {
  MessageSuggestions,
  MessageSuggestionsList,
  MessageSuggestionsStatus,
} from "@/components/tambo/message-suggestions";
import { ScrollableMessageContainer } from "@/components/tambo/scrollable-message-container";
import { ThreadContainer, useThreadContainerContext } from "./thread-container";
import {
  ThreadContent,
  ThreadContentMessages,
} from "@/components/tambo/thread-content";
import {
  ThreadHistory,
  ThreadHistoryHeader,
  ThreadHistoryList,
  ThreadHistoryNewButton,
  ThreadHistorySearch,
} from "@/components/tambo/thread-history";
import { useMergeRefs } from "@/lib/thread-hooks";
import type { Suggestion } from "@tambo-ai/react";
import type { VariantProps } from "class-variance-authority";
import * as React from "react";
import { GenerationStage, useTambo } from "@tambo-ai/react";

export interface MessageThreadFullProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: VariantProps<typeof messageVariants>["variant"];
}

export const MessageThreadFull = React.forwardRef<
  HTMLDivElement,
  MessageThreadFullProps
>(({ className, variant, ...props }, ref) => {
  const { containerRef, historyPosition } = useThreadContainerContext();
  const mergedRef = useMergeRefs<HTMLDivElement | null>(ref, containerRef);
  const { thread , isIdle} = useTambo();
  const stage = thread?.generationStage ?? GenerationStage.IDLE;
   const isGenerating =
    !isIdle && stage && stage !== GenerationStage.COMPLETE;
  const threadHistorySidebar = (
    <ThreadHistory
      position={historyPosition}
      className="border-r border-border bg-card"
    >
      <ThreadHistoryHeader />
      <ThreadHistoryNewButton />
      <ThreadHistorySearch />
      <ThreadHistoryList />
    </ThreadHistory>
  );

  const defaultSuggestions: Suggestion[] = [
    {
      id: "suggestion-1",
      title: "Get started",
      detailedSuggestion: "What can you help me with?",
      messageId: "welcome-query",
    },
    {
      id: "suggestion-2",
      title: "Capabilities",
      detailedSuggestion: "Describe your core capabilities.",
      messageId: "capabilities-query",
    },
    {
      id: "suggestion-3",
      title: "Examples",
      detailedSuggestion: "Provide example queries.",
      messageId: "examples-query",
    },
  ];

  return (
    <div className="flex h-full w-full bg-background text-foreground">
      {historyPosition === "left" && threadHistorySidebar}

      <ThreadContainer
        ref={mergedRef}
        disableSidebarSpacing
        className={className}
        {...props}
      >
        {/* Messages */}
        <div className="flex-1 relative min-h-0">
        <ScrollableMessageContainer className="p-4">
          <ThreadContent
            variant={variant}
          >
            <ThreadContentMessages />
          </ThreadContent>
        </ScrollableMessageContainer>
        </div>
         {/* Suggestions */}
        <div className="px-6">
      {isGenerating ? (
        /* ───────── GENERATION MODE ───────── */
        <MessageSuggestions>
          <MessageSuggestionsStatus
            className="
              text-xs uppercase tracking-widest
              text-cyan-300
            "
          />
        </MessageSuggestions>
      ) : (
        /* ───────── SUGGESTION MODE ───────── */
        <MessageSuggestions initialSuggestions={defaultSuggestions}>
          <MessageSuggestionsList
            className="
              grid grid-cols-1 md:grid-cols-3 gap-2
            "
          />
        </MessageSuggestions>
      )}
    </div>
        {/* Input */}
        <div className="px-6 pb-6">
          <MessageInput className="border border-border bg-background">
            <MessageInputTextarea
              placeholder="Enter message…"
              className="focus:ring-0"
            />

            <MessageInputToolbar className="mt-2 pt-2 flex items-center gap-2 border-t border-border">
              <MessageInputFileButton />
              <MessageInputMcpPromptButton />
              <MessageInputMcpResourceButton />
              <MessageInputMcpConfigButton />

              <MessageInputSubmitButton
                className="
                  ml-auto
                  border border-primary
                  bg-primary
                  text-primary-foreground
                  hover:opacity-90
                  transition-opacity
                "
              />
            </MessageInputToolbar>

            <MessageInputError />
          </MessageInput>
        </div>
      </ThreadContainer>

      {historyPosition === "right" && threadHistorySidebar}
    </div>
  );
});

MessageThreadFull.displayName = "MessageThreadFull";
