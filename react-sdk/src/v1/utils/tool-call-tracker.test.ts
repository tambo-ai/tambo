import { EventType } from "@ag-ui/core";
import { ToolCallTracker } from "./tool-call-tracker";

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
});
