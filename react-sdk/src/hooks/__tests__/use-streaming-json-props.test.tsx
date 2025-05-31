import { act, renderHook } from "@testing-library/react";
import { useStreamingProps } from "../use-streaming-json-props";

describe("useStreamingProps", () => {
  it("handles all keys streamed then done", () => {
    const { result } = renderHook(() =>
      useStreamingProps<{ name: string; email: string }>(["name", "email"]),
    );

    act(() => {
      result.current.handleChunk({ key: "name", value: "Alice" });
      result.current.handleChunk({ key: "email", value: "alice@example.com" });
      result.current.handleDone();
    });

    expect(result.current.props).toEqual({
      name: "Alice",
      email: "alice@example.com",
    });
    expect(result.current.meta.name.state).toBe("complete");
    expect(result.current.meta.email.state).toBe("complete");
    expect(result.current.isStreamDone).toBe(true);
  });

  it("marks missing keys as skipped on done", () => {
    const { result } = renderHook(() =>
      useStreamingProps<{
        firstName: string;
        lastName: string;
        age: string;
      }>(["firstName", "lastName", "age"]),
    );

    act(() => {
      result.current.handleChunk({ key: "firstName", value: "John" });
      result.current.handleDone();
    });

    expect(result.current.props).toEqual({ firstName: "John" });
    expect(result.current.meta.firstName.state).toBe("complete");
    expect(result.current.meta.lastName.state).toBe("skipped");
    expect(result.current.meta.age.state).toBe("skipped");
  });

  it("leaves streaming state without done", () => {
    const { result } = renderHook(() =>
      useStreamingProps<{ summary: string }>(["summary"]),
    );

    act(() => {
      result.current.handleChunk({ key: "summary", value: "Hello" });
    });

    expect(result.current.meta.summary.state).toBe("streaming");
    expect(result.current.isStreamDone).toBe(false);
  });

  it("ignores unknown keys", () => {
    const { result } = renderHook(() =>
      useStreamingProps<{ foo: string }>(["foo"]),
    );

    act(() => {
      result.current.handleChunk({ key: "bar", value: "baz" });
      result.current.handleDone();
    });

    expect(result.current.props).toEqual({});
    expect(result.current.meta.foo.state).toBe("skipped");
  });
});
