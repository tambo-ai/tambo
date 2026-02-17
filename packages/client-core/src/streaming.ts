/**
 * SSE streaming with automatic reconnection
 */

import type { StreamEvent } from "./types.js";

/**
 * Options for streamEvents async generator
 */
export interface StreamEventsOptions {
  /** Request headers (must include Authorization) */
  headers: Record<string, string>;
  /** Request body (will be JSON stringified) */
  body?: unknown;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Maximum number of reconnection attempts (defaults to 3) */
  maxReconnects?: number;
  /** Initial delay between reconnection attempts in milliseconds (defaults to 1000) */
  reconnectDelay?: number;
  /** Stream timeout in milliseconds - aborts if no data received (defaults to 60000) */
  streamTimeout?: number;
}

/**
 * Stream SSE events with automatic reconnection
 *
 * @param url - URL to stream from
 * @param options - Streaming options
 * @returns AsyncGenerator yielding StreamEvent objects
 * @throws Error if max reconnection attempts exceeded
 */
export async function* streamEvents(
  url: string,
  options: StreamEventsOptions,
): AsyncGenerator<StreamEvent> {
  const {
    headers,
    body,
    signal,
    maxReconnects = 3,
    reconnectDelay = 1000,
    streamTimeout = 60000,
  } = options;

  let reconnectAttempts = 0;
  let lastEventId: string | undefined = undefined;
  let shouldReconnect = true;

  while (shouldReconnect) {
    // Check if cancelled before connecting
    if (signal?.aborted) {
      return;
    }

    // Build headers for this attempt
    const requestHeaders = { ...headers };
    if (lastEventId) {
      requestHeaders["Last-Event-ID"] = lastEventId;
    }

    try {
      // Create fetch request
      const response = await fetch(url, {
        method: "POST",
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal,
      });

      // Check response status
      if (!response.ok) {
        let errorBody: unknown;
        try {
          errorBody = await response.json();
        } catch {
          errorBody = await response.text();
        }
        throw new Error(
          `Stream request failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`,
        );
      }

      // Check response body exists
      if (!response.body) {
        throw new Error("Response body is null");
      }

      // Reset reconnect attempts on successful connection
      reconnectAttempts = 0;

      // Parse SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          // Create timeout controller for this read
          const timeoutController = new AbortController();
          const timeoutId = setTimeout(
            () => timeoutController.abort(),
            streamTimeout,
          );

          let readResult: ReadableStreamReadResult<Uint8Array>;
          try {
            // Listen for timeout abort
            const timeoutPromise = new Promise<never>((_, reject) => {
              timeoutController.signal.addEventListener("abort", () =>
                reject(new Error("Stream timeout - no data received")),
              );
            });

            // Race between read and timeout
            readResult = (await Promise.race([
              reader.read(),
              timeoutPromise,
            ])) as ReadableStreamReadResult<Uint8Array>;
          } finally {
            clearTimeout(timeoutId);
          }

          // Check if stream ended
          if (readResult.done) {
            shouldReconnect = false;
            break;
          }

          // Decode chunk and add to buffer
          const chunk = decoder.decode(readResult.value, { stream: true });
          buffer += chunk;

          // Process complete lines
          const lines = buffer.split("\n");
          // Keep last partial line in buffer
          buffer = lines.pop() || "";

          for (const line of lines) {
            // Skip empty lines (SSE keepalive)
            if (line.trim() === "") {
              continue;
            }

            // Parse SSE format
            if (line.startsWith("id:")) {
              lastEventId = line.slice(3).trim();
            } else if (line.startsWith("data:")) {
              const data = line.slice(5).trim();

              // Parse JSON event
              try {
                const event = JSON.parse(data) as StreamEvent;

                // Check for done event
                if (event.type === "done") {
                  shouldReconnect = false;
                  return;
                }

                // Check for error event
                if (event.type === "error") {
                  // Yield the error event so caller can see it
                  yield event;
                  // Don't reconnect on error events from server
                  shouldReconnect = false;
                  return;
                }

                // Yield the event
                yield event;
              } catch (parseError) {
                // Skip malformed JSON
                console.warn("Failed to parse SSE event:", data, parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      // Don't reconnect if manually cancelled
      if (signal?.aborted) {
        return;
      }

      // Don't reconnect if max attempts reached
      if (reconnectAttempts >= maxReconnects) {
        throw new Error(
          `Max reconnection attempts (${maxReconnects}) exceeded. Last error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      // Calculate backoff delay
      const delay = reconnectDelay * 2 ** reconnectAttempts;
      reconnectAttempts++;

      // Wait before reconnecting
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Check if cancelled during delay
      if (signal?.aborted) {
        return;
      }

      // Continue to next attempt
      continue;
    }
  }
}
