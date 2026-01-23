/**
 * Stream Handler for v1 Streaming API
 *
 * Provides utilities for handling event streams from the TypeScript SDK.
 * The SDK's client.threads.runs.create() already returns an async iterable,
 * so this module just adds optional debug logging.
 */

import type { BaseEvent } from "@ag-ui/core";

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
 * Handle an event stream from the TypeScript SDK and yield AG-UI events.
 *
 * The TypeScript SDK's client.threads.runs.create() returns an async iterable
 * that yields AG-UI events. This function wraps it to add optional debug logging.
 * @param stream - Async iterable of events from SDK
 * @param options - Optional configuration for stream handling
 * @returns Async iterable of AG-UI events
 * @example
 * ```typescript
 * const stream = await client.threads.runs.create({
 *   message: { role: "user", content: [{ type: "text", text: "hello" }] },
 * });
 *
 * for await (const event of handleEventStream(stream, { debug: true })) {
 *   dispatch({ type: 'EVENT', event }); // Send to reducer
 * }
 * ```
 */
export async function* handleEventStream(
  stream: AsyncIterable<BaseEvent>,
  options?: StreamHandlerOptions,
): AsyncIterable<BaseEvent> {
  const { debug = false } = options ?? {};

  for await (const event of stream) {
    if (debug && process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[StreamHandler] Event:", event);
    }

    yield event;
  }
}
