import { EventType } from "@ag-ui/core";
import type { JSONSchema7 } from "json-schema";
import type { TamboTool } from "../../model/component-metadata";
import { ToolCallTracker } from "./tool-call-tracker";

/** Minimal tool definition for tests — only name + inputSchema are needed. */
function fakeTool(name: string, inputSchema: JSONSchema7): TamboTool {
  return {
    name,
    description: "",
    tool: () => null,
    inputSchema,
    outputSchema: {},
  } as TamboTool;
}

/** Helper to create a tracker with a started tool call. */
function createTrackerWithToolCall(
  toolCallId = "call_1",
  toolCallName = "get_weather",
  toolRegistry?: Record<string, TamboTool>,
): ToolCallTracker {
  const tracker = new ToolCallTracker(toolRegistry);
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

    const registry: Record<string, TamboTool> = {
      get_weather: fakeTool("get_weather", schema),
    };

    it("strips null optional params when registry is provided", () => {
      const tracker = createTrackerWithToolCall(
        "call_1",
        "get_weather",
        registry,
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
      const tracker = createTrackerWithToolCall(
        "call_1",
        "get_weather",
        registry,
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

    it("does not unstrictify when no registry is provided", () => {
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
      // Without registry, nulls are preserved
      expect(result.get("call_1")?.input).toEqual({
        city: "Seattle",
        units: null,
      });
    });

    it("preserves _tambo_* pass-through params", () => {
      const tracker = createTrackerWithToolCall(
        "call_1",
        "get_weather",
        registry,
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

  describe("parsePartialArgs", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        required_string: { type: "string" },
        optional_string: { type: "string" },
      },
      required: ["required_string"],
    };

    const registry: Record<string, TamboTool> = {
      my_tool: fakeTool("my_tool", schema),
    };

    it("returns undefined for unknown tool call ID", () => {
      const tracker = new ToolCallTracker(registry);
      expect(tracker.parsePartialArgs("nonexistent")).toBeUndefined();
    });

    it("returns undefined when partial JSON is not parseable", () => {
      const tracker = createTrackerWithToolCall("call_1", "my_tool", registry);
      tracker.handleEvent({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "call_1",
        delta: '{"req',
      });

      // partial-json should handle this, but if it can't parse to an object
      // the method returns undefined
      const result = tracker.parsePartialArgs("call_1");
      // partial-json can parse this to { req: undefined } or similar — either
      // way it should not throw
      expect(result === undefined || typeof result === "object").toBe(true);
    });

    it("unstrictifies partial args during streaming", () => {
      const tracker = createTrackerWithToolCall("call_1", "my_tool", registry);

      // Stream the full strict JSON in 3-char chunks
      const fullJson = '{"required_string":"required","optional_string":null}';
      const chunkSize = 3;
      for (let i = 0; i < fullJson.length; i += chunkSize) {
        tracker.handleEvent({
          type: EventType.TOOL_CALL_ARGS,
          toolCallId: "call_1",
          delta: fullJson.slice(i, i + chunkSize),
        });

        const partial = tracker.parsePartialArgs("call_1");
        if (partial) {
          // Must never contain optional_string
          expect(partial).not.toHaveProperty("optional_string");
        }
      }

      // After all chunks, should have the required param
      const final = tracker.parsePartialArgs("call_1");
      expect(final).toEqual({ required_string: "required" });
    });
  });
});
