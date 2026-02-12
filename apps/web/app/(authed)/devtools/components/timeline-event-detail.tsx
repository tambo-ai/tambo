"use client";

import type { TimelineEvent } from "../lib/event-categorizer";
import { CATEGORY_COLORS } from "../lib/event-categorizer";
import { JsonTreeViewer } from "./json-tree-viewer";

interface TimelineEventDetailProps {
  event: TimelineEvent | null;
}

/**
 * Detail panel showing full metadata and JSON payload for a selected
 * timeline event.
 *
 * @returns Event detail view or placeholder when nothing is selected.
 */
export function TimelineEventDetail({ event }: TimelineEventDetailProps) {
  if (!event) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Select an event to view details
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-auto p-3">
      <div className="flex flex-col gap-2 border-b pb-3">
        <div className="flex items-center gap-2">
          <div
            className={`h-2.5 w-2.5 rounded-full ${CATEGORY_COLORS[event.category]}`}
          />
          <span className="font-mono text-sm font-medium">
            {event.eventType}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
          <span>Category: {event.category}</span>
          <span>Seq: {event.seq}</span>
          <span>
            Time:{" "}
            {new Date(event.timestamp).toLocaleTimeString("en-US", {
              hour12: false,
              fractionalSecondDigits: 3,
            })}
          </span>
          <span className="truncate">Thread: {event.threadId}</span>
        </div>
      </div>
      <div className="pt-3">
        <JsonTreeViewer data={event.payload} label="payload" defaultExpanded />
      </div>
    </div>
  );
}
