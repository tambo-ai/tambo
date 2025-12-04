"use client";

import * as React from "react";
import { useCallback, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { useTamboThreadInput } from "@tambo-ai/react";
import { useMcpCommands } from "@/lib/use-mcp-commands";
import {
  MessageInput,
  MessageInputTextarea,
  MessageInputToolbar,
  MessageInputSubmitButton,
  MessageInputError,
  MessageInputFileButton,
} from "@/components/tambo/message-input";
import {
  MessageSuggestions,
  MessageSuggestionsStatus,
  MessageSuggestionsList,
} from "@/components/tambo/message-suggestions";
import {
  ThreadHistory,
  ThreadHistoryHeader,
  ThreadHistoryNewButton,
  ThreadHistorySearch,
  ThreadHistoryList,
} from "@/components/tambo/thread-history";
import {
  ThreadContent,
  ThreadContentMessages,
} from "@/components/tambo/thread-content";
import type { messageVariants } from "@/components/tambo/message";
import { ScrollableMessageContainer } from "@/components/tambo/scrollable-message-container";
import { cn } from "@/lib/utils";
import {
  useMergeRefs,
  useCanvasDetection,
  usePositioning,
} from "@/lib/thread-hooks";
import type { VariantProps } from "class-variance-authority";

/**
 * Message Thread Panel with MCP commands integration.
 * This is a wrapper around MessageThreadPanel that adds MCP resource and prompt commands.
 */
export const MessageThreadPanelWithMcp = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    contextKey?: string;
    variant?: VariantProps<typeof messageVariants>["variant"];
  }
>(({ className, variant, contextKey, ...props }, forwardedRef) => {
  const { value: editorValue, setValue: setEditorValue } =
    useTamboThreadInput();
  const editorRef = useRef<Editor | null>(null);

  // Callbacks for MCP commands
  const handleInsertResource = useCallback(
    (resourceUri: string) => {
      const editor = editorRef.current;
      if (editor) {
        // Insert the resource URI as a mention in the editor
        editor
          .chain()
          .focus()
          .insertContent([
            {
              type: "mention",
              attrs: { id: resourceUri.slice(1), label: resourceUri.slice(1) },
            },
            { type: "text", text: " " },
          ])
          .run();
        setEditorValue(editor.getText());
      }
    },
    [setEditorValue],
  );

  const handleInsertPrompt = useCallback(
    (promptText: string) => {
      const editor = editorRef.current;
      if (editor) {
        // Replace entire content with prompt text
        editor.commands.setContent(promptText);
        setEditorValue(editor.getText());
        // Focus at the end
        editor.commands.focus("end");
      }
    },
    [setEditorValue],
  );

  // Get MCP commands for the editor
  const mcpCommands = useMcpCommands({
    value: editorValue,
    onInsertResource: handleInsertResource,
    onInsertPrompt: handleInsertPrompt,
  });

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
        <MessageInput contextKey={contextKey} inputRef={editorRef}>
          <MessageInputTextarea
            placeholder="Type your message or paste images..."
            commands={mcpCommands}
          />
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
