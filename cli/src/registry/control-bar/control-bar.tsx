"use client";

import * as React from "react";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { ChatThread } from "@/components/ui/chat-thread";
import { ChatInput } from "@/components/ui/chat-input";

const controlBarVariants = cva(
  "fixed inset-x-0 top-4 mx-auto max-w-2xl rounded-lg shadow-lg transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-background border",
        solid: "bg-muted/50 backdrop-blur-sm border",
        bordered: "bg-background border-2",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

/**
 * Represents a control bar component
 * @property {string} className - Optional className for custom styling
 * @property {VariantProps<typeof controlBarVariants>["variant"]} variant - Optional variant for custom styling
 */

export interface ControlBarProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: VariantProps<typeof controlBarVariants>["variant"];
  contextKey?: string;
  hotkey?: string;
}

const ControlBar = React.forwardRef<HTMLDivElement, ControlBarProps>(
  ({ className, variant, contextKey, hotkey = "mod+k", ...props }, ref) => {
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
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40" />
          <Dialog.Content
            ref={ref}
            className={cn(controlBarVariants({ variant }), className)}
            {...props}
          >
            <Command className="flex flex-col h-[600px]">
              <div className="flex items-center border-b p-2">
                <Command.Input
                  placeholder="Type a command or message..."
                  className="flex-1 outline-none bg-transparent"
                />
                <kbd className="ml-2 text-xs text-muted-foreground">
                  {hotkey}
                </kbd>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <ChatThread variant={variant} />
              </div>
              <div className="p-4 border-t">
                <ChatInput variant={variant} contextKey={contextKey} />
              </div>
            </Command>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  },
);
ControlBar.displayName = "ControlBar";

export { ControlBar, controlBarVariants };
