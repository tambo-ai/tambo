"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

import type { DevToolsError } from "@/devtools-server/types";

interface ErrorBannerProps {
  errors: DevToolsError[];
}

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

/**
 * Displays a prominent banner for streaming, tool call, and connection errors.
 * Collapses after 3 errors with an expand toggle.
 *
 * @returns The error banner, or null if no errors.
 */
export function ErrorBanner({ errors }: ErrorBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (errors.length === 0) return null;

  const visibleErrors =
    isExpanded || errors.length <= 3 ? errors : errors.slice(0, 3);
  const hiddenCount = errors.length - 3;

  return (
    <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
      <p className="mb-2 text-sm font-medium">
        {errors.length} error{errors.length !== 1 ? "s" : ""}
      </p>
      <div className="space-y-2">
        {visibleErrors.map((err, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-destructive/20 px-1.5 py-0.5 font-mono text-xs">
                {err.type}
              </span>
              <span>{err.message}</span>
              {err.threadId && (
                <span className="font-mono text-xs text-muted-foreground">
                  thread: {err.threadId}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(err.timestamp)}
              </span>
            </div>
          </div>
        ))}
      </div>
      {!isExpanded && hiddenCount > 0 && (
        <button
          onClick={() => setIsExpanded(true)}
          className="mt-2 text-xs text-muted-foreground underline"
        >
          Show {hiddenCount} more
        </button>
      )}
    </div>
  );
}
