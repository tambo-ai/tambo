import { EventType, type CustomEvent } from "@ag-ui/core";
import { asTamboCustomEvent, isTamboCustomEvent } from "./event";

describe("isTamboCustomEvent", () => {
  it("returns true for tambo.component.start event", () => {
    const event = {
      type: EventType.CUSTOM,
      name: "tambo.component.start",
      value: { messageId: "msg1", componentId: "comp1", componentName: "Test" },
    };
    expect(isTamboCustomEvent(event)).toBe(true);
  });

  it("returns true for tambo.component.props_delta event", () => {
    const event = {
      type: EventType.CUSTOM,
      name: "tambo.component.props_delta",
      value: { componentId: "comp1", operations: [] },
    };
    expect(isTamboCustomEvent(event)).toBe(true);
  });

  it("returns true for tambo.component.state_delta event", () => {
    const event = {
      type: EventType.CUSTOM,
      name: "tambo.component.state_delta",
      value: { componentId: "comp1", operations: [] },
    };
    expect(isTamboCustomEvent(event)).toBe(true);
  });

  it("returns true for tambo.component.end event", () => {
    const event = {
      type: EventType.CUSTOM,
      name: "tambo.component.end",
      value: { componentId: "comp1" },
    };
    expect(isTamboCustomEvent(event)).toBe(true);
  });

  it("returns true for tambo.run.awaiting_input event", () => {
    const event = {
      type: EventType.CUSTOM,
      name: "tambo.run.awaiting_input",
      value: {
        pendingToolCalls: [
          { toolCallId: "tool1", toolName: "test", arguments: "{}" },
        ],
      },
    };
    expect(isTamboCustomEvent(event)).toBe(true);
  });

  it("returns true for tambo.message.parent event", () => {
    const event = {
      type: EventType.CUSTOM,
      name: "tambo.message.parent",
      value: { messageId: "msg1", parentMessageId: "parent1" },
    };
    expect(isTamboCustomEvent(event)).toBe(true);
  });

  it("returns false for unknown custom event name", () => {
    const event = {
      type: EventType.CUSTOM,
      name: "unknown.event",
      value: {},
    };
    expect(isTamboCustomEvent(event)).toBe(false);
  });

  it("returns false when name is undefined", () => {
    const event: { name?: string } = {};
    expect(isTamboCustomEvent(event)).toBe(false);
  });

  it("returns false when name is not a string", () => {
    const event = {
      type: EventType.CUSTOM,
      name: 123,
      value: {},
    };
    expect(isTamboCustomEvent(event as unknown as { name?: string })).toBe(
      false,
    );
  });

  it("returns false for empty object", () => {
    expect(isTamboCustomEvent({})).toBe(false);
  });
});

describe("asTamboCustomEvent", () => {
  it("casts tambo.message.parent event", () => {
    const event = {
      type: EventType.CUSTOM,
      name: "tambo.message.parent",
      value: { messageId: "msg1", parentMessageId: "parent1" },
      timestamp: 1234,
    } as CustomEvent;

    const result = asTamboCustomEvent(event);
    expect(result).toBeDefined();
    expect(result?.name).toBe("tambo.message.parent");
  });

  it("returns undefined for unknown event name", () => {
    const event = {
      type: EventType.CUSTOM,
      name: "unknown.event",
      value: {},
      timestamp: 1234,
    } as CustomEvent;

    expect(asTamboCustomEvent(event)).toBeUndefined();
  });
});
