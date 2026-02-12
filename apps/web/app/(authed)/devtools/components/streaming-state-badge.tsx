"use client";

import { Badge } from "@/components/ui/badge";

interface StreamingStateBadgeProps {
  status: string;
  error?: { message: string };
}

/**
 * Displays a thread's streaming status as a colored badge.
 *
 * @returns A badge indicating idle, streaming, waiting, or error state.
 */
export function StreamingStateBadge({
  status,
  error,
}: StreamingStateBadgeProps) {
  if (error) {
    return (
      <div className="flex flex-col gap-0.5">
        <Badge variant="destructive">error</Badge>
        <span className="text-xs text-destructive">{error.message}</span>
      </div>
    );
  }

  switch (status) {
    case "streaming":
      return <Badge className="animate-pulse">streaming</Badge>;
    case "waiting":
      return <Badge variant="secondary">waiting</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
