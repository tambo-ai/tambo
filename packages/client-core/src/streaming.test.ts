/**
 * Tests for SSE streaming with reconnection
 */

import { streamEvents } from "./streaming";
import type { StreamEvent } from "./types";

/**
 * Create a mock Response with a readable stream that emits SSE-formatted data
 */
function mockSSEResponse(
  events: Array<{ id?: string; data: string }>,
): Response {
  const lines = events.flatMap((event) => {
    const parts: string[] = [];
    if (event.id) {
      parts.push(`id:${event.id}`);
    }
    parts.push(`data:${event.data}`);
    parts.push(""); // blank line = event boundary
    return parts;
  });

  const text = lines.join("\n") + "\n";
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

/**
 * Create a mock Response that errors after emitting some events
 */
function mockSSEResponseThenError(
  events: Array<{ id?: string; data: string }>,
): Response {
  const lines = events.flatMap((event) => {
    const parts: string[] = [];
    if (event.id) {
      parts.push(`id:${event.id}`);
    }
    parts.push(`data:${event.data}`);
    parts.push("");
    return parts;
  });

  const text = lines.join("\n") + "\n";
  const encoder = new TextEncoder();
  let readCount = 0;

  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      readCount++;
      if (readCount === 1) {
        controller.enqueue(encoder.encode(text));
      } else {
        controller.error(new Error("Connection reset"));
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

describe("streamEvents", () => {
  const baseOptions = {
    headers: { Authorization: "Bearer test-key" },
  };

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("parses SSE data lines into StreamEvent objects", async () => {
    const mockResponse = mockSSEResponse([
      {
        data: JSON.stringify({
          type: "text_message_start",
          messageId: "msg_1",
          role: "assistant",
        }),
      },
      {
        data: JSON.stringify({
          type: "text_message_content",
          messageId: "msg_1",
          delta: "Hello",
        }),
      },
      {
        data: JSON.stringify({
          type: "done",
        }),
      },
    ]);

    jest.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

    const events: StreamEvent[] = [];
    for await (const event of streamEvents(
      "https://api.test/stream",
      baseOptions,
    )) {
      events.push(event);
    }

    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({
      type: "text_message_start",
      messageId: "msg_1",
      role: "assistant",
    });
    expect(events[1]).toEqual({
      type: "text_message_content",
      messageId: "msg_1",
      delta: "Hello",
    });
  });

  it("does NOT reconnect after done event", async () => {
    const mockResponse = mockSSEResponse([
      {
        data: JSON.stringify({ type: "done" }),
      },
    ]);

    const fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(mockResponse);

    const events: StreamEvent[] = [];
    for await (const event of streamEvents(
      "https://api.test/stream",
      baseOptions,
    )) {
      events.push(event);
    }

    expect(events).toHaveLength(0);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("tracks event IDs", async () => {
    const mockResponse = mockSSEResponse([
      {
        id: "evt_1",
        data: JSON.stringify({
          type: "text_message_content",
          messageId: "msg_1",
          delta: "Hi",
        }),
      },
      { data: JSON.stringify({ type: "done" }) },
    ]);

    jest.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

    const events: StreamEvent[] = [];
    for await (const event of streamEvents(
      "https://api.test/stream",
      baseOptions,
    )) {
      events.push(event);
    }

    expect(events).toHaveLength(1);
  });

  it("yields error events and stops", async () => {
    const mockResponse = mockSSEResponse([
      {
        data: JSON.stringify({
          type: "error",
          error: { message: "Something went wrong", code: "internal_error" },
        }),
      },
    ]);

    jest.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

    const events: StreamEvent[] = [];
    for await (const event of streamEvents(
      "https://api.test/stream",
      baseOptions,
    )) {
      events.push(event);
    }

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("error");
  });

  it("respects AbortSignal cancellation", async () => {
    const controller = new AbortController();
    controller.abort();

    const events: StreamEvent[] = [];
    for await (const event of streamEvents("https://api.test/stream", {
      ...baseOptions,
      signal: controller.signal,
    })) {
      events.push(event);
    }

    expect(events).toHaveLength(0);
  });

  it("throws after max reconnection attempts on HTTP error", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "server_error" }), {
        status: 500,
        statusText: "Internal Server Error",
      }),
    );

    const generator = streamEvents("https://api.test/stream", {
      ...baseOptions,
      maxReconnects: 2,
      reconnectDelay: 1,
    });

    await expect(async () => {
      for await (const _ of generator) {
        // consume
      }
    }).rejects.toThrow("Max reconnection attempts (2) exceeded");
  });

  it("reconnects on network error and sends Last-Event-ID", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch");

    // First call: emit one event then error
    fetchSpy.mockResolvedValueOnce(
      mockSSEResponseThenError([
        {
          id: "evt_1",
          data: JSON.stringify({
            type: "text_message_content",
            messageId: "msg_1",
            delta: "Hi",
          }),
        },
      ]),
    );

    // Second call: complete normally
    fetchSpy.mockResolvedValueOnce(
      mockSSEResponse([
        {
          data: JSON.stringify({
            type: "text_message_content",
            messageId: "msg_1",
            delta: " there",
          }),
        },
        { data: JSON.stringify({ type: "done" }) },
      ]),
    );

    const events: StreamEvent[] = [];
    for await (const event of streamEvents("https://api.test/stream", {
      ...baseOptions,
      maxReconnects: 3,
      reconnectDelay: 1,
    })) {
      events.push(event);
    }

    expect(events).toHaveLength(2);
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    // Verify second call includes Last-Event-ID
    const secondCallHeaders = fetchSpy.mock.calls[1][1]?.headers as Record<
      string,
      string
    >;
    expect(secondCallHeaders["Last-Event-ID"]).toBe("evt_1");
  });

  it("handles partial chunks across reads", async () => {
    // Create a stream that sends data in two chunks, splitting mid-line
    const encoder = new TextEncoder();
    const chunk1 = 'data:{"type":"text_message_con';
    const chunk2 =
      'tent","messageId":"msg_1","delta":"Hi"}\n\ndata:{"type":"done"}\n\n';

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(chunk1));
        controller.enqueue(encoder.encode(chunk2));
        controller.close();
      },
    });

    const mockResponse = new Response(stream, {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    });

    jest.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

    const events: StreamEvent[] = [];
    for await (const event of streamEvents(
      "https://api.test/stream",
      baseOptions,
    )) {
      events.push(event);
    }

    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({
      type: "text_message_content",
      messageId: "msg_1",
      delta: "Hi",
    });
  });

  it("skips malformed JSON without crashing", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const mockResponse = mockSSEResponse([
      { data: "not-valid-json" },
      {
        data: JSON.stringify({
          type: "text_message_content",
          messageId: "msg_1",
          delta: "Hi",
        }),
      },
      { data: JSON.stringify({ type: "done" }) },
    ]);

    jest.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

    const events: StreamEvent[] = [];
    for await (const event of streamEvents(
      "https://api.test/stream",
      baseOptions,
    )) {
      events.push(event);
    }

    expect(events).toHaveLength(1);
    expect(warnSpy).toHaveBeenCalledWith(
      "Failed to parse SSE event:",
      "not-valid-json",
      expect.any(SyntaxError),
    );
  });
});
