import { EventType } from "@ag-ui/core";
import type { Operation } from "fast-json-patch";
import { ToolCallTracker } from "./tool-call-tracker";

/** Helper to create a tracker with a started tool call. */
function createTrackerWithToolCall(
  toolCallId = "call_1",
  toolCallName = "get_weather",
): ToolCallTracker {
  const tracker = new ToolCallTracker();
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

  describe("applyArgsPatch", () => {
    it("applies add operations to tool call input", () => {
      const tracker = createTrackerWithToolCall();
      const ops: Operation[] = [{ op: "add", path: "/city", value: "NYC" }];

      const result = tracker.applyArgsPatch("call_1", ops);
      expect(result).toEqual({ city: "NYC" });
    });

    it("applies replace operations to existing input", () => {
      const tracker = createTrackerWithToolCall();
      tracker.applyArgsPatch("call_1", [
        { op: "add", path: "/city", value: "NYC" },
      ]);

      const result = tracker.applyArgsPatch("call_1", [
        { op: "replace", path: "/city", value: "LA" },
      ]);
      expect(result).toEqual({ city: "LA" });
    });

    it("returns undefined for unknown tool call ID", () => {
      const tracker = new ToolCallTracker();
      const result = tracker.applyArgsPatch("nonexistent", [
        { op: "add", path: "/city", value: "NYC" },
      ]);
      expect(result).toBeUndefined();
    });

    it("persists patched input for subsequent getToolCallsById", () => {
      const tracker = createTrackerWithToolCall();
      tracker.applyArgsPatch("call_1", [
        { op: "add", path: "/city", value: "NYC" },
      ]);
      tracker.applyArgsPatch("call_1", [
        { op: "add", path: "/units", value: "metric" },
      ]);

      const result = tracker.getToolCallsById(["call_1"]);
      expect(result.get("call_1")?.input).toEqual({
        city: "NYC",
        units: "metric",
      });
    });
  });

  describe("setFinalArgs", () => {
    it("overrides tool call input with final args", () => {
      const tracker = createTrackerWithToolCall();
      tracker.applyArgsPatch("call_1", [
        { op: "add", path: "/city", value: "NYC" },
        { op: "add", path: "/units", value: null },
      ]);

      tracker.setFinalArgs("call_1", { city: "NYC" });

      const result = tracker.getToolCallsById(["call_1"]);
      expect(result.get("call_1")?.input).toEqual({ city: "NYC" });
    });

    it("does nothing for unknown tool call ID", () => {
      const tracker = new ToolCallTracker();
      // Should not throw
      tracker.setFinalArgs("nonexistent", { city: "NYC" });
    });
  });
});
