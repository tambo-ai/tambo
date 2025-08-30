"use client";

import { Copy, Check, AlertCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

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
  content: string;
  className?: string;
}

export function LLMCopyButton({ content, className }: LLMCopyButtonProps) {
  // No need for loading state or preloading since content is passed directly

  const copyContent = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error("Failed to copy content:", error);
      throw error;
    }
  };

  const [checked, onClick, error] = useCopyButton(copyContent);

  return (
    <button
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
