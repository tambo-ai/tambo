"use client";

import { cn } from "@/lib/utils";
import DOMPurify from "dompurify";
import hljs from "highlight.js";
import { Check, Copy } from "lucide-react";
import React, { useEffect, useState } from "react";

// CodeHeader component for syntax highlighting
const CodeHeader = ({
  language,
  code,
}: {
  language?: string;
  code?: string;
}) => {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-t-md bg-container px-4 py-2 text-sm font-semibold text-muted-foreground">
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
  const [highlightedCode, setHighlightedCode] = useState("");
  const isSupported = DOMPurify.isSupported;
  useEffect(() => {
    setHighlightedCode(isSupported ? DOMPurify.sanitize(highlighted) : "");
  }, [highlighted, isSupported]);

  return (
    <div className="relative border border-border rounded-md bg-muted max-w-full text-sm my-4">
      <CodeHeader language={language} code={code} />
      <div
        className={cn(
          "overflow-x-auto rounded-b-md bg-background",
          "[&::-webkit-scrollbar]:w-[6px]",
          "[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-md",
          "[&::-webkit-scrollbar:horizontal]:h-[4px]",
        )}
      >
        <pre className="p-4 whitespace-pre">
          {highlightedCode ? (
            <code
              dangerouslySetInnerHTML={{
                __html: highlightedCode,
              }}
            />
          ) : (
            <code>{code}</code>
          )}
        </pre>
      </div>
    </div>
  );
};
