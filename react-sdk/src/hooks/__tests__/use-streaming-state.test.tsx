import { act, renderHook } from "@testing-library/react";
import { useStreamingState } from "../use-streaming-state";

describe("useStreamingState", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("initializes with all keys in notStarted state", () => {
    const { result } = renderHook(() =>
      useStreamingState(["name", "email", "age"]),
    );

    expect(result.current.result.props).toEqual({});
    expect(result.current.result.isStreamDone).toBe(false);
    expect(result.current.result.meta).toEqual({
      name: { state: "notStarted" },
      email: { state: "notStarted" },
      age: { state: "notStarted" },
    });
  });

  test("transitions key to streaming on first token", () => {
    const { result } = renderHook(() => useStreamingState(["name", "email"]));

    const startTime = 1000;
    jest.setSystemTime(startTime);

    act(() => {
      result.current.processToken({ key: "name", value: "John" });
    });

    expect(result.current.result.props).toEqual({ name: "John" });
    expect(result.current.result.meta.name).toEqual({
      state: "streaming",
      streamStartedAt: startTime,
    });
    expect(result.current.result.meta.email).toEqual({
      state: "notStarted",
    });
  });

  test("marks previous key as complete when new key starts streaming", () => {
    const { result } = renderHook(() => useStreamingState(["name", "email"]));

    const startTime = 1000;
    const switchTime = 2000;

    jest.setSystemTime(startTime);
    act(() => {
      result.current.processToken({ key: "name", value: "John" });
    });

    jest.setSystemTime(switchTime);
    act(() => {
      result.current.processToken({ key: "email", value: "john@" });
    });

    expect(result.current.result.props).toEqual({
      name: "John",
      email: "john@",
    });
    expect(result.current.result.meta.name).toEqual({
      state: "complete",
      streamStartedAt: startTime,
      streamCompletedAt: switchTime,
    });
    expect(result.current.result.meta.email).toEqual({
      state: "streaming",
      streamStartedAt: switchTime,
    });
  });

  test("accumulates values for the same key", () => {
    const { result } = renderHook(() => useStreamingState(["message"]));

    act(() => {
      result.current.processToken({ key: "message", value: "Hello" });
    });

    act(() => {
      result.current.processToken({ key: "message", value: "Hello world" });
    });

    expect(result.current.result.props).toEqual({ message: "Hello world" });
    expect(result.current.result.meta.message.state).toBe("streaming");
  });

  test("marks all streaming keys as complete and unstarted keys as skipped on done", () => {
    const { result } = renderHook(() =>
      useStreamingState(["firstName", "lastName", "age"]),
    );

    const startTime = 1000;
    const doneTime = 2000;

    jest.setSystemTime(startTime);
    act(() => {
      result.current.processToken({ key: "firstName", value: "John" });
    });

    jest.setSystemTime(doneTime);
    act(() => {
      result.current.markDone();
    });

    expect(result.current.result.isStreamDone).toBe(true);
    expect(result.current.result.meta.firstName).toEqual({
      state: "complete",
      streamStartedAt: startTime,
      streamCompletedAt: doneTime,
    });
    expect(result.current.result.meta.lastName).toEqual({
      state: "skipped",
    });
    expect(result.current.result.meta.age).toEqual({
      state: "skipped",
    });
  });

  test("ignores unknown keys by default", () => {
    const { result } = renderHook(() => useStreamingState(["name", "email"]));

    act(() => {
      result.current.processToken({ key: "unknownKey", value: "value" });
    });

    expect(result.current.result.props).toEqual({});
    expect("unknownKey" in result.current.result.meta).toBe(false);
  });

  test("throws error for unknown keys when ignoreUnknownKeys is false", () => {
    const { result } = renderHook(() =>
      useStreamingState(["name", "email"], { ignoreUnknownKeys: false }),
    );

    expect(() => {
      act(() => {
        result.current.processToken({ key: "unknownKey", value: "value" });
      });
    }).toThrow("Unknown key: unknownKey");
  });

  test("resets to initial state", () => {
    const { result } = renderHook(() => useStreamingState(["name", "email"]));

    act(() => {
      result.current.processToken({ key: "name", value: "John" });
      result.current.markDone();
    });

    expect(result.current.result.isStreamDone).toBe(true);
    expect(result.current.result.props).toEqual({ name: "John" });

    act(() => {
      result.current.reset();
    });

    expect(result.current.result.props).toEqual({});
    expect(result.current.result.isStreamDone).toBe(false);
    expect(result.current.result.meta).toEqual({
      name: { state: "notStarted" },
      email: { state: "notStarted" },
    });
  });

  test("handles streaming without done signal", () => {
    const { result } = renderHook(() => useStreamingState(["summary"]));

    act(() => {
      result.current.processToken({
        key: "summary",
        value: "This is a summary",
      });
    });

    expect(result.current.result.meta.summary.state).toBe("streaming");
    expect(result.current.result.isStreamDone).toBe(false);
  });

  test("complete scenario: all keys streamed then done", () => {
    const { result } = renderHook(() => useStreamingState(["name", "email"]));

    const nameStart = 1000;
    const emailStart = 2000;
    const doneTime = 3000;

    jest.setSystemTime(nameStart);
    act(() => {
      result.current.processToken({ key: "name", value: "John Doe" });
    });

    jest.setSystemTime(emailStart);
    act(() => {
      result.current.processToken({ key: "email", value: "john@example.com" });
    });

    jest.setSystemTime(doneTime);
    act(() => {
      result.current.markDone();
    });

    expect(result.current.result.props).toEqual({
      name: "John Doe",
      email: "john@example.com",
    });
    expect(result.current.result.isStreamDone).toBe(true);
    expect(result.current.result.meta.name).toEqual({
      state: "complete",
      streamStartedAt: nameStart,
      streamCompletedAt: emailStart,
    });
    expect(result.current.result.meta.email).toEqual({
      state: "complete",
      streamStartedAt: emailStart,
      streamCompletedAt: doneTime,
    });
  });

  test("partial scenario: some keys never streamed", () => {
    const { result } = renderHook(() =>
      useStreamingState(["firstName", "lastName", "age"]),
    );

    const startTime = 1000;
    const doneTime = 2000;

    jest.setSystemTime(startTime);
    act(() => {
      result.current.processToken({ key: "firstName", value: "John" });
    });

    jest.setSystemTime(doneTime);
    act(() => {
      result.current.markDone();
    });

    expect(result.current.result.props).toEqual({ firstName: "John" });
    expect(result.current.result.meta.firstName).toEqual({
      state: "complete",
      streamStartedAt: startTime,
      streamCompletedAt: doneTime,
    });
    expect(result.current.result.meta.lastName).toEqual({
      state: "skipped",
    });
    expect(result.current.result.meta.age).toEqual({
      state: "skipped",
    });
  });
});
