"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface LLMCopyButtonProps {
  markdownUrl: string;
  className?: string;
}

export function LLMCopyButton({ markdownUrl, className }: LLMCopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCopy = async () => {
    if (loading || copied) return;

    setLoading(true);
    try {
      const response = await fetch(markdownUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch content");
      }

      const content = await response.text();

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(content);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = content;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy content:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCopy}
      disabled={loading || copied}
      aria-label={
        copied ? "Content copied to clipboard" : "Copy markdown content for AI"
      }
      className={cn(
        "inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md border border-fd-border bg-fd-background text-fd-foreground hover:bg-fd-muted focus:outline-none focus:ring-2 focus:ring-fd-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer",
        className,
      )}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-2" aria-hidden="true" />
          Copy for AI
        </>
      ) : (
        <>
          <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
          Copy for AI
        </>
      )}
    </button>
  );
}
