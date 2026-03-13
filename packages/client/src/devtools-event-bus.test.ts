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
    const listener = jest.fn();
    cleanupFns.push(devtoolsEventBus.subscribe(listener));

    devtoolsEventBus.emit("TEST_EVENT", "thread_1", { foo: "bar" });

    expect(listener).toHaveBeenCalledTimes(1);
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
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    cleanupFns.push(devtoolsEventBus.subscribe(listener1));
    cleanupFns.push(devtoolsEventBus.subscribe(listener2));

    devtoolsEventBus.emit("MULTI", "thread_1", {});

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
  });

  it("unsubscribe stops delivery", () => {
    const listener = jest.fn();
    const unsubscribe = devtoolsEventBus.subscribe(listener);
    cleanupFns.push(unsubscribe);

    devtoolsEventBus.emit("BEFORE", "thread_1", {});
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    devtoolsEventBus.emit("AFTER", "thread_1", {});
    expect(listener).toHaveBeenCalledTimes(1); // Still 1
  });

  it("includes runId when provided", () => {
    const listener = jest.fn();
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
      const listener = jest.fn();
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
      const listener = jest.fn();
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
      const listener = jest.fn();
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
      const listener = jest.fn();
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

    it("skips CUSTOM events with state_delta name", () => {
      const listener = jest.fn();
      cleanupFns.push(devtoolsEventBus.subscribe(listener));

      devtoolsEventBus.emitFromAgEvent(
        {
          type: EventType.CUSTOM,
          name: "tambo.component.state_delta",
        } as unknown as BaseEvent,
        "thread_1",
      );

      expect(listener).not.toHaveBeenCalled();
    });

    it("is a no-op when no listeners are subscribed", () => {
      // Should not throw when emitting AG-UI events with no listeners
      devtoolsEventBus.emitFromAgEvent(
        { type: EventType.RUN_STARTED } as BaseEvent,
        "thread_1",
        "run_1",
      );
    });

    it("extracts messageId from events", () => {
      const listener = jest.fn();
      cleanupFns.push(devtoolsEventBus.subscribe(listener));

      devtoolsEventBus.emitFromAgEvent(
        {
          type: EventType.TEXT_MESSAGE_START,
          messageId: "msg_42",
        } as unknown as BaseEvent,
        "thread_1",
      );

      expect(listener.mock.calls[0][0].detail.messageId).toBe("msg_42");
    });

    it("extracts error field from error events", () => {
      const listener = jest.fn();
      cleanupFns.push(devtoolsEventBus.subscribe(listener));

      devtoolsEventBus.emitFromAgEvent(
        {
          type: EventType.RUN_ERROR,
          error: "Something went wrong",
        } as unknown as BaseEvent,
        "thread_1",
      );

      expect(listener.mock.calls[0][0].detail.error).toBe(
        "Something went wrong",
      );
    });

    it("extracts result field from events", () => {
      const listener = jest.fn();
      cleanupFns.push(devtoolsEventBus.subscribe(listener));

      devtoolsEventBus.emitFromAgEvent(
        {
          type: EventType.TOOL_CALL_END,
          toolCallId: "tc_1",
          result: { data: "test" },
        } as unknown as BaseEvent,
        "thread_1",
      );

      expect(listener.mock.calls[0][0].detail.result).toEqual({
        data: "test",
      });
    });

    it("extracts value field from custom events", () => {
      const listener = jest.fn();
      cleanupFns.push(devtoolsEventBus.subscribe(listener));

      devtoolsEventBus.emitFromAgEvent(
        {
          type: EventType.CUSTOM,
          name: "tambo.component.start",
          value: { componentName: "Card" },
        } as unknown as BaseEvent,
        "thread_1",
      );

      expect(listener.mock.calls[0][0].detail.value).toEqual({
        componentName: "Card",
      });
    });

    it("extracts message field from events", () => {
      const listener = jest.fn();
      cleanupFns.push(devtoolsEventBus.subscribe(listener));

      devtoolsEventBus.emitFromAgEvent(
        {
          type: EventType.RUN_ERROR,
          message: "Connection timeout",
          error: "timeout",
        } as unknown as BaseEvent,
        "thread_1",
      );

      expect(listener.mock.calls[0][0].detail.message).toBe(
        "Connection timeout",
      );
    });

    it("omits runId when not provided", () => {
      const listener = jest.fn();
      cleanupFns.push(devtoolsEventBus.subscribe(listener));

      devtoolsEventBus.emitFromAgEvent(
        { type: EventType.RUN_STARTED } as BaseEvent,
        "thread_1",
      );

      expect(listener.mock.calls[0][0].runId).toBeUndefined();
    });
  });
});
