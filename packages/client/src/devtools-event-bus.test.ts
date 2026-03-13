import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventType, type BaseEvent } from "@ag-ui/core";
import { devtoolsEventBus } from "./devtools-event-bus";

// Reset listeners between tests by unsubscribing everything
let cleanupFns: (() => void)[] = [];

beforeEach(() => {
  for (const fn of cleanupFns) {
    fn();
  }
  cleanupFns = [];
});

describe("devtoolsEventBus", () => {
  it("emits events to subscribers", () => {
    const listener = vi.fn();
    cleanupFns.push(devtoolsEventBus.subscribe(listener));

    devtoolsEventBus.emit("TEST_EVENT", "thread_1", { foo: "bar" });

    expect(listener).toHaveBeenCalledOnce();
    const event = listener.mock.calls[0][0];
    expect(event.type).toBe("TEST_EVENT");
    expect(event.threadId).toBe("thread_1");
    expect(event.detail).toEqual({ foo: "bar" });
    expect(event.id).toMatch(/^tdt_/);
    expect(typeof event.timestamp).toBe("number");
  });

  it("is a no-op when no listeners are subscribed", () => {
    // Should not throw
    devtoolsEventBus.emit("NO_LISTENERS", "thread_1", {});
  });

  it("supports multiple listeners", () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    cleanupFns.push(devtoolsEventBus.subscribe(listener1));
    cleanupFns.push(devtoolsEventBus.subscribe(listener2));

    devtoolsEventBus.emit("MULTI", "thread_1", {});

    expect(listener1).toHaveBeenCalledOnce();
    expect(listener2).toHaveBeenCalledOnce();
  });

  it("unsubscribe stops delivery", () => {
    const listener = vi.fn();
    const unsubscribe = devtoolsEventBus.subscribe(listener);
    cleanupFns.push(unsubscribe);

    devtoolsEventBus.emit("BEFORE", "thread_1", {});
    expect(listener).toHaveBeenCalledOnce();

    unsubscribe();
    devtoolsEventBus.emit("AFTER", "thread_1", {});
    expect(listener).toHaveBeenCalledOnce(); // Still 1
  });

  it("includes runId when provided", () => {
    const listener = vi.fn();
    cleanupFns.push(devtoolsEventBus.subscribe(listener));

    devtoolsEventBus.emit("WITH_RUN", "thread_1", {}, "run_123");

    expect(listener.mock.calls[0][0].runId).toBe("run_123");
  });

  it("reports hasListeners correctly", () => {
    expect(devtoolsEventBus.hasListeners).toBe(false);
    const unsub = devtoolsEventBus.subscribe(() => {});
    cleanupFns.push(unsub);
    expect(devtoolsEventBus.hasListeners).toBe(true);
    unsub();
    expect(devtoolsEventBus.hasListeners).toBe(false);
  });

  describe("emitFromAgEvent", () => {
    it("extracts fields from AG-UI events", () => {
      const listener = vi.fn();
      cleanupFns.push(devtoolsEventBus.subscribe(listener));

      const agEvent = {
        type: EventType.TOOL_CALL_START,
        toolCallId: "tc_1",
        toolCallName: "fetchData",
      } as BaseEvent;

      devtoolsEventBus.emitFromAgEvent(agEvent, "thread_1", "run_1");

      const event = listener.mock.calls[0][0];
      expect(event.type).toBe(EventType.TOOL_CALL_START);
      expect(event.detail.toolCallId).toBe("tc_1");
      expect(event.detail.toolCallName).toBe("fetchData");
      expect(event.runId).toBe("run_1");
    });

    it("skips high-frequency events", () => {
      const listener = vi.fn();
      cleanupFns.push(devtoolsEventBus.subscribe(listener));

      devtoolsEventBus.emitFromAgEvent(
        { type: EventType.TEXT_MESSAGE_CONTENT } as BaseEvent,
        "thread_1",
      );
      devtoolsEventBus.emitFromAgEvent(
        { type: EventType.TOOL_CALL_ARGS } as BaseEvent,
        "thread_1",
      );

      expect(listener).not.toHaveBeenCalled();
    });

    it("uses custom event name for CUSTOM events", () => {
      const listener = vi.fn();
      cleanupFns.push(devtoolsEventBus.subscribe(listener));

      const agEvent = {
        type: EventType.CUSTOM,
        name: "tambo.component.start",
        value: { componentName: "WeatherCard" },
      } as unknown as BaseEvent;

      devtoolsEventBus.emitFromAgEvent(agEvent, "thread_1");

      const event = listener.mock.calls[0][0];
      expect(event.type).toBe("tambo.component.start");
      expect(event.detail.name).toBe("tambo.component.start");
    });

    it("skips CUSTOM events with skipped Tambo names", () => {
      const listener = vi.fn();
      cleanupFns.push(devtoolsEventBus.subscribe(listener));

      devtoolsEventBus.emitFromAgEvent(
        {
          type: EventType.CUSTOM,
          name: "tambo.component.props_delta",
        } as unknown as BaseEvent,
        "thread_1",
      );

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
