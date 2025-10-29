"use client";

import { cn } from "@/lib/utils";
import { useTambo } from "@tambo-ai/react";
import { VariantProps } from "class-variance-authority";
import { Dialog } from "radix-ui";
import * as React from "react";
import { messageVariants } from "./message";
import {
  MessageInput,
  MessageInputError,
  MessageInputSubmitButton,
  MessageInputTextarea,
  MessageInputToolbar,
} from "./message-input";
import { ScrollableMessageContainer } from "./scrollable-message-container";
import { ThreadContent, ThreadContentMessages } from "./thread-content";

/**
 * Props for the DemoControlBar component
 */
interface DemoControlBarProps extends React.HTMLAttributes<HTMLDivElement> {
  contextKey?: string;
  hotkey?: string;
  variant?: VariantProps<typeof messageVariants>["variant"];
}

/**
 * Demo component for the control bar which is custom built for the showcase and not part of the library, but looks like the real thing.
 * @param className - The className of the component.
 * @param contextKey - The context key of the component. Default is "control-bar".
 * @param hotkey - The hotkey of the component. Default is "mod+k".
 * @param variant - The variant of the component. Default is "default".
 */
export const DemoControlBar = React.forwardRef<
  HTMLDivElement,
  DemoControlBarProps
>(({ className, contextKey, hotkey = "mod+k", variant, ...props }, ref) => {
  const [open, setOpen] = React.useState(false);
  const [containerRef, setContainerRef] = React.useState<HTMLDivElement | null>(
    null,
  );
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
    <div ref={setContainerRef} className="absolute inset-0">
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <button className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent/50 transition-colors shadow-lg z-10">
            Talk to AI (
            <span suppressHydrationWarning>
              {hotkey.replace("mod", isMac ? "⌘" : "Ctrl")}
            </span>
            )
          </button>
        </Dialog.Trigger>
        {containerRef && (
          <Dialog.Portal container={containerRef}>
            <Dialog.Overlay className="absolute inset-0 bg-black/40 z-40" />
            <Dialog.Content
              ref={ref}
              className={cn(
                "absolute top-1/4 left-1/2 -translate-x-1/2 w-[440px] max-w-[calc(100%-2rem)] rounded-lg shadow-lg transition-all duration-200 outline-none z-50",
                className,
              )}
              {...props}
            >
              <Dialog.Title className="sr-only">Control Bar</Dialog.Title>
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
                  <ScrollableMessageContainer className="bg-background border rounded-lg p-4 max-h-[300px]">
                    <ThreadContent variant={variant}>
                      <ThreadContentMessages />
                    </ThreadContent>
                  </ScrollableMessageContainer>
                )}
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </Dialog.Root>
    </div>
  );
});
DemoControlBar.displayName = "DemoControlBar";
