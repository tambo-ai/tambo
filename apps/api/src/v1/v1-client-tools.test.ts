import { EventType, type BaseEvent } from "@ag-ui/client";
import { JSONSchema7 } from "json-schema";
import {
  ClientToolCallTracker,
  createAwaitingInputEvent,
  type AwaitingInputEvent,
} from "./v1-client-tools";

describe("v1-client-tools", () => {
  describe("ClientToolCallTracker", () => {
    let tracker: ClientToolCallTracker;
    const clientToolNames = new Set([
      "get_weather",
      "client_tool",
      "test_tool",
      "large_tool",
      "tool_a",
      "tool_b",
      "tool_c",
    ]);

    beforeEach(() => {
      tracker = new ClientToolCallTracker(clientToolNames);
    });

    describe("tracking tool calls", () => {
      it("tracks a tool call that starts and ends without result (client tool)", () => {
        // Simulate a tool call flow without result
        tracker.processEvent({
          type: EventType.TOOL_CALL_START,
          toolCallId: "call_123",
          toolCallName: "get_weather",
          timestamp: Date.now(),
        } as unknown as BaseEvent);

        tracker.processEvent({
          type: EventType.TOOL_CALL_ARGS,
          toolCallId: "call_123",
          delta: '{"location":',
          timestamp: Date.now(),
        } as unknown as BaseEvent);

        tracker.processEvent({
          type: EventType.TOOL_CALL_ARGS,
          toolCallId: "call_123",
          delta: '"NYC"}',
          timestamp: Date.now(),
        } as unknown as BaseEvent);

        tracker.processEvent({
          type: EventType.TOOL_CALL_END,
          toolCallId: "call_123",
          timestamp: Date.now(),
        } as unknown as BaseEvent);

        // Should have one pending tool call
        expect(tracker.hasPendingToolCalls()).toBe(true);
        const pending = tracker.getPendingToolCalls();
        expect(pending).toHaveLength(1);
        expect(pending[0].toolCallId).toBe("call_123");
        expect(pending[0].toolName).toBe("get_weather");
        expect(pending[0].arguments).toBe('{"location":"NYC"}');
      });

      it("ignores tool calls that are not declared as client tools", () => {
        tracker.processEvent({
          type: EventType.TOOL_CALL_START,
          toolCallId: "call_456",
          toolCallName: "system_tool",
          timestamp: Date.now(),
        } as unknown as BaseEvent);

        tracker.processEvent({
          type: EventType.TOOL_CALL_ARGS,
          toolCallId: "call_456",
          delta: "{}",
          timestamp: Date.now(),
        } as unknown as BaseEvent);

        tracker.processEvent({
          type: EventType.TOOL_CALL_END,
          toolCallId: "call_456",
          timestamp: Date.now(),
        } as unknown as BaseEvent);

        tracker.processEvent({
          type: EventType.TOOL_CALL_RESULT,
          toolCallId: "call_456",
          content: "Result from system",
          timestamp: Date.now(),
        } as unknown as BaseEvent);

        // No pending tool calls
        expect(tracker.hasPendingToolCalls()).toBe(false);
        expect(tracker.getPendingToolCalls()).toHaveLength(0);
      });

      it("tracks multiple tool calls correctly", () => {
        // Start two tool calls
        tracker.processEvent({
          type: EventType.TOOL_CALL_START,
          toolCallId: "call_1",
          toolCallName: "client_tool",
          timestamp: Date.now(),
        } as unknown as BaseEvent);

        tracker.processEvent({
          type: EventType.TOOL_CALL_START,
          toolCallId: "call_2",
          toolCallName: "system_tool",
          timestamp: Date.now(),
        } as unknown as BaseEvent);

        // End both
        tracker.processEvent({
          type: EventType.TOOL_CALL_END,
          toolCallId: "call_1",
          timestamp: Date.now(),
        } as unknown as BaseEvent);

        tracker.processEvent({
          type: EventType.TOOL_CALL_END,
          toolCallId: "call_2",
          timestamp: Date.now(),
        } as unknown as BaseEvent);

        // Only call_2 gets a result (system tool)
        tracker.processEvent({
          type: EventType.TOOL_CALL_RESULT,
          toolCallId: "call_2",
          content: "Result",
          timestamp: Date.now(),
        } as unknown as BaseEvent);

        // Only call_1 should be pending
        expect(tracker.hasPendingToolCalls()).toBe(true);
        const pending = tracker.getPendingToolCalls();
        expect(pending).toHaveLength(1);
        expect(pending[0].toolCallId).toBe("call_1");
        expect(pending[0].toolName).toBe("client_tool");
      });

      it("returns empty when no tool calls tracked", () => {
        expect(tracker.hasPendingToolCalls()).toBe(false);
        expect(tracker.getPendingToolCalls()).toHaveLength(0);
        expect(tracker.getPendingToolCallIds()).toHaveLength(0);
      });

      it("accumulates arguments across multiple TOOL_CALL_ARGS events", () => {
        tracker.processEvent({
          type: EventType.TOOL_CALL_START,
          toolCallId: "call_1",
          toolCallName: "test_tool",
          timestamp: Date.now(),
        } as unknown as BaseEvent);

        tracker.processEvent({
          type: EventType.TOOL_CALL_ARGS,
          toolCallId: "call_1",
          delta: '{"key1":',
          timestamp: Date.now(),
        } as unknown as BaseEvent);

        tracker.processEvent({
          type: EventType.TOOL_CALL_ARGS,
          toolCallId: "call_1",
          delta: '"value1",',
          timestamp: Date.now(),
        } as unknown as BaseEvent);

        tracker.processEvent({
          type: EventType.TOOL_CALL_ARGS,
          toolCallId: "call_1",
          delta: '"key2":"value2"}',
          timestamp: Date.now(),
        } as unknown as BaseEvent);

        tracker.processEvent({
          type: EventType.TOOL_CALL_END,
          toolCallId: "call_1",
          timestamp: Date.now(),
        } as unknown as BaseEvent);

        const pending = tracker.getPendingToolCalls();
        expect(pending[0].arguments).toBe('{"key1":"value1","key2":"value2"}');
      });

      it("handles TOOL_CALL_CHUNK as an alias for TOOL_CALL_ARGS", () => {
        tracker.processEvent({
          type: EventType.TOOL_CALL_START,
          toolCallId: "call_1",
          toolCallName: "test_tool",
          timestamp: Date.now(),
        } as unknown as BaseEvent);

        tracker.processEvent({
          type: EventType.TOOL_CALL_CHUNK,
          toolCallId: "call_1",
          delta: '{"data":"test"}',
          timestamp: Date.now(),
        } as unknown as BaseEvent);

        tracker.processEvent({
          type: EventType.TOOL_CALL_END,
          toolCallId: "call_1",
          timestamp: Date.now(),
        } as unknown as BaseEvent);

        const pending = tracker.getPendingToolCalls();
        expect(pending[0].arguments).toBe('{"data":"test"}');
      });

      it("throws error when tool call arguments exceed 1MB limit", () => {
        tracker.processEvent({
          type: EventType.TOOL_CALL_START,
          toolCallId: "call_large",
          toolCallName: "large_tool",
          timestamp: Date.now(),
        } as unknown as BaseEvent);

        // Send a chunk that exceeds the 1MB limit
        const oversizedChunk = "x".repeat(1024 * 1024 + 1);

        expect(() => {
          tracker.processEvent({
            type: EventType.TOOL_CALL_ARGS,
            toolCallId: "call_large",
            delta: oversizedChunk,
            timestamp: Date.now(),
          } as unknown as BaseEvent);
        }).toThrow("Tool call call_large arguments exceed maximum size of");
      });

      it("throws error when accumulated arguments exceed 1MB limit", () => {
        tracker.processEvent({
          type: EventType.TOOL_CALL_START,
          toolCallId: "call_large",
          toolCallName: "large_tool",
          timestamp: Date.now(),
        } as unknown as BaseEvent);

        // Send a chunk close to the limit
        const nearLimitChunk = "x".repeat(1024 * 1024 - 100);
        tracker.processEvent({
          type: EventType.TOOL_CALL_ARGS,
          toolCallId: "call_large",
          delta: nearLimitChunk,
          timestamp: Date.now(),
        } as unknown as BaseEvent);

        // This should throw as it exceeds the limit
        expect(() => {
          tracker.processEvent({
            type: EventType.TOOL_CALL_ARGS,
            toolCallId: "call_large",
            delta: "y".repeat(200),
            timestamp: Date.now(),
          } as unknown as BaseEvent);
        }).toThrow("Tool call call_large arguments exceed maximum size of");
      });

      it("gracefully handles TOOL_CALL_ARGS for unknown tool call ID", () => {
        // Send args without a prior start event - should not crash
        tracker.processEvent({
          type: EventType.TOOL_CALL_ARGS,
          toolCallId: "unknown_call",
          delta: '{"data":"test"}',
          timestamp: Date.now(),
        } as unknown as BaseEvent);

        // Should not crash and should not have any pending calls
        expect(tracker.hasPendingToolCalls()).toBe(false);
      });
    });

    describe("getPendingToolCallIds", () => {
      it("returns array of pending tool call IDs", () => {
        // Start three tool calls, complete one
        tracker.processEvent({
          type: EventType.TOOL_CALL_START,
          toolCallId: "a",
          toolCallName: "tool_a",
          timestamp: Date.now(),
        } as unknown as BaseEvent);

        tracker.processEvent({
          type: EventType.TOOL_CALL_START,
          toolCallId: "b",
          toolCallName: "tool_b",
          timestamp: Date.now(),
        } as unknown as BaseEvent);

        tracker.processEvent({
          type: EventType.TOOL_CALL_START,
          toolCallId: "c",
          toolCallName: "tool_c",
          timestamp: Date.now(),
        } as unknown as BaseEvent);

        tracker.processEvent({
          type: EventType.TOOL_CALL_END,
          toolCallId: "a",
          timestamp: Date.now(),
        } as unknown as BaseEvent);

        tracker.processEvent({
          type: EventType.TOOL_CALL_END,
          toolCallId: "b",
          timestamp: Date.now(),
        } as unknown as BaseEvent);

        tracker.processEvent({
          type: EventType.TOOL_CALL_END,
          toolCallId: "c",
          timestamp: Date.now(),
        } as unknown as BaseEvent);

        tracker.processEvent({
          type: EventType.TOOL_CALL_RESULT,
          toolCallId: "b",
          content: "result",
          timestamp: Date.now(),
        } as unknown as BaseEvent);

        const ids = tracker.getPendingToolCallIds();
        expect(ids).toHaveLength(2);
        expect(ids).toContain("a");
        expect(ids).toContain("c");
        expect(ids).not.toContain("b");
      });
    });
  });

  describe("createAwaitingInputEvent", () => {
    it("creates a CUSTOM event with pending tool calls", () => {
      const pendingToolCalls = [
        {
          toolCallId: "call_123",
          toolName: "get_weather",
          arguments: '{"location":"NYC"}',
        },
        {
          toolCallId: "call_456",
          toolName: "get_stock",
          arguments: '{"symbol":"AAPL"}',
        },
      ];

      const event: AwaitingInputEvent =
        createAwaitingInputEvent(pendingToolCalls);

      expect(event.type).toBe(EventType.CUSTOM);
      expect(event.name).toBe("tambo.run.awaiting_input");
      expect(event.value).toEqual({
        pendingToolCalls: [
          {
            toolCallId: "call_123",
            toolName: "get_weather",
            arguments: '{"location":"NYC"}',
          },
          {
            toolCallId: "call_456",
            toolName: "get_stock",
            arguments: '{"symbol":"AAPL"}',
          },
        ],
      });
      expect(event.timestamp).toBeDefined();
      expect(typeof event.timestamp).toBe("number");
    });

    it("creates event with empty array when no pending calls", () => {
      const event = createAwaitingInputEvent([]);

      expect(event.type).toBe(EventType.CUSTOM);
      expect(event.value.pendingToolCalls).toEqual([]);
    });
  });

  describe("ClientToolCallTracker with schemas (unstrictification)", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        city: { type: "string" },
        units: { type: "string" },
      },
      required: ["city"],
    };

    function createTrackerWithSchema() {
      const names = new Set(["get_weather"]);
      const schemas = new Map<string, JSONSchema7>([["get_weather", schema]]);
      return new ClientToolCallTracker(names, schemas);
    }

    it("emits args_delta custom events for client tools with schemas", () => {
      const tracker = createTrackerWithSchema();

      tracker.processEvent({
        type: EventType.TOOL_CALL_START,
        toolCallId: "tc_1",
        toolCallName: "get_weather",
        timestamp: Date.now(),
      } as unknown as BaseEvent);

      const events = tracker.processEvent({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "tc_1",
        delta: '{"city": "Seattle"',
        timestamp: Date.now(),
      } as unknown as BaseEvent);

      expect(events.length).toBeGreaterThan(0);
      const argsDelta = events[0] as unknown as Record<string, unknown>;
      expect(argsDelta.name).toBe("tambo.tool_call.args_delta");
    });

    it("strips null optional params from finalized args", () => {
      const tracker = createTrackerWithSchema();

      tracker.processEvent({
        type: EventType.TOOL_CALL_START,
        toolCallId: "tc_1",
        toolCallName: "get_weather",
        timestamp: Date.now(),
      } as unknown as BaseEvent);

      tracker.processEvent({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "tc_1",
        delta: '{"city": "Seattle", "units": null}',
        timestamp: Date.now(),
      } as unknown as BaseEvent);

      const endEvents = tracker.processEvent({
        type: EventType.TOOL_CALL_END,
        toolCallId: "tc_1",
        timestamp: Date.now(),
      } as unknown as BaseEvent);

      // Should have a tambo.tool_call.end event with clean finalArgs
      const endEvent = endEvents.find(
        (e) =>
          (e as unknown as Record<string, unknown>).name ===
          "tambo.tool_call.end",
      ) as unknown as Record<string, unknown> | undefined;
      expect(endEvent).toBeDefined();
      const value = endEvent?.value as {
        finalArgs: Record<string, unknown>;
      };
      expect(value.finalArgs).toEqual({ city: "Seattle" });

      // getPendingToolCalls should return clean args
      const pending = tracker.getPendingToolCalls();
      expect(pending).toHaveLength(1);
      expect(JSON.parse(pending[0].arguments)).toEqual({ city: "Seattle" });
    });

    it("preserves _tambo_* pass-through params in finalized args", () => {
      const tracker = createTrackerWithSchema();

      tracker.processEvent({
        type: EventType.TOOL_CALL_START,
        toolCallId: "tc_1",
        toolCallName: "get_weather",
        timestamp: Date.now(),
      } as unknown as BaseEvent);

      tracker.processEvent({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "tc_1",
        delta:
          '{"city": "NYC", "units": null, "_tambo_statusMessage": "Fetching"}',
        timestamp: Date.now(),
      } as unknown as BaseEvent);

      tracker.processEvent({
        type: EventType.TOOL_CALL_END,
        toolCallId: "tc_1",
        timestamp: Date.now(),
      } as unknown as BaseEvent);

      const pending = tracker.getPendingToolCalls();
      const args = JSON.parse(pending[0].arguments) as Record<string, unknown>;
      expect(args.city).toBe("NYC");
      expect(args._tambo_statusMessage).toBe("Fetching");
      expect(args.units).toBeUndefined();
    });

    it("isClientToolCall identifies tracked tool calls", () => {
      const tracker = createTrackerWithSchema();

      tracker.processEvent({
        type: EventType.TOOL_CALL_START,
        toolCallId: "tc_1",
        toolCallName: "get_weather",
        timestamp: Date.now(),
      } as unknown as BaseEvent);

      expect(tracker.isClientToolCall("tc_1")).toBe(true);
      expect(tracker.isClientToolCall("tc_unknown")).toBe(false);
    });

    it("handles incremental streaming across multiple deltas", () => {
      const tracker = createTrackerWithSchema();

      tracker.processEvent({
        type: EventType.TOOL_CALL_START,
        toolCallId: "tc_1",
        toolCallName: "get_weather",
        timestamp: Date.now(),
      } as unknown as BaseEvent);

      tracker.processEvent({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "tc_1",
        delta: '{"city": "Se',
        timestamp: Date.now(),
      } as unknown as BaseEvent);

      tracker.processEvent({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: "tc_1",
        delta: 'attle", "units": null}',
        timestamp: Date.now(),
      } as unknown as BaseEvent);

      tracker.processEvent({
        type: EventType.TOOL_CALL_END,
        toolCallId: "tc_1",
        timestamp: Date.now(),
      } as unknown as BaseEvent);

      const pending = tracker.getPendingToolCalls();
      expect(JSON.parse(pending[0].arguments)).toEqual({ city: "Seattle" });
    });
  });
});
