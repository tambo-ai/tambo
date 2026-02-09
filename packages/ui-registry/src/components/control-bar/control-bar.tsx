"use client";

import * as React from "react";
import {
  ControlBar as ControlBarBase,
  type ControlBarRootRenderProps,
  type ControlBarContentRenderProps,
} from "@tambo-ai/react-ui-base/control-bar";
import { cn } from "@tambo-ai/ui-registry/utils";
import type { VariantProps } from "class-variance-authority";
import type { messageVariants } from "@tambo-ai/ui-registry/components/message";
import {
  MessageInput,
  MessageInputTextarea,
  MessageInputToolbar,
  MessageInputSubmitButton,
  MessageInputError,
  MessageInputFileButton,
  MessageInputMcpPromptButton,
  MessageInputMcpResourceButton,
  // MessageInputMcpConfigButton,
} from "@tambo-ai/ui-registry/components/message-input";
import {
  ThreadContent,
  ThreadContentMessages,
} from "@tambo-ai/ui-registry/components/thread-content";
import { ScrollableMessageContainer } from "@tambo-ai/ui-registry/components/scrollable-message-container";

/**
 * Props for the ControlBar component
 * @interface
 * @extends React.HTMLAttributes<HTMLDivElement>
 */
export interface ControlBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Keyboard shortcut for toggling the control bar (default: "mod+k") */
  hotkey?: string;
  /**
   * Controls the visual styling of messages in the thread.
   * Possible values include: "default", "compact", etc.
   * These values are defined in messageVariants from "@tambo-ai/ui-registry/components/message".
   * @example variant="compact"
   */
  variant?: VariantProps<typeof messageVariants>["variant"];
}

/**
 * A floating control bar component for quick access to chat functionality
 * @component
 * @example
 * ```tsx
 * <ControlBar
 *   hotkey="mod+k"
 *   className="custom-styles"
 * />
 * ```
 */
export const ControlBar = React.forwardRef<HTMLDivElement, ControlBarProps>(
  ({ className, hotkey = "mod+k", variant, ...props }, ref) => {
    return (
      <ControlBarBase.Root hotkey={hotkey}>
        {({ hotkeyDisplay }: ControlBarRootRenderProps) => (
          <>
            <ControlBarBase.Trigger className="fixed bottom-4 right-4 bg-background/50 backdrop-blur-sm border rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent/50 transition-colors">
              Talk to AI (<span suppressHydrationWarning>{hotkeyDisplay}</span>)
            </ControlBarBase.Trigger>
            <ControlBarBase.Portal>
              <ControlBarBase.Overlay className="fixed inset-0 bg-black/40" />
              <ControlBarBase.Content
                ref={ref}
                className={cn(
                  "fixed top-1/4 left-1/2 -translate-x-1/2 w-[440px] rounded-lg shadow-lg transition-all duration-200 outline-none",
                  className,
                )}
                {...props}
              >
                {({ hasMessages }: ControlBarContentRenderProps) => (
                  <>
                    <ControlBarBase.Title className="sr-only">
                      Control Bar
                    </ControlBarBase.Title>
                    <div className="flex flex-col gap-3">
                      <div className="bg-background border rounded-lg p-3 flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <MessageInput>
                            <MessageInputTextarea />
                            <MessageInputToolbar>
                              <MessageInputFileButton />
                              <MessageInputMcpPromptButton />
                              <MessageInputMcpResourceButton />
                              {/* Uncomment this to enable client-side MCP config modal button */}
                              {/* <MessageInputMcpConfigButton /> */}
                              <MessageInputSubmitButton />
                            </MessageInputToolbar>
                            <MessageInputError />
                          </MessageInput>
                        </div>
                      </div>
                      {hasMessages && (
                        <ScrollableMessageContainer className="bg-background border rounded-lg p-4 max-h-[500px]">
                          <ThreadContent variant={variant}>
                            <ThreadContentMessages />
                          </ThreadContent>
                        </ScrollableMessageContainer>
                      )}
                    </div>
                  </>
                )}
              </ControlBarBase.Content>
            </ControlBarBase.Portal>
          </>
        )}
      </ControlBarBase.Root>
    );
  },
);
ControlBar.displayName = "ControlBar";
