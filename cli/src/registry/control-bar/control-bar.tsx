"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import { ChatThread } from "@/components/ui/chat-thread";
import { ChatInput } from "@/components/ui/chat-input";
import { useTambo } from "@tambo-ai/react";

/**
 * A control bar component for managing Tambo threads
 * @property {string} className - Optional className for custom styling
 * @property {string} contextKey - Tambo thread context key for message routing
 * @property {string} hotkey - Keyboard shortcut for opening the control bar
 */

export interface ControlBarProps extends React.HTMLAttributes<HTMLDivElement> {
  contextKey?: string;
  hotkey?: string;
}

const ControlBar = React.forwardRef<HTMLDivElement, ControlBarProps>(
  ({ className, contextKey, hotkey = "mod+k", ...props }, ref) => {
    const [open, setOpen] = React.useState(false);
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
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40" />
          <Dialog.Content
            ref={ref}
            className={cn(
              "fixed top-1/4 left-1/2 -translate-x-1/2 w-[440px] rounded-lg shadow-lg transition-all duration-200",
              className,
            )}
            {...props}
          >
            <Dialog.Title className="sr-only">Control Bar</Dialog.Title>
            <div className="flex flex-col gap-3">
              <div className="bg-background border rounded-lg p-3 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <ChatInput
                    contextKey={contextKey}
                    className="[&_button]:hidden"
                  />
                </div>
                <kbd className="text-xs text-muted-foreground whitespace-nowrap">
                  esc to exit
                </kbd>
              </div>
              {thread?.messages?.length > 0 && (
                <div className="bg-background border rounded-lg p-4">
                  <ChatThread />
                </div>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  },
);
ControlBar.displayName = "ControlBar";

export { ControlBar };
