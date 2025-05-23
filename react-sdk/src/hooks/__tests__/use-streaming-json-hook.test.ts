import { act, renderHook } from "@testing-library/react";
import { useStreamingJsonHook } from "../use-streaming-json-hook";

describe("useStreamingJsonHook", () => {
  it("streams all keys then marks them complete when done", () => {
    const { result } = renderHook(() =>
      useStreamingJsonHook(["name", "email"]),
    );

    // Stream "name"
    act(() => {
      result.current.processToken({ key: "name", value: "John" });
    });
    expect(result.current.props).toEqual({ name: "John" });
    expect(result.current.meta.name.state).toBe("streaming");
    expect(result.current.meta.email.state).toBe("notStarted");

    // Switch to "email" – should complete "name"
    act(() => {
      result.current.processToken({ key: "email", value: "john@" });
    });
    expect(result.current.meta.name.state).toBe("complete");
    expect(result.current.meta.email.state).toBe("streaming");

    // Finish stream
    act(() => {
      result.current.markDone();
    });

    expect(result.current.isStreamDone).toBe(true);
    expect(result.current.meta.name.state).toBe("complete");
    expect(result.current.meta.email.state).toBe("complete");
  });

  it("marks unstreamed keys as skipped when done", () => {
    const { result } = renderHook(() =>
      useStreamingJsonHook(["firstName", "lastName", "age"]),
    );

    act(() => {
      result.current.processToken({ key: "firstName", value: "Ada" });
    });

    act(() => {
      result.current.markDone();
    });

    expect(result.current.meta.firstName.state).toBe("complete");
    expect(result.current.meta.lastName.state).toBe("skipped");
    expect(result.current.meta.age.state).toBe("skipped");
  });

  it("keeps key in streaming state until done is received", () => {
    const { result } = renderHook(() => useStreamingJsonHook(["summary"]));

    act(() => {
      result.current.processToken({ key: "summary", value: "Hello" });
    });

    expect(result.current.isStreamDone).toBe(false);
    expect(result.current.meta.summary.state).toBe("streaming");
  });

  it("ignores unknown keys by default", () => {
    const { result } = renderHook(() => useStreamingJsonHook(["foo"]));

    act(() => {
      result.current.processToken({ key: "bar", value: "baz" });
    });

    expect(result.current.props).toEqual({});
    expect(result.current.meta.foo.state).toBe("notStarted");
  });

  it("throws on unknown keys when configured", () => {
    const { result } = renderHook(() =>
      useStreamingJsonHook(["foo"], { onUnknownKey: "throw" }),
    );

    expect(() =>
      act(() => {
        result.current.processToken({ key: "bar", value: "baz" });
      }),
    ).toThrow();
  });
});
