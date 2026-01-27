/**
 * Stream Handler for v1 Streaming API
 *
 * Provides utilities for handling event streams from the TypeScript SDK.
 * The SDK's client.threads.runs.run() already returns an async iterable,
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
 * Handle an event stream from the TypeScript SDK and yield AG-UI BaseEvent types.
 *
 * The TypeScript SDK's client.threads.runs.run() and client.threads.runs.create()
 * return async iterables that yield events compatible with AG-UI's BaseEvent.
 * This function wraps the stream to add optional debug logging and ensures
 * proper typing.
 *
 * Note: SDK events have `type: string` rather than `type: EventType` enum,
 * but the values are compatible with AG-UI event types.
 * @param stream - Async iterable of events from SDK
 * @param options - Optional configuration for stream handling
 * @yields {BaseEvent} AG-UI BaseEvent types from the stream
 * @returns Async iterable of AG-UI BaseEvent types
 * @example
 * ```typescript
 * const stream = await client.threads.runs.run(threadId, {
 *   message: { role: "user", content: [{ type: "text", text: "hello" }] },
 * });
 *
 * for await (const event of handleEventStream(stream, { debug: true })) {
 *   dispatch({ type: 'EVENT', event }); // Send to reducer
 * }
 * ```
 */
export async function* handleEventStream(
  stream: AsyncIterable<unknown>,
  options?: StreamHandlerOptions,
): AsyncIterable<BaseEvent> {
  const { debug = false } = options ?? {};

  for await (const event of stream) {
    if (debug && process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[StreamHandler] Event:", event);
    }

    // SDK events are compatible with AG-UI BaseEvent
    yield event as BaseEvent;
  }
}
