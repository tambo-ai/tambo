import { EventType } from "@ag-ui/core";
import type { JSONSchema7 } from "json-schema";
import { ToolCallTracker } from "./tool-call-tracker";

/** Helper to create a tracker with a started tool call. */
function createTrackerWithToolCall(
  toolCallId = "call_1",
  toolCallName = "get_weather",
  toolSchemas?: Map<string, JSONSchema7>,
): ToolCallTracker {
  const tracker = new ToolCallTracker(toolSchemas);
  tracker.handleEvent({
    type: EventType.TOOL_CALL_START,
    toolCallId,
    toolCallName,
    parentMessageId: "msg_1",
  });
  return tracker;
}

describe("ToolCallTracker", () => {
  describe("getAccumulatingToolCall", () => {
    it("returns undefined for unknown tool call ID", () => {
      const tracker = new ToolCallTracker();
      expect(tracker.getAccumulatingToolCall("nonexistent")).toBeUndefined();
    });

    it("returns name and empty accumulated args after TOOL_CALL_START", () => {
      const tracker = new ToolCallTracker();
      tracker.handleEvent({
        type: EventType.TOOL_CALL_START,
        toolCallId: "call_1",
        toolCallName: "write_story",
        parentMessageId: "msg_1",
      });

      const result = tracker.getAccumulatingToolCall("call_1");
      expect(result).toEqual({ name: "write_story", accumulatedArgs: "" });
    });

    it("returns name and accumulated args after START + ARGS events", () => {
      const tracker = new ToolCallTracker();
      tracker.handleEvent({
        type: EventType.TOOL_CALL_START,
        toolCallId: "call_1",
        toolCallName: "write_story",
        parentMessageId: "msg_1",
      });
      tracker.handleEvent({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "call_1",
        delta: '{"title":"Once',
      });

      const result = tracker.getAccumulatingToolCall("call_1");
      expect(result).toEqual({
        name: "write_story",
        accumulatedArgs: '{"title":"Once',
      });
    });

    it("accumulates multiple ARGS deltas", () => {
      const tracker = new ToolCallTracker();
      tracker.handleEvent({
        type: EventType.TOOL_CALL_START,
        toolCallId: "call_1",
        toolCallName: "write_story",
        parentMessageId: "msg_1",
      });
      tracker.handleEvent({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "call_1",
        delta: '{"title":',
      });
      tracker.handleEvent({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "call_1",
        delta: '"Hello"}',
      });

      const result = tracker.getAccumulatingToolCall("call_1");
      expect(result).toEqual({
        name: "write_story",
        accumulatedArgs: '{"title":"Hello"}',
      });
    });
  });

  describe("handleEvent - TOOL_CALL_END", () => {
    it("parses accumulated JSON on TOOL_CALL_END", () => {
      const tracker = createTrackerWithToolCall();
      tracker.handleEvent({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "call_1",
        delta: '{"city":"NYC"}',
      });
      tracker.handleEvent({
        type: EventType.TOOL_CALL_END,
        toolCallId: "call_1",
      });

      const result = tracker.getToolCallsById(["call_1"]);
      expect(result.get("call_1")?.input).toEqual({ city: "NYC" });
    });

    it("throws on invalid JSON at TOOL_CALL_END", () => {
      const tracker = createTrackerWithToolCall();
      tracker.handleEvent({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "call_1",
        delta: "{not valid json",
      });

      expect(() =>
        tracker.handleEvent({
          type: EventType.TOOL_CALL_END,
          toolCallId: "call_1",
        }),
      ).toThrow("Failed to parse tool call arguments for call_1");
    });
  });

  describe("TOOL_CALL_END with unstrictification", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        city: { type: "string" },
        units: { type: "string" },
      },
      required: ["city"],
    };

    it("strips null optional params when schema is provided", () => {
      const toolSchemas = new Map<string, JSONSchema7>([
        ["get_weather", schema],
      ]);
      const tracker = createTrackerWithToolCall(
        "call_1",
        "get_weather",
        toolSchemas,
      );
      tracker.handleEvent({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "call_1",
        delta: '{"city":"Seattle","units":null}',
      });
      tracker.handleEvent({
        type: EventType.TOOL_CALL_END,
        toolCallId: "call_1",
      });

      const result = tracker.getToolCallsById(["call_1"]);
      expect(result.get("call_1")?.input).toEqual({ city: "Seattle" });
    });

    it("preserves required null params", () => {
      const toolSchemas = new Map<string, JSONSchema7>([
        ["get_weather", schema],
      ]);
      const tracker = createTrackerWithToolCall(
        "call_1",
        "get_weather",
        toolSchemas,
      );
      tracker.handleEvent({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "call_1",
        delta: '{"city":null,"units":null}',
      });
      tracker.handleEvent({
        type: EventType.TOOL_CALL_END,
        toolCallId: "call_1",
      });

      const result = tracker.getToolCallsById(["call_1"]);
      // city is required, so null is preserved; units is optional, so null is stripped
      expect(result.get("call_1")?.input).toEqual({ city: null });
    });

    it("does not unstrictify when no schema is provided", () => {
      const tracker = createTrackerWithToolCall();
      tracker.handleEvent({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "call_1",
        delta: '{"city":"Seattle","units":null}',
      });
      tracker.handleEvent({
        type: EventType.TOOL_CALL_END,
        toolCallId: "call_1",
      });

      const result = tracker.getToolCallsById(["call_1"]);
      // Without schema, nulls are preserved
      expect(result.get("call_1")?.input).toEqual({
        city: "Seattle",
        units: null,
      });
    });

    it("preserves _tambo_* pass-through params", () => {
      const toolSchemas = new Map<string, JSONSchema7>([
        ["get_weather", schema],
      ]);
      const tracker = createTrackerWithToolCall(
        "call_1",
        "get_weather",
        toolSchemas,
      );
      tracker.handleEvent({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "call_1",
        delta:
          '{"city":"Seattle","units":null,"_tambo_statusMessage":"Loading"}',
      });
      tracker.handleEvent({
        type: EventType.TOOL_CALL_END,
        toolCallId: "call_1",
      });

      const result = tracker.getToolCallsById(["call_1"]);
      expect(result.get("call_1")?.input).toEqual({
        city: "Seattle",
        _tambo_statusMessage: "Loading",
      });
    });
  });
});
