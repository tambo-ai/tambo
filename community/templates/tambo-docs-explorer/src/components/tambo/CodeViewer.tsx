/**
 * @file CodeViewer.tsx
 * @description A Tambo component that displays code examples with syntax highlighting
 */

"use client";

import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import "highlight.js/styles/github-dark.css";
import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";

// Register languages
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("css", css);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("json", json);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sh", bash);

export const codeViewerSchema = z.object({
  code: z.string().describe("The code to display"),
  language: z
    .string()
    .default("typescript")
    .describe(
      "Programming language for syntax highlighting (e.g., 'typescript', 'javascript', 'python')",
    ),
  title: z.string().optional().describe("Optional title for the code block"),
});

export type CodeViewerProps = z.infer<typeof codeViewerSchema>;

export function CodeViewer({
  code,
  language = "typescript",
  title,
}: CodeViewerProps) {
  const codeRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (codeRef.current) {
      try {
        // Auto-detect if language is not supported or weird
        if (!hljs.getLanguage(language)) {
          hljs.highlightElement(codeRef.current);
        } else {
          codeRef.current.removeAttribute("data-highlighted");
          hljs.highlightElement(codeRef.current);
        }
      } catch (e) {
        console.warn("Syntax highlighting failed:", e);
      }
    }
  }, [code, language]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
      {/* Mac-style Window Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <div className="h-3 w-3 rounded-full bg-yellow-500" />
          <div className="h-3 w-3 rounded-full bg-green-500" />
          {title && (
            <span className="ml-2 text-xs text-muted-foreground truncate max-w-40">
              {title}
            </span>
          )}
        </div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {language}
        </span>
      </div>

      {/* Code Content */}
      <div className="relative p-4 bg-[#0d1117] dark:bg-[#0d1117]">
        {/* Copy Button */}
        <button
          onClick={copyToClipboard}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all duration-200 hover:scale-105"
          aria-label="Copy code to clipboard"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>

        <pre className="overflow-x-auto text-sm font-mono leading-relaxed text-slate-300">
          <code ref={codeRef} className={`language-${language}`}>
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
}
