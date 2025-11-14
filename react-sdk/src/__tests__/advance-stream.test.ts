import { advanceStreamWithBuffer } from "../util/advance-stream";
import { ReadableStream as NodeReadableStream } from "stream/web";

const StreamCtor: typeof ReadableStream =
  typeof globalThis.ReadableStream !== "undefined"
    ? globalThis.ReadableStream
    : (NodeReadableStream as unknown as typeof ReadableStream);

const textEncoder = new TextEncoder();

function createStreamFromChunks(chunks: string[]): ReadableStream<Uint8Array> {
  return new StreamCtor<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(textEncoder.encode(chunk));
      }
      controller.close();
    },
  });
}

function createSSEResponse(chunks: string[]): Response {
  const stream = createStreamFromChunks(chunks);
  return {
    body: stream,
  } as unknown as Response;
}

describe("advanceStreamWithBuffer", () => {
  it("parses JSON payload split across multiple SSE chunks", async () => {
    const response = createSSEResponse([
      'data: {"message":',
      ' "hello"}\n',
      "\n",
    ]);

    const client = {
      post: jest.fn().mockReturnValue({
        asResponse: jest.fn().mockResolvedValue(response),
      }),
    };

    const iterable = await advanceStreamWithBuffer(client as any, {} as any);
    const received: Record<string, unknown>[] = [];
    for await (const item of iterable) {
      received.push(item as unknown as Record<string, unknown>);
    }

    expect(received).toEqual([{ message: "hello" }]);
  });

  it("throws when JSON cannot be parsed after retries", async () => {
    const response = createSSEResponse(["data: not-json\n", "\n"]);

    const client = {
      post: jest.fn().mockReturnValue({
        asResponse: jest.fn().mockResolvedValue(response),
      }),
    };

    const iterable = await advanceStreamWithBuffer(client as any, {} as any);

    await expect(async () => {
      for await (const _ of iterable) {
        // Consume iterator
      }
    }).rejects.toThrow("Failed to parse JSON after multiple chunks.");
  });
});
