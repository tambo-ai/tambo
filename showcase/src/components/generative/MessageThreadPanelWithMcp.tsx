"use client";

import type { messageVariants } from "@tambo-ai/ui-registry/components/message";
import {
  MessageInput,
  MessageInputError,
  MessageInputFileButton,
  MessageInputSubmitButton,
  MessageInputTextarea,
  MessageInputToolbar,
} from "@tambo-ai/ui-registry/components/message-input";
import {
  MessageSuggestions,
  MessageSuggestionsList,
  MessageSuggestionsStatus,
} from "@tambo-ai/ui-registry/components/message-suggestions";
import { ScrollableMessageContainer } from "@tambo-ai/ui-registry/components/scrollable-message-container";
import {
  ThreadContent,
  ThreadContentMessages,
} from "@tambo-ai/ui-registry/components/thread-content";
import {
  ThreadHistory,
  ThreadHistoryHeader,
  ThreadHistoryList,
  ThreadHistoryNewButton,
  ThreadHistorySearch,
} from "@tambo-ai/ui-registry/components/thread-history";
import {
  useCanvasDetection,
  useMergeRefs,
  usePositioning,
} from "@tambo-ai/ui-registry/lib/thread-hooks";
import { cn } from "@/lib/utils";
import { useTamboThreadInput } from "@tambo-ai/react";
import type { VariantProps } from "class-variance-authority";
import * as React from "react";
import { useRef } from "react";

/**
 * Message Thread Panel with MCP commands integration.
 * This component demonstrates how MCP resources and prompts are automatically
 * integrated into the text editor via the built-in MCP provider system.
 */
export const MessageThreadPanelWithMcp = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: VariantProps<typeof messageVariants>["variant"];
  }
>(({ className, variant, ...props }, forwardedRef) => {
  useTamboThreadInput(); // Keep for dependency tracking
  const editorRef = useRef(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const refs = useMergeRefs(forwardedRef, containerRef);

  const positioning = usePositioning(className);

  useCanvasDetection(containerRef);

  const [width, setWidth] = React.useState(956);
  const isResizing = React.useRef(false);
  const lastUpdateRef = React.useRef(0);

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (!isResizing.current) return;

      const now = Date.now();
      if (now - lastUpdateRef.current < 16) return;
      lastUpdateRef.current = now;

      const windowWidth = window.innerWidth;

      requestAnimationFrame(() => {
        let newWidth;
        if (positioning.isLeftPanel) {
          newWidth = Math.round(e.clientX);
        } else {
          newWidth = Math.round(windowWidth - e.clientX);
        }

        const clampedWidth = Math.max(
          300,
          Math.min(windowWidth - 300, newWidth),
        );
        setWidth(clampedWidth);

        if (positioning.isLeftPanel) {
          document.documentElement.style.setProperty(
            "--panel-left-width",
            `${clampedWidth}px`,
          );
        } else {
          document.documentElement.style.setProperty(
            "--panel-right-width",
            `${clampedWidth}px`,
          );
        }
      });
    },
    [positioning.isLeftPanel],
  );

  const handleMouseUp = React.useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  React.useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={refs}
      className={cn(
        "h-screen flex flex-col bg-background relative",
        "transition-[width] duration-75 ease-out",
        "overflow-x-auto",
        positioning.isLeftPanel
          ? "border-r border-border"
          : "border-l border-border ml-auto",
        className,
      )}
      style={{
        width: `${width}px`,
        flex: "0 0 auto",
      }}
      {...props}
    >
      <div
        className={cn(
          "absolute top-0 bottom-0 w-1 cursor-ew-resize bg-border hover:bg-accent transition-colors z-50",
          positioning.isLeftPanel ? "right-0" : "left-0",
        )}
        onMouseDown={(e) => {
          e.preventDefault();
          isResizing.current = true;
          document.body.style.cursor = "ew-resize";
          document.body.style.userSelect = "none";
        }}
      />

      <ThreadHistory>
        <ThreadHistoryHeader>
          <ThreadHistoryNewButton />
          <ThreadHistorySearch />
        </ThreadHistoryHeader>
        <ThreadHistoryList />
      </ThreadHistory>

      <ScrollableMessageContainer>
        <ThreadContent variant={variant}>
          <ThreadContentMessages />
        </ThreadContent>
      </ScrollableMessageContainer>

      <MessageSuggestions>
        <MessageSuggestionsStatus />
      </MessageSuggestions>

      <div className="p-4">
        <MessageInput inputRef={editorRef}>
          <MessageInputTextarea placeholder="Type your message or paste images..." />
          <MessageInputToolbar>
            <MessageInputFileButton />
            <MessageInputSubmitButton />
          </MessageInputToolbar>
          <MessageInputError />
        </MessageInput>
      </div>

      <MessageSuggestions>
        <MessageSuggestionsList />
      </MessageSuggestions>
    </div>
  );
});

MessageThreadPanelWithMcp.displayName = "MessageThreadPanelWithMcp";
