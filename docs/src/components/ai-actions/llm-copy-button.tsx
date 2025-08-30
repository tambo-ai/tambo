"use client";

import { Copy, Check, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const cache = new Map<string, string>();

function useCopyButton(copyFn: () => Promise<void>) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = async () => {
    try {
      setError(null);
      await copyFn();
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Copy failed";
      setError(errorMessage);
      console.error("Copy failed:", error);
      setTimeout(() => setError(null), 3000);
    }
  };

  return [copied, handleCopy, error] as const;
}

interface LLMCopyButtonProps {
  markdownUrl: string;
  className?: string;
}

export function LLMCopyButton({ markdownUrl, className }: LLMCopyButtonProps) {
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    const preloadContent = async () => {
      if (!cache.has(markdownUrl)) {
        const response = await fetch(markdownUrl);
        if (response.ok) {
          const content = await response.text();
          cache.set(markdownUrl, content);
        }
      }
    };

    const timeoutId = setTimeout(preloadContent, 100);
    return () => clearTimeout(timeoutId);
  }, [markdownUrl]);

  const copyContent = async (): Promise<void> => {
    const cached = cache.get(markdownUrl);
    if (cached) {
      await navigator.clipboard.writeText(cached);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(markdownUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const content = await response.text();
      cache.set(markdownUrl, content);

      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error("Failed to copy content:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const [checked, onClick, error] = useCopyButton(copyContent);

  return (
    <button
      disabled={isLoading}
      onClick={onClick}
      aria-label={
        error
          ? `Copy failed: ${error}`
          : checked
            ? "Content copied to clipboard"
            : "Copy markdown content for AI"
      }
      title={error ? `Copy failed: ${error}` : undefined}
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-fd-border bg-fd-background text-fd-foreground hover:bg-fd-muted focus:outline-none focus:ring-2 focus:ring-fd-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer",
        className,
      )}
    >
      {error ? (
        <AlertCircle className="h-4 w-4 text-red-500" />
      ) : checked ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4 text-fd-muted-foreground" />
      )}
      {error ? "Copy Failed" : checked ? "Copied!" : "Copy Markdown"}
    </button>
  );
}
