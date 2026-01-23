/**
 * Stream Handler for v1 Streaming API
 *
 * Provides utilities for handling event streams from the TypeScript SDK.
 * The SDK's client.threads.runs.run() already returns an async iterable,
 * so this module just adds optional debug logging.
 */

import type { RunRunResponse } from "@tambo-ai/typescript-sdk/resources/threads/runs";

/**
 * Options for stream handling.
 */
export interface StreamHandlerOptions {
  /**
   * Enable debug logging (development mode only).
   * Logs all events to console.
   */
  debug?: boolean;
}

/**
 * Handle an event stream from the TypeScript SDK and yield AG-UI-compatible events.
 *
 * The TypeScript SDK's client.threads.runs.run() returns an async iterable
 * that yields RunRunResponse events (with type: string). This function wraps it
 * to add optional debug logging.
 *
 * Note: RunRunResponse events have `type: string` rather than the AG-UI
 * `type: EventType` enum, but they contain the same event type values and
 * are compatible with the AG-UI event system.
 * @param stream - Async iterable of events from SDK
 * @param options - Optional configuration for stream handling
 * @returns Async iterable of AG-UI-compatible events
 * @example
 * ```typescript
 * const streamPromise = client.threads.runs.run(threadId, {
 *   message: { role: "user", content: [{ type: "text", text: "hello" }] },
 * });
 * const stream = await streamPromise;
 *
 * for await (const event of handleEventStream(stream, { debug: true })) {
 *   dispatch({ type: 'EVENT', event }); // Send to reducer
 * }
 * ```
 */
export async function* handleEventStream(
  stream: AsyncIterable<RunRunResponse>,
  options?: StreamHandlerOptions,
): AsyncIterable<RunRunResponse> {
  const { debug = false } = options ?? {};

  for await (const event of stream) {
    if (debug && process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[StreamHandler] Event:", event);
    }

    yield event;
  }
}
