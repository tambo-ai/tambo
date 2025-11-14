import TamboAI from "@tambo-ai/typescript-sdk";
import type {
  ThreadAdvanceParams,
  ThreadAdvanceResponse,
} from "@tambo-ai/typescript-sdk/resources/beta";

const MAX_REQUEST_RETRIES = 2;
const MAX_CHUNK_RETRIES = 5;

interface AdvanceStreamRequestOptions {
  headers?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * Advances a thread with streaming support and automatic retry logic.
 * Handles SSE (Server-Sent Events) responses with buffering for incomplete JSON chunks.
 * @param client - The TamboAI client instance
 * @param body - The thread advance parameters
 * @param threadId - Optional thread ID to advance a specific thread
 * @param options - Optional request options including headers
 * @returns An async iterable of ThreadAdvanceResponse objects
 */
export async function advanceStreamWithBuffer(
  client: TamboAI,
  body: ThreadAdvanceParams,
  threadId?: string,
  options?: AdvanceStreamRequestOptions,
): Promise<AsyncIterable<ThreadAdvanceResponse>> {
  let requestRetryCount = 0;

  while (true) {
    try {
      const mergedHeaders = {
        ...options?.headers,
        Accept: "text/event-stream",
      };

      const responsePromise = client.post(
        `/threads${threadId ? `/${threadId}` : ""}/advancestream`,
        {
          body,
          ...options,
          headers: mergedHeaders,
        },
      );

      const response = await responsePromise.asResponse();
      return handleStreamResponse(response);
    } catch (error) {
      if (requestRetryCount < MAX_REQUEST_RETRIES) {
        requestRetryCount++;
        console.warn(
          `Request failed, attempting retry ${requestRetryCount}/${MAX_REQUEST_RETRIES}`,
        );
        continue;
      }
      throw error;
    }
  }
}

async function* handleStreamResponse(
  response: Response,
): AsyncIterable<ThreadAdvanceResponse> {
  const decoder = new TextDecoder();
  const body = response.body;

  if (!body) {
    throw new Error("Streaming response body is empty");
  }

  const reader = (body as ReadableStream<Uint8Array>).getReader();
  let chunkRetryCount = 0;
  let buffer = "";
  let pendingEventLines: string[] = [];

  const attemptEmitEvent = (isFinal = false) => {
    if (pendingEventLines.length === 0) {
      return null;
    }

    const eventData = pendingEventLines.join("\n").trim();
    if (!eventData) {
      pendingEventLines = [];
      return null;
    }

    if (eventData === "DONE") {
      pendingEventLines = [];
      chunkRetryCount = 0;
      return null;
    }

    try {
      const parsed = JSON.parse(eventData) as ThreadAdvanceResponse;
      pendingEventLines = [];
      chunkRetryCount = 0;
      return parsed;
    } catch (_error) {
      if (!isFinal && chunkRetryCount < MAX_CHUNK_RETRIES) {
        chunkRetryCount++;
        console.warn(
          `Failed to parse JSON chunk, waiting for more data. Attempt ${chunkRetryCount}/${MAX_CHUNK_RETRIES}`,
        );
        return null;
      }

      pendingEventLines = [];
      throw new Error("Failed to parse JSON after multiple chunks.");
    }
  };

  const processBuffer = (isFinal = false) => {
    const results: ThreadAdvanceResponse[] = [];
    let newlineIndex = buffer.indexOf("\n");

    while (newlineIndex !== -1) {
      const rawLine = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      const line = rawLine.replace(/\r$/, "");

      if (!line) {
        const event = attemptEmitEvent(isFinal);
        if (event !== null) {
          results.push(event);
        }
      } else if (line === "data: DONE") {
        pendingEventLines = [];
        chunkRetryCount = 0;
      } else if (line.startsWith("data:")) {
        pendingEventLines.push(line.slice(5).trimStart());
      } else if (line.startsWith("error: ")) {
        throw new Error(line.slice(7));
      }

      newlineIndex = buffer.indexOf("\n");
    }

    if (isFinal) {
      if (buffer.trim()) {
        pendingEventLines.push(buffer.trim());
        buffer = "";
      }

      const event = attemptEmitEvent(true);
      if (event !== null) {
        results.push(event);
      }
    }

    return results;
  };

  while (true) {
    try {
      const { done, value } = await reader.read();
      if (done) {
        buffer += decoder.decode();
        const remaining = processBuffer(true);
        for (const item of remaining) {
          yield item;
        }
        break;
      }

      buffer += decoder.decode(value ?? new Uint8Array(), { stream: true });
      const items = processBuffer();
      for (const item of items) {
        yield item;
      }
    } catch (error) {
      reader.releaseLock();
      throw error;
    }
  }
}
