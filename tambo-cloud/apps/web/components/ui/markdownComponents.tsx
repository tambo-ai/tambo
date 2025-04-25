"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneLight,
  vscDarkPlus,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import type { Components } from "react-markdown";
import { Copy, Check } from "lucide-react";

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

export const createMarkdownComponents = (theme = "light"): Components => ({
  code: function Code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className ?? "");
    const content = String(children).replace(/\n$/, "");
    const [copied, setCopied] = React.useState(false);

    const copyToClipboard = () => {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    if (match && looksLikeCode(content)) {
      return (
        <div className="relative border border-input rounded-md bg-muted">
          <div className="absolute -top-3 left-4 px-2 py-0.5 text-xs font-semibold bg-background border border-input rounded-md">
            {match[1]}
          </div>
          <button
            onClick={copyToClipboard}
            className="absolute -top-2.5 right-4 px-2 py-0.5 text-xs font-semibold bg-background border border-input rounded-md z-10 hover:bg-muted transition-colors flex items-center gap-1"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
          <SyntaxHighlighter
            style={theme === "light" ? oneLight : vscDarkPlus}
            language={match[1]}
            PreTag="div"
            customStyle={{
              margin: 0,
              padding: "1rem",
              fontSize: "0.875rem",
              borderRadius: "0.375rem",
            }}
          >
            {content}
          </SyntaxHighlighter>
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
  p: ({ children }) => <p className="my-0">{children}</p>,
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-bold mb-2 mt-4">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-base font-bold mb-2 mt-3">{children}</h4>
  ),
  ul: ({ children }) => <ul className="list-disc pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5">{children}</ol>,
  li: ({ children }) => <li className="leading-normal">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-muted pl-4 italic my-4">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:underline"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-4 border-muted" />,
  table: ({ children }) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border border-border">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-border px-4 py-2 bg-muted font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-border px-4 py-2">{children}</td>
  ),
});
