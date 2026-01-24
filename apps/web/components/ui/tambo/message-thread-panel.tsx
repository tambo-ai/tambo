"use client";

import { MessageInputTextareaWithInteractables } from "@/components/ui/tambo/message-input-with-interactables";
import { registerAllTools } from "@/lib/tambo/tools/tool-registry";
import { cn } from "@/lib/utils";
import { useMessageThreadPanel } from "@/providers/message-thread-panel-provider";
import { api, useTRPCClient } from "@/trpc/react";
import {
  useTambo,
  type Suggestion,
  type TamboThreadMessage,
} from "@tambo-ai/react";
import type { messageVariants } from "@tambo-ai/ui-registry/components/message";
import {
  Message,
  MessageContent,
} from "@tambo-ai/ui-registry/components/message";
import type { TamboEditor } from "@tambo-ai/ui-registry/components/message-input";
import {
  MessageInput,
  MessageInputContexts,
  MessageInputError,
  MessageInputFileButton,
  MessageInputSubmitButton,
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
import { ThreadDropdown } from "@tambo-ai/ui-registry/components/thread-dropdown";
import type { VariantProps } from "class-variance-authority";
import { XIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import * as React from "react";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";

/**
 * Props for the MessageThreadPanel component
 * @interface
 */
export interface MessageThreadPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Controls the visual styling of messages in the thread.
   * Possible values include: "default", "compact", etc.
   * These values are defined in messageVariants from "@/components/tambo/message".
   * @example variant="compact"
   */
  variant?: VariantProps<typeof messageVariants>["variant"];
}

/**
 * Props for the ResizablePanel component
 */
interface ResizablePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Children elements to render inside the container */
  children: React.ReactNode;
  /** Whether the panel should be open (affects width animation) */
  isOpen?: boolean;
}

/**
 * A resizable panel component with a draggable divider
 */
const ResizablePanel = forwardRef<HTMLDivElement, ResizablePanelProps>(
  ({ className, children, isOpen = true, ...props }, ref) => {
    const [width, setWidth] = useState(isOpen ? 400 : 0);
    const isResizing = useRef(false);
    const lastUpdateRef = useRef(0);

    // Animate width when isOpen changes
    useEffect(() => {
      if (isOpen) {
        // When opening, animate from 0 to 400
        setWidth(400);
      } else {
        // When closing, animate to 0
        setWidth(0);
      }
    }, [isOpen]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
      if (!isResizing.current) return;

      const now = Date.now();
      if (now - lastUpdateRef.current < 16) return;
      lastUpdateRef.current = now;

      const windowWidth = window.innerWidth;

      requestAnimationFrame(() => {
        const newWidth = Math.round(windowWidth - e.clientX);

        // Ensure minimum width of 300px
        const clampedWidth = Math.max(
          300,
          Math.min(windowWidth - 300, newWidth),
        );
        setWidth(clampedWidth);

        document.documentElement.style.setProperty(
          "--panel-right-width",
          `${clampedWidth}px`,
        );
      });
    }, []);

    return (
      <div
        ref={ref}
        className={cn(
          "h-full flex flex-col bg-background relative",
          !isResizing.current && "transition-[width] duration-300 ease-in-out",
          "overflow-x-auto border-l border-border",
          className,
        )}
        style={{
          width: `${width}px`,
          maxWidth: "600px",
          flexShrink: 0,
        }}
        {...props}
      >
        {/* Resize handle on the left */}
        <div
          className="absolute top-0 bottom-0 left-0 w-1 cursor-ew-resize hover:bg-gray-300 transition-colors z-50"
          onMouseDown={(e) => {
            e.preventDefault();
            isResizing.current = true;
            document.body.style.cursor = "ew-resize";
            document.body.style.userSelect = "none";
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener(
              "mouseup",
              () => {
                isResizing.current = false;
                document.body.style.cursor = "";
                document.body.style.userSelect = "";
                document.removeEventListener("mousemove", handleMouseMove);
              },
              { once: true },
            );
          }}
        />
        {children}
      </div>
    );
  },
);
ResizablePanel.displayName = "ResizablePanel";

/**
 * A resizable panel component that displays a chat thread with message history, input, and suggestions.
 * Always positioned on the right side of the screen.
 * @component
 * @example
 * ```tsx
 * <MessageThreadPanel />
 * ```
 */
export const MessageThreadPanel = forwardRef<
  HTMLDivElement,
  MessageThreadPanelProps
>(({ className, variant, ...props }, ref) => {
  const { registerTool } = useTambo();
  const trpcClient = useTRPCClient();
  const utils = api.useUtils();

  /**
   * Registers all tambo tools with the thread.
   * This effect runs once when the component mounts and registers tools for tambo
   * which lets tambo use the tools to interact with the tambo dashboard.
   */
  useEffect(() => {
    registerAllTools(registerTool, { trpcClient, utils });
  }, [registerTool, trpcClient, utils]);

  const { data: session } = useSession();
  const isUserLoggedIn = !!session;
  const { thread } = useTambo();
  const {
    isOpen,
    setIsOpen,
    editorRef: providerEditorRef,
  } = useMessageThreadPanel();
  const editorRef = useRef<TamboEditor | null>(null);

  // Sync local editorRef with provider's editorRef whenever it changes
  useEffect(() => {
    providerEditorRef.current = editorRef.current;
  });

  // Update CSS variable and focus editor when panel opens/closes
  useEffect(() => {
    if (isOpen) {
      // Set the panel width CSS variable for layout adjustments
      document.documentElement.style.setProperty(
        "--panel-right-width",
        "400px",
      );

      // Small delay to ensure the panel has finished animating before focusing
      const timeoutId = setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.focus();
        }
      }, 320); // Slightly longer than the animation duration

      return () => clearTimeout(timeoutId);
    } else {
      // Reset the panel width CSS variable when closed
      document.documentElement.style.setProperty("--panel-right-width", "0px");
    }
  }, [isOpen]);

  // Add keyboard shortcut Cmd/Ctrl + K to toggle panel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault(); // Prevent default browser behavior
        setIsOpen(!isOpen);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setIsOpen, isOpen]);

  /**
   * Configuration for the MessageThreadPanel component
   */
  const THREAD_CONFIG = {
    labels: {
      openState: "ask tambo",
    },
  };

  // Starter message for when the thread is empty
  const starterMessage: TamboThreadMessage = {
    id: "starter-login-prompt",
    role: "assistant",
    content: [
      { type: "text", text: "Please log in to ask tambo about your projects." },
    ],
    createdAt: new Date().toISOString(),
    actionType: undefined,
    componentState: {},
    threadId: "",
  };

  const defaultSuggestions: Suggestion[] = [
    {
      id: "suggestion-1",
      title: "View Project Details",
      detailedSuggestion: "How can I see the details of one of my projects?",
      messageId: "view-project-details-query",
    },
    {
      id: "suggestion-2",
      title: "Generate API Key",
      detailedSuggestion:
        "How do I create a new API key for one of my projects?",
      messageId: "generate-apikey-query",
    },
    {
      id: "suggestion-3",
      title: "Modify Project Config",
      detailedSuggestion:
        "How can I change the configuration or settings for one of my projects?",
      messageId: "modify-project-config-query",
    },
  ];

  return (
    <ResizablePanel ref={ref} className={className} isOpen={isOpen} {...props}>
      {/* Header */}
      <div className="flex items-center justify-between w-full p-4 border-b border-gray-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <span>{THREAD_CONFIG.labels.openState}</span>
        </div>
        <div className="flex items-center gap-2">
          <ThreadDropdown className="components-theme" />
          <div
            role="button"
            className="p-1 rounded-full hover:bg-muted/70 transition-colors cursor-pointer"
            onClick={() => setIsOpen(false)}
            aria-label="Close"
          >
            <XIcon className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-1 min-h-0 transition-all duration-300 ease-in-out">
        {/* Message thread content */}
        <ScrollableMessageContainer className="p-4 flex-1">
          {/* Conditionally render the starter message */}
          {!isUserLoggedIn && thread.messages.length === 0 && (
            <Message role="assistant" message={starterMessage}>
              <MessageContent />
            </Message>
          )}

          <ThreadContent variant={variant}>
            <ThreadContentMessages />
          </ThreadContent>
        </ScrollableMessageContainer>

        {/* Message Suggestions Status */}
        <MessageSuggestions>
          <MessageSuggestionsStatus />
        </MessageSuggestions>

        {/* Message input */}
        <div className="p-4 flex-shrink-0">
          <MessageInput inputRef={editorRef}>
            <MessageInputContexts />
            <MessageInputTextareaWithInteractables placeholder="Type your message or paste images..." />
            <MessageInputToolbar>
              <MessageInputFileButton />
              {/* Uncomment this to enable client-side MCP config modal button */}
              {/* <MessageInputMcpConfigButton /> */}
              <MessageInputSubmitButton />
            </MessageInputToolbar>
            <MessageInputError />
          </MessageInput>
        </div>

        {/* Message suggestions */}
        <MessageSuggestions initialSuggestions={defaultSuggestions}>
          <MessageSuggestionsList className="flex-shrink-0" />
        </MessageSuggestions>
      </div>
    </ResizablePanel>
  );
});
MessageThreadPanel.displayName = "MessageThreadPanel";
