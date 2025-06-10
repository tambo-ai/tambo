"use client";

import { cn } from "@/lib/utils";
import DOMPurify from "dompurify";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";
import { Check, Copy } from "lucide-react";
import React from "react";

// CodeHeader component for syntax highlighting
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
    <div className="flex items-center justify-between gap-4 rounded-t-md bg-container px-4 py-2 text-sm font-semibold text-primary">
      <span className="lowercase text-primary">{language}</span>
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

// SyntaxHighlighter component
export const SyntaxHighlighter = ({
  code,
  language = "tsx",
}: {
  code: string;
  language?: string;
}) => {
  const highlighted = React.useMemo(() => {
    try {
      return hljs.highlight(code, { language }).value;
    } catch {
      return code;
    }
  }, [code, language]);

  return (
    <div className="relative border border-border rounded-md bg-muted max-w-full text-sm my-4">
      <CodeHeader language={language} code={code} />
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
            dangerouslySetInnerHTML={{
              __html: DOMPurify.isSupported
                ? DOMPurify.sanitize(highlighted)
                : "",
            }}
          />
        </pre>
      </div>
    </div>
  );
};
