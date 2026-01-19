"use client";

import * as React from "react";
import { Dialog } from "radix-ui";
import { useTambo } from "@tambo-ai/react";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";
import type { messageVariants } from "@/components/tambo/message";
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
} from "@/components/tambo/message-input";
import {
  ThreadContent,
  ThreadContentMessages,
} from "@/components/tambo/thread-content";
import { ScrollableMessageContainer } from "@/components/tambo/scrollable-message-container";

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
   * These values are defined in messageVariants from "@/components/tambo/message".
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
    const [open, setOpen] = React.useState(false);
    const isMac =
      typeof navigator !== "undefined" && navigator.platform.startsWith("Mac");
    const { thread } = useTambo();

    React.useEffect(() => {
      const down = (e: KeyboardEvent) => {
        const [modifier, key] = hotkey.split("+");
        const isModifierPressed =
          modifier === "mod" ? e.metaKey || e.ctrlKey : false;
        if (e.key === key && isModifierPressed) {
          e.preventDefault();
          setOpen((open) => !open);
        }
      };
      document.addEventListener("keydown", down);
      return () => document.removeEventListener("keydown", down);
    }, [hotkey, setOpen]);

    return (
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <button className="fixed bottom-4 right-4 bg-background/50 backdrop-blur-sm border rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent/50 transition-colors">
            Talk to AI (
            <span suppressHydrationWarning>
              {hotkey.replace("mod", isMac ? "⌘" : "Ctrl")}
            </span>
            )
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40" />
          <Dialog.Content
            ref={ref}
            className={cn(
              "fixed top-1/4 left-1/2 -translate-x-1/2 w-[440px] rounded-lg shadow-lg transition-all duration-200 outline-none",
              className,
            )}
            {...props}
          >
            <Dialog.Title className="sr-only">Control Bar</Dialog.Title>
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
              {thread?.messages?.length > 0 && (
                <ScrollableMessageContainer className="bg-background border rounded-lg p-4 max-h-[500px]">
                  <ThreadContent variant={variant}>
                    <ThreadContentMessages />
                  </ThreadContent>
                </ScrollableMessageContainer>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  },
);
ControlBar.displayName = "ControlBar";
