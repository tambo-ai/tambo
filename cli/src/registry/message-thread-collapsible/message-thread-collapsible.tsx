"use client";

import { cn } from "@/lib/utils";
import * as Collapsible from "@radix-ui/react-collapsible";
import { cva } from "class-variance-authority";
import * as React from "react";

export interface MessageThreadCollapsibleRootProps
  extends React.ComponentPropsWithoutRef<typeof Collapsible.Root> {
  isFixed?: boolean;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  offset?: number;
  size?: "sm" | "md" | "lg";
  appearance?: "default" | "elevated" | "bordered";
}

const surfaceVariants = cva(
  "rounded-lg bg-background transition-all duration-300 ease-in-out",
  {
    variants: {
      size: {
        sm: "w-full max-w-sm",
        md: "w-full max-w-md",
        lg: "w-full md:max-w-lg",
      },
      appearance: {
        default: "border border-border shadow-sm",
        elevated: "shadow-lg border border-border",
        bordered: "border-2 border-border",
      },
    },
    defaultVariants: {
      size: "md",
      appearance: "default",
    },
  },
);

const Root = React.forwardRef<
  HTMLDivElement,
  MessageThreadCollapsibleRootProps
>(
  (
    {
      className,
      children,
      isFixed = true,
      position = "bottom-right",
      offset = 16,
      size = "md",
      appearance = "default",
      style,
      ...props
    },
    ref,
  ) => {
    const placement: React.CSSProperties = {};
    if (isFixed) {
      if (position.includes("bottom")) placement.bottom = offset as number;
      if (position.includes("top")) placement.top = offset as number;
      if (position.includes("right")) placement.right = offset as number;
      if (position.includes("left")) placement.left = offset as number;
    }

    return (
      <Collapsible.Root
        ref={ref}
        className={cn(
          surfaceVariants({ size, appearance }),
          isFixed && "fixed",
          className,
        )}
        style={{ ...(isFixed ? placement : {}), ...style }}
        {...props}
      >
        {children}
      </Collapsible.Root>
    );
  },
);
Root.displayName = "MessageThreadCollapsible.Root";

const Trigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Collapsible.Trigger> & {
    asChild?: boolean;
  }
>(({ asChild = true, ...props }, ref) => (
  <Collapsible.Trigger ref={ref} asChild={asChild} {...props} />
));
Trigger.displayName = "MessageThreadCollapsible.Trigger";

const Content = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Collapsible.Content>
>(({ children, ...props }, ref) => (
  <Collapsible.Content ref={ref} {...props}>
    {children}
  </Collapsible.Content>
));
Content.displayName = "MessageThreadCollapsible.Content";

export { Content, Root, Trigger };
