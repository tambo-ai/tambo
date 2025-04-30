/**
 * @file utils.d.ts
 * @description Type declarations for utility functions and third-party libraries used in the CLI project.
 * These declarations ensure TypeScript compatibility when the project is installed via CLI.
 *
 * This file provides type definitions for:
 * - Internal utility functions (@/lib/utils)
 * - React Markdown components
 * - Highlight.js
 *
 * These type declarations are essential for maintaining type safety and preventing
 * build errors when the package is installed in end-user projects through the CLI.
 */

declare module "@/lib/utils" {
  import type { ClassValue } from "clsx";
  export function cn(...inputs: ClassValue[]): string;
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

declare module "highlight.js" {
  const hljs: {
    highlight: (
      code: string,
      options: { language: string },
    ) => { value: string };
  };
  export default hljs;
}

declare module "dompurify" {
  const dompurify: {
    sanitize: (html: string) => string;
  };
  export default dompurify;
}
