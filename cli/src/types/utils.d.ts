/**
 * @file utils.d.ts
 * @description Type declarations for utility functions and third-party libraries used in CLI components.
 * These declarations prevent build errors in the CLI during development without requiring actual package installations.
 *
 * This file provides type definitions for:
 * - Internal utility functions (@/lib/utils) - created during component installation, declared here to avoid creating lib folder in CLI
 * - Streamdown components
 * - Highlight.js
 * - Dompurify
 * - Json-stringify-pretty-compact
 *
 * These packages are NOT installed in the CLI itself, but are required by the actual components
 * when they are installed in end-user projects. The type declarations here allow the CLI to
 * build successfully while avoiding unnecessary package dependencies in the CLI bundle.
 */

declare module "@/lib/utils" {
  import type { ClassValue } from "clsx";
  export function cn(...inputs: ClassValue[]): string;
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

declare module "json-stringify-pretty-compact" {
  const stringify: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any,
    options?: {
      indent?: number | string;
      maxLength?: number;
      replacer?: // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((this: any, key: string, value: any) => any) | (number | string)[];
    },
  ) => string;
  export default stringify;
}
