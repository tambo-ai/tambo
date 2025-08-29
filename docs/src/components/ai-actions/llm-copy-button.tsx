"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const cache = new Map<string, string>();

function useCopyButton(copyFn: () => Promise<void>) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await copyFn();
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  return [copied, handleCopy] as const;
}

interface LLMCopyButtonProps {
  markdownUrl: string;
  className?: string;
}

export function LLMCopyButton({ markdownUrl, className }: LLMCopyButtonProps) {
  const [isLoading, setLoading] = useState(false);
  const [checked, onClick] = useCopyButton(async () => {
    const cached = cache.get(markdownUrl);
    if (cached) return await navigator.clipboard.writeText(cached);

    setLoading(true);
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/plain": fetch(markdownUrl).then(async (res) => {
            const content = await res.text();
            cache.set(markdownUrl, content);
            return content;
          }),
        }),
      ]);
    } catch {
      const response = await fetch(markdownUrl);
      const content = await response.text();
      cache.set(markdownUrl, content);
      await navigator.clipboard.writeText(content);
    } finally {
      setLoading(false);
    }
  });

  return (
    <button
      disabled={isLoading}
      onClick={onClick}
      aria-label={
        checked ? "Content copied to clipboard" : "Copy markdown content for AI"
      }
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-fd-border bg-fd-background text-fd-foreground hover:bg-fd-muted focus:outline-none focus:ring-2 focus:ring-fd-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer",
        className,
      )}
    >
      {checked ? (
        <Check className="h-4 w-4 text-fd-muted-foreground" />
      ) : (
        <Copy className="h-4 w-4 text-fd-muted-foreground" />
      )}
      Copy Markdown
    </button>
  );
}
