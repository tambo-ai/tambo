"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

import type { TimelineEvent } from "../lib/event-categorizer";
import { TimelineEventDetail } from "./timeline-event-detail";
import { TimelineEventRow } from "./timeline-event-row";

const ROW_HEIGHT = 36;
const OVERSCAN = 5;

interface TimelinePanelProps {
  events: TimelineEvent[];
  droppedCount: number;
  selectedEvent: TimelineEvent | null;
  onSelectEvent: (event: TimelineEvent) => void;
  onClear: () => void;
}

/**
 * Two-column timeline panel with virtualized event list (left) and
 * detail view (right). Supports auto-scroll and "jump to latest".
 *
 * @returns The full timeline panel component.
 */
export function TimelinePanel({
  events,
  droppedCount,
  selectedEvent,
  onSelectEvent,
  onClear,
}: TimelinePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const totalHeight = events.length * ROW_HEIGHT;

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setScrollTop(el.scrollTop);
    setContainerHeight(el.clientHeight);
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    setIsAtBottom(atBottom);
  }, []);

  // Initialize container height
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      setContainerHeight(el.clientHeight);
    }
  }, []);

  // Auto-scroll when at bottom and new events arrive
  useEffect(() => {
    if (isAtBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length, isAtBottom]);

  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const visibleCount = Math.ceil(containerHeight / ROW_HEIGHT) + OVERSCAN * 2;
  const endIndex = Math.min(events.length, startIndex + visibleCount);

  const jumpToLatest = useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{events.length} events</span>
          {droppedCount > 0 && (
            <span className="text-orange-500">
              {droppedCount} events truncated
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          No events yet. Start streaming to see events appear here.
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
          <div className="relative border-r">
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="h-full overflow-auto"
            >
              <div style={{ height: totalHeight, position: "relative" }}>
                {events.slice(startIndex, endIndex).map((event, i) => (
                  <div
                    key={event.seq}
                    style={{
                      position: "absolute",
                      top: (startIndex + i) * ROW_HEIGHT,
                      height: ROW_HEIGHT,
                      left: 0,
                      right: 0,
                    }}
                  >
                    <TimelineEventRow
                      event={event}
                      isSelected={selectedEvent?.seq === event.seq}
                      onSelect={onSelectEvent}
                    />
                  </div>
                ))}
              </div>
            </div>
            {!isAtBottom && (
              <div className="absolute inset-x-0 bottom-2 flex justify-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={jumpToLatest}
                  className="shadow-md"
                >
                  Jump to latest
                </Button>
              </div>
            )}
          </div>
          <div className="overflow-hidden">
            <TimelineEventDetail event={selectedEvent} />
          </div>
        </div>
      )}
    </div>
  );
}
