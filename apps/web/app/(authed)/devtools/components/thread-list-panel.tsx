"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import type { StateSnapshot } from "@/devtools-server/types";

import { StreamingStateBadge } from "./streaming-state-badge";

type SnapshotThread = StateSnapshot["threads"][number];

interface ThreadListPanelProps {
  threads: SnapshotThread[];
  selectedThreadId: string | null;
  onSelectThread: (id: string) => void;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/**
 * Displays a scrollable list of threads with status, message count, and timestamps.
 *
 * @returns A selectable thread list panel.
 */
export function ThreadListPanel({
  threads,
  selectedThreadId,
  onSelectThread,
}: ThreadListPanelProps) {
  if (threads.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
        No threads
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col">
        {threads.map((thread) => (
          <button
            key={thread.id}
            type="button"
            onClick={() => onSelectThread(thread.id)}
            className={`flex flex-col gap-1 border-b p-3 text-left transition-colors hover:bg-accent/50 ${
              selectedThreadId === thread.id ? "bg-accent" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium">
                {thread.name ?? `Thread ${thread.id.slice(0, 8)}`}
              </span>
              <StreamingStateBadge
                status={thread.status}
                error={thread.streamingState?.error}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{thread.messageCount} messages</span>
              {thread.updatedAt && <span>{timeAgo(thread.updatedAt)}</span>}
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
