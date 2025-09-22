"use client";

import type { messageVariants } from "@/components/ui/message";
import {
  MessageInput,
  MessageInputError,
  MessageInputSubmitButton,
  MessageInputTextarea,
  MessageInputToolbar,
} from "@/components/ui/message-input";
import { ScrollableMessageContainer } from "@/components/ui/scrollable-message-container";
import {
  ThreadContent,
  ThreadContentMessages,
} from "@/components/ui/thread-content";
import { cn } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import { useTambo } from "@tambo-ai/react";
import type { VariantProps } from "class-variance-authority";
import * as React from "react";

/** Compound API: Root wraps the dialog, Trigger renders asChild, Content holds the body */
export interface ControlBarRootProps
  extends React.HTMLAttributes<HTMLDivElement> {
  contextKey?: string;
  hotkey?: string;
  variant?: VariantProps<typeof messageVariants>["variant"];
}

/**
 * A floating control bar component for quick access to chat functionality
 * @component
 * @example
 * ```tsx
 * <ControlBar
 *   contextKey="my-thread"
 *   hotkey="mod+k"
 *   className="custom-styles"
 * />
 * ```
 */
export const ControlBarRoot = React.forwardRef<
  HTMLDivElement,
  ControlBarRootProps
>(
  (
    {
      className: _className,
      contextKey: _contextKey,
      hotkey = "mod+k",
      variant: _variant,
      children,
      ..._props
    },
    _ref,
  ) => {
    const [open, setOpen] = React.useState(false);

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
        {children}
      </Dialog.Root>
    );
  },
);
ControlBarRoot.displayName = "ControlBar.Root";

export const ControlBarTrigger = Dialog.Trigger;

export const ControlBarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Dialog.Content> & {
    contextKey?: string;
    variant?: VariantProps<typeof messageVariants>["variant"];
  }
>(({ className, contextKey, variant, children, ...props }, ref) => {
  const { thread } = useTambo();
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/40" />
      <Dialog.Content
        ref={ref}
        className={cn(
          "mx-auto my-24 w-[440px] rounded-lg shadow-lg transition-all duration-200 outline-none",
          className,
        )}
        {...props}
      >
        <Dialog.Title className="sr-only">Control Bar</Dialog.Title>
        {children ?? (
          <div className="flex flex-col gap-3">
            <div className="bg-background border rounded-lg p-3 flex items-center justify-between gap-4">
              <div className="flex-1">
                <MessageInput contextKey={contextKey}>
                  <MessageInputTextarea />
                  <MessageInputToolbar>
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
        )}
      </Dialog.Content>
    </Dialog.Portal>
  );
});
ControlBarContent.displayName = "ControlBar.Content";
