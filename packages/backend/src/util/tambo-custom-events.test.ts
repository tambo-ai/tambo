import { EventType } from "@ag-ui/core";
import {
  createComponentEndEvent,
  createComponentPropsDeltaEvent,
  createComponentStartEvent,
  createComponentStateDeltaEvent,
  createMessageParentEvent,
  createRunAwaitingInputEvent,
  TAMBO_CUSTOM_EVENT_NAMES,
} from "./tambo-custom-events";

describe("tambo-custom-events", () => {
  describe("createComponentStartEvent", () => {
    it("should create a component start event with correct structure", () => {
      const value = {
        messageId: "msg-123",
        componentId: "comp-456",
        componentName: "TestComponent",
      };

      const event = createComponentStartEvent(value);

      expect(event.type).toBe(EventType.CUSTOM);
      expect(event.name).toBe("tambo.component.start");
      expect(event.value).toEqual(value);
      expect(typeof event.timestamp).toBe("number");
      expect(event.timestamp).toBeGreaterThan(0);
    });
  });

  describe("createComponentPropsDeltaEvent", () => {
    it("should create a props delta event with operations and streaming status", () => {
      const value = {
        componentId: "comp-456",
        operations: [{ op: "add" as const, path: "/title", value: "Hello" }],
        streamingStatus: {
          title: "streaming" as const,
          description: "started" as const,
        },
      };

      const event = createComponentPropsDeltaEvent(value);

      expect(event.type).toBe(EventType.CUSTOM);
      expect(event.name).toBe("tambo.component.props_delta");
      expect(event.value).toEqual(value);
      expect(typeof event.timestamp).toBe("number");
    });

    it("should handle empty operations array", () => {
      const value = {
        componentId: "comp-789",
        operations: [],
        streamingStatus: {},
      };

      const event = createComponentPropsDeltaEvent(value);

      expect(event.value.operations).toEqual([]);
      expect(event.value.streamingStatus).toEqual({});
    });
  });

  describe("createComponentStateDeltaEvent", () => {
    it("should create a state delta event with operations", () => {
      const value = {
        componentId: "comp-456",
        operations: [
          { op: "replace" as const, path: "/count", value: 42 },
          { op: "add" as const, path: "/items/-", value: "new item" },
        ],
      };

      const event = createComponentStateDeltaEvent(value);

      expect(event.type).toBe(EventType.CUSTOM);
      expect(event.name).toBe("tambo.component.state_delta");
      expect(event.value).toEqual(value);
      expect(typeof event.timestamp).toBe("number");
    });
  });

  describe("createComponentEndEvent", () => {
    it("should create a component end event with final props and state", () => {
      const value = {
        componentId: "comp-456",
        finalProps: { title: "Final Title", count: 5 },
        finalState: { expanded: true },
      };

      const event = createComponentEndEvent(value);

      expect(event.type).toBe(EventType.CUSTOM);
      expect(event.name).toBe("tambo.component.end");
      expect(event.value).toEqual(value);
      expect(typeof event.timestamp).toBe("number");
    });

    it("should handle undefined final state", () => {
      const value = {
        componentId: "comp-456",
        finalProps: { title: "No State" },
        finalState: undefined,
      };

      const event = createComponentEndEvent(value);

      expect(event.value.finalState).toBeUndefined();
    });
  });

  describe("createRunAwaitingInputEvent", () => {
    it("should create a run awaiting input event with pending tool calls", () => {
      const value = {
        pendingToolCalls: [
          {
            toolCallId: "tc-123",
            toolName: "get_weather",
            arguments: '{"city":"Seattle"}',
          },
          {
            toolCallId: "tc-456",
            toolName: "search",
            arguments: '{"query":"test"}',
          },
        ],
      };

      const event = createRunAwaitingInputEvent(value);

      expect(event.type).toBe(EventType.CUSTOM);
      expect(event.name).toBe("tambo.run.awaiting_input");
      expect(event.value).toEqual(value);
      expect(typeof event.timestamp).toBe("number");
    });

    it("should handle empty pending tool calls", () => {
      const value = {
        pendingToolCalls: [],
      };

      const event = createRunAwaitingInputEvent(value);

      expect(event.value.pendingToolCalls).toEqual([]);
    });
  });

  describe("createMessageParentEvent", () => {
    it("should create a message parent event with correct structure", () => {
      const value = {
        messageId: "msg-child",
        parentMessageId: "msg-parent",
      };

      const event = createMessageParentEvent(value);

      expect(event.type).toBe(EventType.CUSTOM);
      expect(event.name).toBe("tambo.message.parent");
      expect(event.value).toEqual(value);
      expect(typeof event.timestamp).toBe("number");
    });
  });

  describe("TAMBO_CUSTOM_EVENT_NAMES", () => {
    it("should contain all expected event names", () => {
      expect(TAMBO_CUSTOM_EVENT_NAMES).toEqual([
        "tambo.component.start",
        "tambo.component.props_delta",
        "tambo.component.state_delta",
        "tambo.component.end",
        "tambo.run.awaiting_input",
        "tambo.message.parent",
      ]);
    });

    it("should be readonly", () => {
      // TypeScript ensures this at compile time, but we can verify the array structure
      expect(Array.isArray(TAMBO_CUSTOM_EVENT_NAMES)).toBe(true);
      expect(TAMBO_CUSTOM_EVENT_NAMES.length).toBe(6);
    });
  });
});
