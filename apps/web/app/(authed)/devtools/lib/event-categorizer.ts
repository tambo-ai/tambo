export type EventCategory =
  | "run"
  | "text"
  | "tool"
  | "component"
  | "thinking"
  | "other";

export interface TimelineEvent {
  seq: number;
  timestamp: number;
  threadId: string;
  eventType: string;
  category: EventCategory;
  summary: string;
  payload: Record<string, unknown>;
}

/**
 * Categorizes an AG-UI event type string into one of the predefined categories.
 *
 * @returns The event category.
 */
export function categorizeEvent(eventType: string): EventCategory {
  if (eventType.startsWith("RUN_")) return "run";
  if (eventType.startsWith("TEXT_MESSAGE_")) return "text";
  if (eventType.startsWith("TOOL_CALL_")) return "tool";
  if (eventType.startsWith("THINKING_")) return "thinking";
  if (eventType.startsWith("tambo.component.")) return "component";
  if (eventType.startsWith("tambo.run.")) return "tool";
  return "other";
}

/** Tailwind background classes for each event category badge. */
export const CATEGORY_COLORS: Record<EventCategory, string> = {
  run: "bg-blue-500",
  text: "bg-green-500",
  tool: "bg-orange-500",
  component: "bg-purple-500",
  thinking: "bg-gray-400",
  other: "bg-slate-400",
};

/**
 * Produces a human-readable one-liner summary for an event.
 *
 * @returns A short summary string.
 */
export function summarizeEvent(
  eventType: string,
  payload: Record<string, unknown>,
): string {
  switch (eventType) {
    case "TEXT_MESSAGE_CONTENT": {
      const delta = typeof payload.delta === "string" ? payload.delta : "";
      return delta.length > 50
        ? `${delta.slice(0, 50)}...`
        : delta || "Text chunk";
    }
    case "TOOL_CALL_START":
      return `Tool: ${typeof payload.name === "string" ? payload.name : "unknown"}`;
    case "TOOL_CALL_ARGS":
      return "Args chunk";
    case "TOOL_CALL_END":
      return "Tool call ended";
    case "TOOL_CALL_RESULT":
      return "Result received";
    case "RUN_STARTED":
      return "Run started";
    case "RUN_FINISHED":
      return "Run finished";
    case "RUN_ERROR": {
      const msg =
        typeof payload.message === "string" ? payload.message : "Unknown error";
      return `Error: ${msg.length > 50 ? `${msg.slice(0, 50)}...` : msg}`;
    }
    default:
      return eventType;
  }
}
