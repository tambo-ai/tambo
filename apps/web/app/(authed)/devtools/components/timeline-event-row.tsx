"use client";

import { memo } from "react";

import type { TimelineEvent } from "../lib/event-categorizer";
import { CATEGORY_COLORS } from "../lib/event-categorizer";

interface TimelineEventRowProps {
  event: TimelineEvent;
  isSelected: boolean;
  onSelect: (event: TimelineEvent) => void;
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour12: false,
    fractionalSecondDigits: 3,
  });
}

/**
 * A single row in the timeline event list, showing category badge,
 * timestamp, event type, and summary.
 *
 * @returns A clickable memoized event row.
 */
export const TimelineEventRow = memo(function TimelineEventRow({
  event,
  isSelected,
  onSelect,
}: TimelineEventRowProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(event)}
      className={`flex h-9 w-full items-center gap-2 text-left text-xs transition-colors hover:bg-accent/50 ${
        isSelected ? "bg-accent" : ""
      }`}
    >
      <div
        className={`ml-2 h-2 w-2 shrink-0 rounded-full ${CATEGORY_COLORS[event.category]}`}
      />
      <span className="shrink-0 font-mono text-muted-foreground">
        {formatTimestamp(event.timestamp)}
      </span>
      <span
        className="shrink-0 truncate font-mono font-medium"
        style={{ maxWidth: 180 }}
      >
        {event.eventType}
      </span>
      <span className="truncate text-muted-foreground">{event.summary}</span>
    </button>
  );
});
