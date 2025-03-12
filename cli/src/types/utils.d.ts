/**
 * @file utils.d.ts
 * @description Type declarations for utility functions and third-party libraries used in the CLI project.
 * These declarations ensure TypeScript compatibility when the project is installed via CLI.
 *
 * This file provides type definitions for:
 * - Internal utility functions (@/lib/utils)
 * - Radix UI components (Dialog, Collapsible)
 * - Command palette (cmdk)
 * - HTML sanitization (sanitize-html)
 *
 * These type declarations are essential for maintaining type safety and preventing
 * build errors when the package is installed in end-user projects through the CLI.
 */

declare module "@/lib/utils" {
  import { ClassValue } from "clsx";
  export function cn(...inputs: ClassValue[]): string;
}

declare module "@radix-ui/react-dialog" {
  import * as React from "react";
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
  export { Content, Overlay, Portal, Root };
}

declare module "@radix-ui/react-collapsible" {
  import * as React from "react";
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

declare module "cmdk" {
  import * as React from "react";
  export const Command: React.FC<{
    children: React.ReactNode;
    className?: string;
  }> & {
    Input: React.FC<{
      placeholder?: string;
      className?: string;
    }>;
  };
}

declare module "sanitize-html" {
  interface SanitizeOptions {
    allowedTags?: string[];
    allowedAttributes?: Record<string, string[]>;
  }
  export default function sanitizeHtml(
    dirty: string,
    options?: SanitizeOptions,
  ): string;
}
