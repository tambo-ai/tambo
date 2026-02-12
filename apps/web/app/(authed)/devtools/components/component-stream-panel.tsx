"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import type { StateSnapshot } from "@/devtools-server/types";

import type { StreamEventFromServer } from "../hooks/use-devtools-connection";
import { JsonTreeViewer } from "./json-tree-viewer";

type ComponentStatus = "started" | "streaming" | "done";

interface ComponentGroup {
  componentId: string;
  componentName: string;
  status: ComponentStatus;
  events: StreamEventFromServer[];
  patches: Array<{
    timestamp: number;
    op: string;
    path: string;
    value: unknown;
  }>;
}

interface ComponentStreamPanelProps {
  events: StreamEventFromServer[];
  currentSnapshot?: StateSnapshot;
}

const COMPONENT_EVENT_TYPES = new Set(["CUSTOM", "custom"]);

const COMPONENT_EVENT_NAMES = new Set([
  "tambo.component.start",
  "tambo.component.props_delta",
  "tambo.component.state_delta",
  "tambo.component.end",
]);

function isComponentEvent(event: StreamEventFromServer): boolean {
  const payload = event.payload;
  const eventType = event.eventType;

  if (COMPONENT_EVENT_TYPES.has(eventType)) {
    const name = payload.name as string | undefined;
    if (name && COMPONENT_EVENT_NAMES.has(name)) {
      return true;
    }
  }

  return false;
}

function deriveStatus(events: StreamEventFromServer[]): ComponentStatus {
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    if (!event) continue;
    const name = String(event.payload.name ?? "");
    if (name === "tambo.component.end") return "done";
    if (
      name === "tambo.component.props_delta" ||
      name === "tambo.component.state_delta"
    )
      return "streaming";
    if (name === "tambo.component.start") return "started";
  }
  return "started";
}

function extractPatches(events: StreamEventFromServer[]) {
  const patches: ComponentGroup["patches"] = [];
  for (const event of events) {
    const name = event.payload.name as string | undefined;
    if (
      name !== "tambo.component.props_delta" &&
      name !== "tambo.component.state_delta"
    )
      continue;

    const value = event.payload.value as Record<string, unknown> | undefined;
    const operations = value?.operations as
      | Array<{ op: string; path: string; value?: unknown }>
      | undefined;
    if (!operations) continue;

    for (const op of operations) {
      patches.push({
        timestamp: event.timestamp,
        op: op.op,
        path: op.path,
        value: op.value,
      });
    }
  }
  return patches;
}

function getComponentId(event: StreamEventFromServer): string | undefined {
  const value = event.payload.value as Record<string, unknown> | undefined;
  return value?.componentId as string | undefined;
}

function getComponentName(event: StreamEventFromServer): string {
  const value = event.payload.value as Record<string, unknown> | undefined;
  return (value?.componentName as string | undefined) ?? "Unknown";
}

/**
 * Displays component streaming events grouped by component identity.
 * Shows lifecycle status, JSON Patch operations, and cumulative props.
 *
 * @returns A panel with component list and detail view for streaming inspection.
 */
export function ComponentStreamPanel({
  events,
  currentSnapshot,
}: ComponentStreamPanelProps) {
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    null,
  );

  const componentGroups = useMemo(() => {
    const componentEvents = events.filter(isComponentEvent);
    const groups = new Map<string, ComponentGroup>();

    for (const event of componentEvents) {
      const id = getComponentId(event);
      if (!id) continue;

      const existing = groups.get(id);
      if (existing) {
        existing.events.push(event);
      } else {
        groups.set(id, {
          componentId: id,
          componentName: getComponentName(event),
          status: "started",
          events: [event],
          patches: [],
        });
      }
    }

    for (const group of groups.values()) {
      group.status = deriveStatus(group.events);
      group.patches = extractPatches(group.events);
    }

    return Array.from(groups.values());
  }, [events]);

  const selectedGroup = componentGroups.find(
    (g) => g.componentId === selectedComponentId,
  );

  // Try to find cumulative props from snapshot
  const cumulativeProps = useMemo(() => {
    if (!selectedGroup || !currentSnapshot) return undefined;

    for (const thread of currentSnapshot.threads) {
      for (const message of thread.messages) {
        for (const content of message.content) {
          if (content.type === "component") {
            // Match by component name since snapshot doesn't have componentId
            if (content.name === selectedGroup.componentName) {
              return content.props;
            }
          }
        }
      }
    }
    return undefined;
  }, [selectedGroup, currentSnapshot]);

  if (componentGroups.length === 0) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-lg border">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            No component streaming events yet.
          </p>
          <p className="text-xs text-muted-foreground">
            Components stream props via JSON Patch operations during AI
            responses.
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
            Components ({componentGroups.length})
          </h3>
          {componentGroups.map((group) => (
            <button
              key={group.componentId}
              className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent ${
                selectedComponentId === group.componentId ? "bg-accent" : ""
              }`}
              onClick={() => setSelectedComponentId(group.componentId)}
            >
              <span className="truncate font-medium">
                {group.componentName}
              </span>
              <ComponentStatusBadge status={group.status} />
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-y-auto p-4">
        {selectedGroup ? (
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-medium">
                {selectedGroup.componentName}
              </h3>
              <div className="flex items-center gap-2 pt-1">
                <LifecycleStepper status={selectedGroup.status} />
              </div>
            </div>

            <div>
              <h4 className="pb-2 text-xs font-medium uppercase text-muted-foreground">
                Patch Log ({selectedGroup.patches.length})
              </h4>
              {selectedGroup.patches.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No patches received yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-1 pr-3">Time</th>
                        <th className="pb-1 pr-3">Op</th>
                        <th className="pb-1 pr-3">Path</th>
                        <th className="pb-1">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedGroup.patches.map((patch, i) => (
                        <tr key={i} className="border-b">
                          <td className="py-1 pr-3 font-mono text-muted-foreground">
                            {new Date(patch.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="py-1 pr-3">
                            <OpBadge op={patch.op} />
                          </td>
                          <td className="py-1 pr-3 font-mono">{patch.path}</td>
                          <td className="max-w-[200px] truncate py-1 font-mono">
                            {JSON.stringify(patch.value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <h4 className="pb-2 text-xs font-medium uppercase text-muted-foreground">
                Cumulative Props
              </h4>
              {cumulativeProps ? (
                <JsonTreeViewer data={cumulativeProps} defaultExpanded />
              ) : (
                <div className="rounded-md bg-muted p-2">
                  <p className="text-xs text-muted-foreground">
                    Props not available from snapshot. Component may not be in
                    current state.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Select a component to view streaming details.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ComponentStatusBadge({ status }: { status: ComponentStatus }) {
  switch (status) {
    case "started":
      return (
        <Badge variant="secondary" className="animate-pulse text-xs">
          started
        </Badge>
      );
    case "streaming":
      return <Badge className="animate-pulse text-xs">streaming</Badge>;
    case "done":
      return (
        <Badge variant="outline" className="text-xs">
          done
        </Badge>
      );
  }
}

function LifecycleStepper({ status }: { status: ComponentStatus }) {
  const steps: ComponentStatus[] = ["started", "streaming", "done"];
  const currentIndex = steps.indexOf(status);

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-1">
          <Badge
            variant={i <= currentIndex ? "default" : "outline"}
            className={`text-xs ${i === currentIndex ? "ring-1 ring-ring" : ""}`}
          >
            {step}
          </Badge>
          {i < steps.length - 1 && (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ))}
    </div>
  );
}

function OpBadge({ op }: { op: string }) {
  switch (op) {
    case "add":
      return (
        <Badge className="bg-green-600 text-xs hover:bg-green-600">add</Badge>
      );
    case "replace":
      return (
        <Badge className="bg-blue-600 text-xs hover:bg-blue-600">replace</Badge>
      );
    case "remove":
      return (
        <Badge className="bg-red-600 text-xs hover:bg-red-600">remove</Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-xs">
          {op}
        </Badge>
      );
  }
}
