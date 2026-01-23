/**
 * SSE Stream Handler for v1 Streaming API
 *
 * Provides utilities for handling Server-Sent Events and parsing them
 * into AG-UI protocol events.
 */

import type { BaseEvent } from "@ag-ui/core";

/**
 * Parse an SSE event string into an AG-UI event object.
 * @param eventData - The SSE event data string
 * @returns Parsed AG-UI event
 */
function parseSSEEvent(eventData: string): BaseEvent {
  try {
    return JSON.parse(eventData) as BaseEvent;
  } catch (error) {
    throw new Error(
      `Failed to parse SSE event: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Options for SSE stream handling.
 */
export interface StreamHandlerOptions {
  /**
   * Enable debug logging (development mode only).
   * Logs all parsed events to console.
   */
  debug?: boolean;
}

/**
 * Handle an SSE response stream and yield AG-UI events.
 *
 * Parses Server-Sent Events from a Response stream and yields AG-UI events
 * for consumption by React reducers.
 * @param response - The Response object from fetch() with SSE stream
 * @param controller - AbortController for cancellation
 * @param options - Optional configuration for stream handling
 * @returns Async iterable of AG-UI events
 * @example
 * ```typescript
 * const controller = new AbortController();
 * const response = await fetch('/api/stream', { signal: controller.signal });
 *
 * for await (const event of handleSSEStream(response, controller, { debug: true })) {
 *   dispatch({ type: 'EVENT', event }); // Send to reducer
 * }
 * ```
 */
export async function* handleSSEStream(
  response: Response,
  controller: AbortController,
  options?: StreamHandlerOptions,
): AsyncIterable<BaseEvent> {
  const { debug = false } = options ?? {};
  if (!response.body) {
    throw new Error("Response body is null");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (!controller.signal.aborted) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      // Decode chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE events in buffer
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // Keep incomplete line in buffer

      let eventData = "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          // SSE data line
          eventData += line.slice(6);
        } else if (line === "") {
          // Empty line indicates end of event
          if (eventData) {
            const event = parseSSEEvent(eventData);

            if (debug && process.env.NODE_ENV !== "production") {
              // eslint-disable-next-line no-console
              console.log("[StreamHandler] Event:", event);
            }

            yield event;
            eventData = "";
          }
        }
        // Ignore other SSE fields (event:, id:, retry:)
      }
    }
  } finally {
    reader.releaseLock();
  }
}
