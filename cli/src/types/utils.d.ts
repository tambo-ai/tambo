/**
 * @file utils.d.ts
 * @description Type declarations for utility functions and third-party libraries used in the CLI project.
 * These declarations ensure TypeScript compatibility when the project is installed via CLI.
 *
 * This file provides type definitions for:
 * - Internal utility functions (@/lib/utils)
 * - Radix UI components (Dialog, Collapsible)
 *
 * These type declarations are essential for maintaining type safety and preventing
 * build errors when the package is installed in end-user projects through the CLI.
 */

declare module "@/lib/utils" {
  import type { ClassValue } from "clsx";
  export function cn(...inputs: ClassValue[]): string;
}

declare module "@radix-ui/react-dialog" {
  import type * as React from "react";
  const Root: React.FC<{
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }>;
  const Portal: React.FC<{ children: React.ReactNode }>;
  const Overlay: React.FC<{ className?: string }>;
  const Content: React.FC<{
    children: React.ReactNode;
    className?: string;
    ref?: React.Ref<HTMLDivElement>;
    [key: string]: unknown;
  }>;
  const Title: React.FC<{
    children: React.ReactNode;
    className?: string;
  }>;
  export { Content, Overlay, Portal, Root, Title };
}

declare module "@radix-ui/react-collapsible" {
  import type * as React from "react";
  const Root: React.FC<{
    children: React.ReactNode;
    className?: string;
    ref?: React.Ref<HTMLDivElement>;
    [key: string]: unknown;
  }>;
  const Trigger: React.FC<{
    children: React.ReactNode;
    asChild?: boolean;
  }>;
  const Content: React.FC<{
    children: React.ReactNode;
    className?: string;
  }>;
  export { Content, Root, Trigger };
}

declare module "@radix-ui/react-dropdown-menu" {
  import type * as React from "react";
  const Root: React.FC<{
    children: React.ReactNode;
  }>;

  const Trigger: React.FC<{
    children: React.ReactNode;
    asChild?: boolean;
  }>;

  const Portal: React.FC<{
    children: React.ReactNode;
  }>;

  const Content: React.FC<{
    children: React.ReactNode;
    className?: string;
    side?: "top" | "right" | "bottom" | "left";
    align?: "start" | "center" | "end";
    sideOffset?: number;
  }>;

  const Item: React.FC<{
    children: React.ReactNode;
    className?: string;
    disabled?: boolean;
    onSelect?: (event: Event) => void;
  }>;

  const Separator: React.FC<{
    className?: string;
  }>;

  export { Content, Item, Portal, Root, Separator, Trigger };
}

declare module "react-markdown" {
  import type * as React from "react";
  interface ReactMarkdownProps {
    children: string;
    className?: string;
    components?: Record<string, React.ComponentType<any>>;
  }
  const ReactMarkdown: React.ComponentType<ReactMarkdownProps>;
  export type Components = Record<string, React.ComponentType<any>>;
  export default ReactMarkdown;
}

declare module "react-syntax-highlighter" {
  import type * as React from "react";
  interface SyntaxHighlighterProps {
    children: string;
    language?: string;
    style?: any;
    PreTag?: string | React.ComponentType<any>;
    customStyle?: React.CSSProperties;
    className?: string;
    [key: string]: unknown;
  }
  export const Prism: React.ComponentType<SyntaxHighlighterProps>;
  export const SyntaxHighlighter: React.ComponentType<SyntaxHighlighterProps>;
}

declare module "react-syntax-highlighter/dist/esm/styles/prism" {
  export const oneLight: any;
  export const vscDarkPlus: any;
}
