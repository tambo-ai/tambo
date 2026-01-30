"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------
   Provider
------------------------------------------------------- */

const TooltipProvider = TooltipPrimitive.Provider;

/* -------------------------------------------------------
   Primitives
------------------------------------------------------- */

const TooltipRoot = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

/* -------------------------------------------------------
   Content (Ops / Intelligence style)
------------------------------------------------------- */

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      `
        z-50
        rounded-md
        border border-border
        bg-secondary
        px-3 py-1.5
        text-[11px]
        tracking-wide
        text-foreground
        shadow-sm

        data-[state=open]:animate-in
        data-[state=open]:fade-in-0
        data-[state=closed]:animate-out
        data-[state=closed]:fade-out-0
      `,
      className,
    )}
    {...props}
  />
));
TooltipContent.displayName =
  TooltipPrimitive.Content.displayName;

/* -------------------------------------------------------
   Unified Tooltip API
------------------------------------------------------- */

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  delayDuration?: number;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  className?: string;
}

function Tooltip({
  content,
  children,
  delayDuration = 300,
  open,
  defaultOpen,
  onOpenChange,
  side = "top",
  align = "center",
  className,
}: TooltipProps) {
  return (
    <TooltipRoot
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      delayDuration={delayDuration}
    >
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        align={align}
        className={className}
      >
        {content}
      </TooltipContent>
    </TooltipRoot>
  );
}

export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
};
