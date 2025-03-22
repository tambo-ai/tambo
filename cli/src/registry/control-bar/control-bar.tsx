"use client";

import * as React from "react";
import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ThreadContent } from "@/components/ui/thread-content";
import { MessageInput } from "@/components/ui/message-input";
import { useTambo } from "@tambo-ai/react";
import * as Dialog from "@radix-ui/react-dialog";

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
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (scrollContainerRef.current && thread?.messages?.length) {
        const timeoutId = setTimeout(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
              top: scrollContainerRef.current.scrollHeight,
              behavior: "smooth",
            });
          }
        }, 100);

        return () => clearTimeout(timeoutId);
      }
    }, [thread?.messages]);

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
              "fixed top-1/4 left-1/2 -translate-x-1/2 w-[440px] rounded-lg shadow-lg transition-all duration-200 outline-none",
              className,
            )}
            {...props}
          >
            <Dialog.Title className="sr-only">Control Bar</Dialog.Title>
            <div className="flex flex-col gap-3">
              <div className="bg-background border rounded-lg p-3 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <MessageInput contextKey={contextKey} />
                </div>
              </div>
              {thread?.messages?.length > 0 && (
                <div
                  ref={scrollContainerRef}
                  className="bg-background border rounded-lg p-4 max-h-[500px] overflow-y-auto [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-thumb]:bg-gray-300"
                >
                  <ThreadContent />
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
