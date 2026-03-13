import { devtoolsEventBus } from "@tambo-ai/client";
import { renderHook, act } from "@testing-library/react";
import { useTamboDevtoolsEvents } from "./use-tambo-devtools-events";

describe("useTamboDevtoolsEvents", () => {
  it("starts with empty events", () => {
    const { result } = renderHook(() => useTamboDevtoolsEvents());
    expect(result.current.events).toEqual([]);
  });

  it("accumulates events from the bus", () => {
    const { result } = renderHook(() => useTamboDevtoolsEvents());

    act(() => {
      devtoolsEventBus.emit("RUN_STARTED", "thread_1", { foo: "bar" });
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].type).toBe("RUN_STARTED");
    expect(result.current.events[0].threadId).toBe("thread_1");
  });

  it("accumulates multiple events", () => {
    const { result } = renderHook(() => useTamboDevtoolsEvents());

    act(() => {
      devtoolsEventBus.emit("RUN_STARTED", "thread_1", {});
      devtoolsEventBus.emit("user_message", "thread_1", {});
      devtoolsEventBus.emit("TEXT_MESSAGE_START", "thread_1", {});
    });

    expect(result.current.events).toHaveLength(3);
    expect(result.current.events[0].type).toBe("RUN_STARTED");
    expect(result.current.events[1].type).toBe("user_message");
    expect(result.current.events[2].type).toBe("TEXT_MESSAGE_START");
  });

  it("clearEvents resets the event list", () => {
    const { result } = renderHook(() => useTamboDevtoolsEvents());

    act(() => {
      devtoolsEventBus.emit("RUN_STARTED", "thread_1", {});
      devtoolsEventBus.emit("user_message", "thread_1", {});
    });

    expect(result.current.events).toHaveLength(2);

    act(() => {
      result.current.clearEvents();
    });

    expect(result.current.events).toHaveLength(0);
  });

  it("stops receiving events after unmount", () => {
    const { result, unmount } = renderHook(() => useTamboDevtoolsEvents());

    act(() => {
      devtoolsEventBus.emit("RUN_STARTED", "thread_1", {});
    });

    expect(result.current.events).toHaveLength(1);

    unmount();

    // After unmount, the bus should have no listeners from this hook
    devtoolsEventBus.emit("RUN_FINISHED", "thread_1", {});
  });

  it("caps events at MAX_EVENTS (500) dropping oldest", () => {
    const { result } = renderHook(() => useTamboDevtoolsEvents());

    act(() => {
      for (let i = 0; i < 510; i++) {
        devtoolsEventBus.emit(`EVENT_${i}`, "thread_1", { index: i });
      }
    });

    // Should be capped at 500
    expect(result.current.events).toHaveLength(500);
    // Oldest 10 events (0-9) should have been dropped
    expect(result.current.events[0].type).toBe("EVENT_10");
    expect(result.current.events[499].type).toBe("EVENT_509");
  });

  it("continues accumulating after clearEvents", () => {
    const { result } = renderHook(() => useTamboDevtoolsEvents());

    act(() => {
      devtoolsEventBus.emit("RUN_STARTED", "thread_1", {});
    });

    expect(result.current.events).toHaveLength(1);

    act(() => {
      result.current.clearEvents();
    });

    expect(result.current.events).toHaveLength(0);

    act(() => {
      devtoolsEventBus.emit("RUN_FINISHED", "thread_1", {});
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].type).toBe("RUN_FINISHED");
  });
});
