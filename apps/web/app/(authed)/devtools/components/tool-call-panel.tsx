"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";

import type { StreamEventFromServer } from "../hooks/use-devtools-connection";
import { JsonTreeViewer } from "./json-tree-viewer";

type ToolCallStatus =
  | "calling"
  | "args complete"
  | "awaiting input"
  | "complete"
  | "error";

interface ToolCallGroup {
  toolCallId: string;
  toolName: string;
  status: ToolCallStatus;
  args: Record<string, unknown> | undefined;
  result: unknown;
  events: StreamEventFromServer[];
  firstTimestamp: number;
  lastTimestamp: number;
}

interface ToolCallPanelProps {
  events: StreamEventFromServer[];
}

const TOOL_EVENT_TYPES = new Set([
  "TOOL_CALL_START",
  "TOOL_CALL_ARGS",
  "TOOL_CALL_END",
  "TOOL_CALL_RESULT",
]);

function isToolEvent(event: StreamEventFromServer): boolean {
  if (TOOL_EVENT_TYPES.has(event.eventType)) return true;
  // Also check for custom awaiting_input events
  if (
    (event.eventType === "CUSTOM" || event.eventType === "custom") &&
    event.payload.name === "tambo.run.awaiting_input"
  ) {
    return true;
  }
  return false;
}

function getToolCallId(event: StreamEventFromServer): string | undefined {
  return event.payload.toolCallId as string | undefined;
}

function deriveToolStatus(events: StreamEventFromServer[]): ToolCallStatus {
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    if (!event) continue;

    if (event.eventType === "TOOL_CALL_RESULT") return "complete";
    if (
      (event.eventType === "CUSTOM" || event.eventType === "custom") &&
      event.payload.name === "tambo.run.awaiting_input"
    )
      return "awaiting input";
    if (event.eventType === "TOOL_CALL_END") return "args complete";
    if (event.eventType === "TOOL_CALL_ARGS") return "calling";
    if (event.eventType === "TOOL_CALL_START") return "calling";
  }
  return "calling";
}

function accumulateArgs(
  events: StreamEventFromServer[],
): Record<string, unknown> | undefined {
  let args: string = "";
  for (const event of events) {
    if (event.eventType === "TOOL_CALL_ARGS") {
      const delta = event.payload.delta as string | undefined;
      if (delta) args += delta;
    }
  }
  if (!args) return undefined;
  try {
    return JSON.parse(args) as Record<string, unknown>;
  } catch {
    return { raw: args };
  }
}

function extractResult(events: StreamEventFromServer[]): unknown {
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    if (!event) continue;
    if (event.eventType === "TOOL_CALL_RESULT") {
      return event.payload.result ?? event.payload.content;
    }
  }
  return undefined;
}

/**
 * Displays tool call events grouped by toolCallId with lifecycle tracking.
 * Shows status badges, accumulated arguments, and results.
 *
 * @returns A panel with tool call list and detail view.
 */
export function ToolCallPanel({ events }: ToolCallPanelProps) {
  const [selectedToolCallId, setSelectedToolCallId] = useState<string | null>(
    null,
  );

  const toolCallGroups = useMemo(() => {
    const toolEvents = events.filter(isToolEvent);
    const groups = new Map<string, ToolCallGroup>();

    for (const event of toolEvents) {
      const id = getToolCallId(event);
      if (!id) continue;

      const existing = groups.get(id);
      if (existing) {
        existing.events.push(event);
        existing.lastTimestamp = event.timestamp;
      } else {
        groups.set(id, {
          toolCallId: id,
          toolName: (event.payload.toolName as string) ?? "unknown",
          status: "calling",
          args: undefined,
          result: undefined,
          events: [event],
          firstTimestamp: event.timestamp,
          lastTimestamp: event.timestamp,
        });
      }
    }

    for (const group of groups.values()) {
      group.status = deriveToolStatus(group.events);
      group.args = accumulateArgs(group.events);
      group.result = extractResult(group.events);
    }

    // Newest first
    return Array.from(groups.values()).toSorted(
      (a, b) => b.firstTimestamp - a.firstTimestamp,
    );
  }, [events]);

  const selectedGroup = toolCallGroups.find(
    (g) => g.toolCallId === selectedToolCallId,
  );

  if (toolCallGroups.length === 0) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-lg border">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">No tool calls yet.</p>
          <p className="text-xs text-muted-foreground">
            Tool calls appear here as the AI invokes tools during responses.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-[600px] grid-cols-1 gap-4 rounded-lg border lg:grid-cols-[280px_1fr]">
      <div className="overflow-y-auto border-r">
        <div className="p-2">
          <h3 className="px-2 pb-2 text-xs font-medium uppercase text-muted-foreground">
            Tool Calls ({toolCallGroups.length})
          </h3>
          {toolCallGroups.map((group) => (
            <button
              key={group.toolCallId}
              className={`flex w-full flex-col gap-0.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent ${
                selectedToolCallId === group.toolCallId ? "bg-accent" : ""
              }`}
              onClick={() => setSelectedToolCallId(group.toolCallId)}
            >
              <div className="flex w-full items-center justify-between">
                <span className="truncate font-medium">{group.toolName}</span>
                <ToolStatusBadge status={group.status} />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {new Date(group.firstTimestamp).toLocaleTimeString()}
                </span>
                {group.lastTimestamp > group.firstTimestamp && (
                  <span>
                    (
                    {Math.round(
                      (group.lastTimestamp - group.firstTimestamp) / 1000,
                    )}
                    s)
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-y-auto p-4">
        {selectedGroup ? (
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-medium">{selectedGroup.toolName}</h3>
              <p className="text-xs text-muted-foreground">
                ID: {selectedGroup.toolCallId}
              </p>
            </div>

            <div>
              <h4 className="pb-2 text-xs font-medium uppercase text-muted-foreground">
                Lifecycle ({selectedGroup.events.length} events)
              </h4>
              <div className="flex flex-col gap-1">
                {selectedGroup.events.map((event, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs">
                      {i + 1}
                    </div>
                    <span className="font-mono text-xs">
                      {event.eventType}
                      {event.eventType === "CUSTOM" ||
                      event.eventType === "custom"
                        ? `: ${event.payload.name as string}`
                        : ""}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {selectedGroup.args && (
              <div>
                <h4 className="pb-2 text-xs font-medium uppercase text-muted-foreground">
                  Arguments
                </h4>
                <JsonTreeViewer data={selectedGroup.args} defaultExpanded />
              </div>
            )}

            {selectedGroup.result !== undefined && (
              <div>
                <h4 className="pb-2 text-xs font-medium uppercase text-muted-foreground">
                  Result
                </h4>
                <JsonTreeViewer data={selectedGroup.result} defaultExpanded />
              </div>
            )}

            {selectedGroup.status === "awaiting input" && (
              <div className="rounded-md border border-blue-200 bg-blue-50 p-2 dark:border-blue-800 dark:bg-blue-950">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Awaiting client-side tool execution. The run is paused until
                  the tool result is provided.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Select a tool call to view lifecycle details.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ToolStatusBadge({ status }: { status: ToolCallStatus }) {
  switch (status) {
    case "calling":
      return (
        <Badge className="bg-orange-600 text-xs hover:bg-orange-600">
          calling
        </Badge>
      );
    case "args complete":
      return (
        <Badge className="bg-yellow-600 text-xs hover:bg-yellow-600">
          args complete
        </Badge>
      );
    case "awaiting input":
      return (
        <Badge className="animate-pulse bg-blue-600 text-xs hover:bg-blue-600">
          awaiting input
        </Badge>
      );
    case "complete":
      return (
        <Badge className="bg-green-600 text-xs hover:bg-green-600">
          complete
        </Badge>
      );
    case "error":
      return (
        <Badge variant="destructive" className="text-xs">
          error
        </Badge>
      );
  }
}
