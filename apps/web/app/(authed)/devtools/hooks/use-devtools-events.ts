"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { StreamEventFromServer } from "./use-devtools-connection";
import { RingBuffer } from "../lib/ring-buffer";
import {
  type TimelineEvent,
  categorizeEvent,
  summarizeEvent,
} from "../lib/event-categorizer";

interface UseDevtoolsEventsReturn {
  events: TimelineEvent[];
  droppedCount: number;
  clearEvents: () => void;
  selectedEvent: TimelineEvent | null;
  setSelectedEvent: (event: TimelineEvent | null) => void;
}

/**
 * Transforms raw stream events into categorized timeline events with
 * RAF-batched React state updates for performance.
 *
 * @returns Timeline events, selection state, and clear function.
 */
export function useDevtoolsEvents(
  rawEvents: StreamEventFromServer[] | undefined,
  maxEvents = 5000,
): UseDevtoolsEventsReturn {
  const bufferRef = useRef(new RingBuffer<TimelineEvent>(maxEvents));
  const rafRef = useRef<number | null>(null);
  const lastProcessedRef = useRef(0);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [droppedCount, setDroppedCount] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(
    null,
  );

  useEffect(() => {
    if (!rawEvents || rawEvents.length === 0) {
      if (lastProcessedRef.current > 0) {
        lastProcessedRef.current = 0;
        bufferRef.current.clear();
        setEvents([]);
        setDroppedCount(0);
      }
      return;
    }

    const newStart = lastProcessedRef.current;
    if (newStart >= rawEvents.length) return;

    const buffer = bufferRef.current;
    for (let i = newStart; i < rawEvents.length; i++) {
      const raw = rawEvents[i];
      const category = categorizeEvent(raw.eventType);
      const summary = summarizeEvent(raw.eventType, raw.payload);
      buffer.push({
        seq: raw.seq,
        timestamp: raw.timestamp,
        threadId: raw.threadId,
        eventType: raw.eventType,
        category,
        summary,
        payload: raw.payload,
      });
    }
    lastProcessedRef.current = rawEvents.length;

    // RAF-batch the state update
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        setEvents(buffer.toArray());
        setDroppedCount(buffer.droppedCount);
      });
    }
  }, [rawEvents]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const clearEvents = useCallback(() => {
    bufferRef.current.clear();
    lastProcessedRef.current = 0;
    setEvents([]);
    setDroppedCount(0);
    setSelectedEvent(null);
  }, []);

  return { events, droppedCount, clearEvents, selectedEvent, setSelectedEvent };
}
