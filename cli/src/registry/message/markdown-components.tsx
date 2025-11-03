"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Copy, Check, ExternalLink } from "lucide-react";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";
import DOMPurify from "dompurify";

/**
 * Markdown Components for Streamdown
 *
 * This module provides customized components for rendering markdown content with syntax highlighting.
 * It uses highlight.js for code syntax highlighting and supports streaming content updates.
 *
 * @example
 * ```tsx
 * import { createMarkdownComponents } from './markdown-components';
 * import { Streamdown } from 'streamdown';
 *
 * const MarkdownRenderer = ({ content }) => {
 *   const components = createMarkdownComponents();
 *   return <Streamdown components={components}>{content}</Streamdown>;
 * };
 * ```
 */

/**
 * Determines if a text block looks like code based on common code patterns
 * @param text - The text to analyze
 * @returns boolean indicating if the text appears to be code
 */
const looksLikeCode = (text: string): boolean => {
  const codeIndicators = [
    /^import\s+/m,
    /^function\s+/m,
    /^class\s+/m,
    /^const\s+/m,
    /^let\s+/m,
    /^var\s+/m,
    /[{}[\]();]/,
    /^\s*\/\//m,
    /^\s*\/\*/m,
    /=>/,
    /^export\s+/m,
  ];
  return codeIndicators.some((pattern) => pattern.test(text));
};

/**
 * Header component for code blocks with language display and copy functionality
 */
const CodeHeader = ({
  language,
  code,
}: {
  language?: string;
  code?: string;
}) => {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-t-md bg-container px-4 py-2 text-sm font-semibold text-foreground">
      <span className="lowercase text-muted-foreground">{language}</span>
      <button
        onClick={copyToClipboard}
        className="p-1 rounded-md hover:bg-backdrop transition-colors cursor-pointer"
        title="Copy code"
      >
        {!copied ? (
          <Copy className="h-4 w-4" />
        ) : (
          <Check className="h-4 w-4 text-green-500" />
        )}
      </button>
    </div>
  );
};

/**
 * Creates a set of components for use with streamdown
 * @returns Components object for streamdown
 */
export const createMarkdownComponents = (): Record<
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  React.ComponentType<any>
> => ({
  code: function Code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className ?? "");
    const content = String(children).replace(/\n$/, "");
    const deferredContent = React.useDeferredValue(content);

    const highlighted = React.useMemo(() => {
      if (!match || !looksLikeCode(deferredContent)) return null;
      try {
        return hljs.highlight(deferredContent, { language: match[1] }).value;
      } catch {
        return deferredContent;
      }
    }, [deferredContent, match]);

    if (match && looksLikeCode(content)) {
      return (
        <div className="relative border border-border rounded-md bg-muted max-w-[80ch] text-sm my-4">
          <CodeHeader language={match[1]} code={content} />
          <div
            className={cn(
              "overflow-x-auto rounded-b-md bg-background",
              "[&::-webkit-scrollbar]:w-[6px]",
              "[&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-md",
              "[&::-webkit-scrollbar:horizontal]:h-[4px]",
            )}
          >
            <pre className="p-4 whitespace-pre">
              <code
                className={className}
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(highlighted ?? content),
                }}
              />
            </pre>
          </div>
        </div>
      );
    }

    return (
      <code
        className={cn("bg-muted px-1.5 py-0.5 rounded text-sm", className)}
        {...props}
      >
        {children}
      </code>
    );
  },

  /**
   * Paragraph component with minimal vertical margin
   */
  p: ({ children }) => <p className="my-0">{children}</p>,

  /**
   * Heading 1 component with large text and proper spacing
   * Used for main section headers
   */
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>
  ),

  /**
   * Heading 2 component for subsection headers
   * Slightly smaller than h1 with adjusted spacing
   */
  h2: ({ children }) => (
    <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>
  ),

  /**
   * Heading 3 component for minor sections
   * Used for smaller subdivisions within h2 sections
   */
  h3: ({ children }) => (
    <h3 className="text-lg font-bold mb-2 mt-4">{children}</h3>
  ),

  /**
   * Heading 4 component for the smallest section divisions
   * Maintains consistent text size with adjusted spacing
   */
  h4: ({ children }) => (
    <h4 className="text-base font-bold mb-2 mt-3">{children}</h4>
  ),

  /**
   * Unordered list component with disc-style bullets
   * Indented from the left margin
   */
  ul: ({ children }) => <ul className="list-disc pl-5">{children}</ul>,

  /**
   * Ordered list component with decimal numbering
   * Indented from the left margin
   */
  ol: ({ children }) => <ol className="list-decimal pl-5">{children}</ol>,

  /**
   * List item component with normal line height
   * Used within both ordered and unordered lists
   */
  li: ({ children }) => <li className="leading-normal">{children}</li>,

  /**
   * Blockquote component for quoted content
   * Features a left border and italic text with proper spacing
   */
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-muted pl-4 italic my-4">
      {children}
    </blockquote>
  ),

  /**
   * Anchor component for links
   * Opens links in new tab with security attributes
   * Includes hover underline effect
   */
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-foreground underline underline-offset-4 decoration-muted-foreground hover:text-foreground hover:decoration-foreground transition-colors"
    >
      <span>{children}</span>
      <ExternalLink className="w-3 h-3" />
    </a>
  ),

  /**
   * Horizontal rule component
   * Creates a visual divider with proper spacing
   */
  hr: () => <hr className="my-4 border-muted" />,

  /**
   * Table container component
   * Handles overflow for wide tables with proper spacing
   */
  table: ({ children }) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border border-border">{children}</table>
    </div>
  ),

  /**
   * Table header cell component
   * Features bold text and distinct background
   */
  th: ({ children }) => (
    <th className="border border-border px-4 py-2 bg-muted font-semibold">
      {children}
    </th>
  ),

  /**
   * Table data cell component
   * Consistent styling with header cells
   */
  td: ({ children }) => (
    <td className="border border-border px-4 py-2">{children}</td>
  ),
});

/**
 * Pre-created markdown components instance for use across the application.
 */
export const markdownComponents = createMarkdownComponents();
