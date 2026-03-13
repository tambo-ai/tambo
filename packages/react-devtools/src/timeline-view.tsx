"use client";

import type { DevtoolsEvent } from "@tambo-ai/client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getStyles } from "./styles";

interface TimelineViewProps {
  events: readonly DevtoolsEvent[];
  onClear: () => void;
}

/** Maps event types to CSS variable names for coloring. */
function getEventColor(type: string): string {
  if (type === "RUN_STARTED" || type === "RUN_FINISHED") {
    return "var(--tdt-ev-run)";
  }
  if (type === "RUN_ERROR" || type.startsWith("error")) {
    return "var(--tdt-ev-error)";
  }
  if (type === "user_message") {
    return "var(--tdt-ev-message)";
  }
  if (type === "TEXT_MESSAGE_START" || type === "TEXT_MESSAGE_END") {
    return "var(--tdt-ev-stream)";
  }
  if (type.startsWith("TOOL_CALL") || type === "tool_result") {
    return "var(--tdt-ev-tool)";
  }
  if (type.startsWith("tambo.component")) {
    return "var(--tdt-ev-component)";
  }
  return "var(--tdt-ev-system)";
}

/** Derives a short display name for an event. */
function getEventName(event: DevtoolsEvent): string {
  const detail = event.detail;
  switch (event.type) {
    case "RUN_STARTED":
    case "RUN_FINISHED":
    case "RUN_ERROR":
      return `run`;
    case "user_message":
      return "user_message";
    case "TEXT_MESSAGE_START":
    case "TEXT_MESSAGE_END":
      return "assistant_message";
    case "TOOL_CALL_START":
    case "TOOL_CALL_END":
      return `tool:${(detail.toolCallName as string) ?? (detail.toolCallId as string) ?? "unknown"}`;
    case "TOOL_CALL_RESULT":
    case "tool_result":
      return `tool_result`;
    case "tambo.component.start":
    case "tambo.component.end":
      return `component:${(detail.name as string) ?? "unknown"}`;
    case "tambo.run.awaiting_input":
      return "awaiting_input";
    default:
      return event.type;
  }
}

/** Derives a status label. */
function getEventStatus(type: string): string {
  if (type === "RUN_STARTED") return "started";
  if (type === "RUN_FINISHED") return "complete";
  if (type === "RUN_ERROR") return "(failed)";
  if (type === "user_message") return "sent";
  if (type === "TEXT_MESSAGE_START") return "streaming";
  if (type === "TEXT_MESSAGE_END") return "complete";
  if (type === "TOOL_CALL_START") return "invoke";
  if (type === "TOOL_CALL_END") return "complete";
  if (type === "TOOL_CALL_RESULT" || type === "tool_result") return "success";
  if (type === "tambo.component.start") return "started";
  if (type === "tambo.component.end") return "complete";
  if (type === "tambo.run.awaiting_input") return "pending";
  return type;
}

/** Derives an initiator label. */
function getEventInitiator(event: DevtoolsEvent): string {
  switch (event.type) {
    case "RUN_STARTED":
    case "RUN_FINISHED":
    case "RUN_ERROR":
    case "tambo.run.awaiting_input":
      return "system";
    case "user_message":
      return `thread`;
    case "TEXT_MESSAGE_START":
    case "TEXT_MESSAGE_END":
    case "TOOL_CALL_START":
    case "TOOL_CALL_END":
    case "tambo.component.start":
    case "tambo.component.end":
      return "assistant";
    case "TOOL_CALL_RESULT":
    case "tool_result":
      return "tool_call";
    default:
      return "system";
  }
}

/** Formats milliseconds to a human-readable string. */
function formatTime(ms: number): string {
  if (ms < 1) return "<1 ms";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

/** Computes nice ruler tick positions for a given time range. */
function computeRulerTicks(rangeMs: number): number[] {
  if (rangeMs <= 0) return [0];
  // Pick a step that gives ~4-8 ticks
  const steps = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
  const idealStep = rangeMs / 5;
  const step = steps.find((s) => s >= idealStep) ?? rangeMs / 4;
  const ticks: number[] = [];
  for (let t = 0; t <= rangeMs; t += step) {
    ticks.push(t);
  }
  return ticks;
}

const COLUMN_WIDTHS = {
  name: "25%",
  status: "10%",
  initiator: "10%",
  time: "10%",
  threadId: "15%",
  waterfall: "30%",
};

/**
 * Timeline view showing a table of devtools events with a waterfall visualization.
 * @param props - Events and clear callback
 * @returns Timeline table with waterfall chart
 */
export const TimelineView: React.FC<TimelineViewProps> = ({
  events,
  onClear,
}) => {
  const styles = getStyles();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  // Track scroll position to determine auto-scroll behavior
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
    shouldAutoScroll.current = isAtBottom;
  }, []);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (shouldAutoScroll.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length]);

  const timeRange = useMemo(() => {
    if (events.length === 0) return { start: 0, range: 0 };
    const start = events[0].timestamp;
    const end = events[events.length - 1].timestamp;
    return { start, range: Math.max(end - start, 1) };
  }, [events]);

  const rulerTicks = useMemo(
    () => computeRulerTicks(timeRange.range),
    [timeRange.range],
  );

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) ?? null,
    [events, selectedEventId],
  );

  if (events.length === 0) {
    return (
      <div
        style={{
          ...styles.emptyState,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={styles.emptyStateHeading}>No events captured</div>
        <div>Send a message to see timeline events appear here.</div>
      </div>
    );
  }

  return (
    <div style={styles.timelineContainer}>
      {/* Toolbar */}
      <div style={styles.timelineToolbar}>
        <span style={{ fontSize: 11, color: "var(--tdt-text-muted)" }}>
          {events.length} event{events.length !== 1 ? "s" : ""}
        </span>
        <button
          style={styles.timelineClearButton}
          onClick={onClear}
          aria-label="Clear timeline"
        >
          Clear
        </button>
      </div>

      {/* Waterfall ruler */}
      <div style={styles.timelineWaterfallRuler}>
        {rulerTicks.map((tick) => (
          <span
            key={tick}
            style={{
              ...styles.timelineWaterfallTick,
              left: `${(tick / timeRange.range) * 100}%`,
            }}
          >
            {formatTime(tick)}
          </span>
        ))}
      </div>

      {/* Table */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}
      >
        <table style={styles.timelineTable}>
          <thead>
            <tr style={styles.timelineHeaderRow}>
              <th
                style={{
                  ...styles.timelineHeaderCell,
                  width: COLUMN_WIDTHS.name,
                }}
              >
                Name
              </th>
              <th
                style={{
                  ...styles.timelineHeaderCell,
                  width: COLUMN_WIDTHS.status,
                }}
              >
                Status
              </th>
              <th
                style={{
                  ...styles.timelineHeaderCell,
                  width: COLUMN_WIDTHS.initiator,
                }}
              >
                Initiator
              </th>
              <th
                style={{
                  ...styles.timelineHeaderCell,
                  width: COLUMN_WIDTHS.time,
                }}
              >
                Time
              </th>
              <th
                style={{
                  ...styles.timelineHeaderCell,
                  width: COLUMN_WIDTHS.threadId,
                }}
              >
                Thread
              </th>
              <th
                style={{
                  ...styles.timelineHeaderCell,
                  width: COLUMN_WIDTHS.waterfall,
                }}
              >
                Waterfall
              </th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => {
              const color = getEventColor(event.type);
              const isSelected = event.id === selectedEventId;
              const offsetPct =
                ((event.timestamp - timeRange.start) / timeRange.range) * 100;

              return (
                <tr
                  key={event.id}
                  style={{
                    ...styles.timelineRow,
                    ...(isSelected ? styles.timelineRowSelected : {}),
                  }}
                  onClick={() =>
                    setSelectedEventId(isSelected ? null : event.id)
                  }
                  aria-selected={isSelected}
                >
                  {/* Name */}
                  <td style={styles.timelineCell}>
                    <div style={styles.timelineCellName}>
                      <span
                        style={{
                          ...styles.timelineIcon,
                          backgroundColor: color,
                        }}
                      />
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {getEventName(event)}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td style={styles.timelineCell}>
                    <span
                      style={{
                        ...styles.timelineStatusBadge,
                        backgroundColor: `color-mix(in oklch, ${color} 20%, transparent)`,
                        color,
                      }}
                    >
                      {getEventStatus(event.type)}
                    </span>
                  </td>

                  {/* Initiator */}
                  <td
                    style={{
                      ...styles.timelineCell,
                      color: "var(--tdt-text-muted)",
                    }}
                  >
                    {getEventInitiator(event)}
                  </td>

                  {/* Time */}
                  <td
                    style={{
                      ...styles.timelineCell,
                      fontFamily:
                        'ui-monospace, "Cascadia Code", "Fira Code", monospace',
                      fontSize: 11,
                    }}
                  >
                    {formatTime(event.timestamp - timeRange.start)}
                  </td>

                  {/* Thread ID */}
                  <td
                    style={{
                      ...styles.timelineCell,
                      color: "var(--tdt-text-faint)",
                      fontSize: 11,
                    }}
                  >
                    {event.threadId.length > 16
                      ? `${event.threadId.slice(0, 8)}...${event.threadId.slice(-6)}`
                      : event.threadId}
                  </td>

                  {/* Waterfall bar */}
                  <td style={styles.timelineWaterfallCell}>
                    <div
                      style={{
                        ...styles.timelineWaterfallBar,
                        left: `${offsetPct}%`,
                        width: 6,
                        backgroundColor: color,
                      }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detail panel for selected event */}
      {selectedEvent && (
        <div style={styles.timelineDetailPanel}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <span
              style={{
                ...styles.timelineIcon,
                backgroundColor: getEventColor(selectedEvent.type),
              }}
            />
            <span style={{ fontWeight: 600, fontSize: 13 }}>
              {getEventName(selectedEvent)}
            </span>
            <span style={{ color: "var(--tdt-text-faint)", fontSize: 11 }}>
              {selectedEvent.type}
            </span>
          </div>
          <pre style={styles.timelineDetailJson}>
            {JSON.stringify(
              {
                id: selectedEvent.id,
                type: selectedEvent.type,
                threadId: selectedEvent.threadId,
                runId: selectedEvent.runId,
                timestamp: formatTime(
                  selectedEvent.timestamp - timeRange.start,
                ),
                detail: selectedEvent.detail,
              },
              null,
              2,
            )}
          </pre>
        </div>
      )}
    </div>
  );
};
