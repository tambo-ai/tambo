import { EventType } from "@ag-ui/core";
import type { BaseEvent, RunStartedEvent, RunFinishedEvent } from "@ag-ui/core";
import type { TamboThread } from "./types/thread";
import type { TamboStreamOptions, StreamEvent } from "./tambo-stream";
import { TamboStream } from "./tambo-stream";
import { createRunStream } from "./utils/send-message";
import { handleEventStream } from "./utils/stream-handler";
import { createThrottledStreamableExecutor } from "./utils/tool-executor";
import { ToolCallTracker } from "./utils/tool-call-tracker";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock("./utils/send-message");
jest.mock("./utils/stream-handler");
jest.mock("./utils/tool-executor");
jest.mock("./utils/tool-call-tracker");

const mockedCreateRunStream = jest.mocked(createRunStream);
const mockedHandleEventStream = jest.mocked(handleEventStream);
const mockedCreateThrottled = jest.mocked(createThrottledStreamableExecutor);
const MockedToolCallTracker = jest.mocked(ToolCallTracker);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFakeThread(threadId: string): TamboThread {
  const now = new Date().toISOString();
  return {
    id: threadId,
    messages: [],
    status: "idle",
    createdAt: now,
    updatedAt: now,
    lastRunCancelled: false,
  };
}

function makeEvents(): BaseEvent[] {
  return [
    {
      type: EventType.RUN_STARTED,
      runId: "run_1",
      threadId: "thread_123",
    } as RunStartedEvent,
    {
      type: EventType.TEXT_MESSAGE_START,
      messageId: "msg_1",
      role: "assistant",
    } as BaseEvent,
    {
      type: EventType.TEXT_MESSAGE_CONTENT,
      messageId: "msg_1",
      delta: "Hello",
    } as BaseEvent,
    { type: EventType.TEXT_MESSAGE_END, messageId: "msg_1" } as BaseEvent,
    { type: EventType.RUN_FINISHED, runId: "run_1" } as RunFinishedEvent,
  ];
}

async function* asyncIterableFromArray<T>(items: T[]): AsyncIterable<T> {
  for (const item of items) {
    yield item;
  }
}

function wireUpCoreMocks(): void {
  // ToolCallTracker constructor
  MockedToolCallTracker.mockImplementation(
    () =>
      ({
        handleEvent: jest.fn(),
        parsePartialArgs: jest.fn(),
        toolSchemas: new Map(),
        getToolCallsById: jest.fn(() => new Map()),
        clearToolCalls: jest.fn(),
        getAccumulatingToolCall: jest.fn(),
      }) as unknown as ToolCallTracker,
  );

  // Throttled streamable executor
  mockedCreateThrottled.mockReturnValue({
    schedule: jest.fn(),
    flush: jest.fn(),
  } as never);

  // handleEventStream passes events through
  mockedHandleEventStream.mockImplementation(async function* (
    stream: AsyncIterable<unknown>,
  ) {
    for await (const event of stream) {
      yield event as never;
    }
  } as never);
}

function setupStreamMocks(
  events: BaseEvent[],
  threadId: string | undefined = "thread_123",
): void {
  mockedCreateRunStream.mockResolvedValue({
    stream: asyncIterableFromArray(events) as never,
    initialThreadId: threadId,
  });
}

function makeBaseOptions(
  overrides: Partial<TamboStreamOptions> = {},
): TamboStreamOptions {
  const fakeThread = makeFakeThread(overrides.threadId ?? "thread_123");
  return {
    client: {} as TamboStreamOptions["client"],
    message: {
      content: [{ type: "text", text: "hello" }],
    } as TamboStreamOptions["message"],
    threadId: "thread_123",
    componentList: {},
    toolRegistry: {},
    userKey: undefined,
    previousRunId: undefined,
    autoExecuteTools: true,
    maxSteps: 10,
    debug: false,
    dispatch: jest.fn(),
    getThreadSnapshot: jest.fn(() => fakeThread),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  wireUpCoreMocks();
});

describe("TamboStream", () => {
  describe("async iteration", () => {
    it("yields events with snapshots via for-await-of", async () => {
      const events = makeEvents();
      setupStreamMocks(events);
      const stream = new TamboStream(makeBaseOptions());

      const collected: StreamEvent[] = [];
      for await (const item of stream) {
        collected.push(item);
      }

      expect(collected.length).toBe(events.length);
      for (const item of collected) {
        expect(item.event).toBeDefined();
        expect(item.snapshot).toBeDefined();
        expect(item.snapshot.id).toBe("thread_123");
      }
    });

    it("yields events with matching event types in order", async () => {
      const events = makeEvents();
      setupStreamMocks(events);
      const stream = new TamboStream(makeBaseOptions());

      const types: string[] = [];
      for await (const { event } of stream) {
        types.push(event.type);
      }

      expect(types).toEqual([
        EventType.RUN_STARTED,
        EventType.TEXT_MESSAGE_START,
        EventType.TEXT_MESSAGE_CONTENT,
        EventType.TEXT_MESSAGE_END,
        EventType.RUN_FINISHED,
      ]);
    });
  });

  describe(".thread promise", () => {
    it("resolves to the final TamboThread when stream completes", async () => {
      const events = makeEvents();
      setupStreamMocks(events);
      const stream = new TamboStream(makeBaseOptions());

      const thread = await stream.thread;

      expect(thread).toBeDefined();
      expect(thread.id).toBe("thread_123");
      expect(thread.status).toBe("idle");
    });

    it("resolves even if the iterator is not consumed", async () => {
      const events = makeEvents();
      setupStreamMocks(events);
      const stream = new TamboStream(makeBaseOptions());

      const thread = await stream.thread;
      expect(thread.id).toBe("thread_123");
    });
  });

  describe("abort", () => {
    it("calling abort() rejects .thread with AbortError", async () => {
      let resolveHang!: () => void;
      const hangPromise = new Promise<void>((r) => {
        resolveHang = r;
      });

      // Stream yields one event then hangs, then yields another.
      // We abort while it's hanging, then resolve the hang. The second
      // event will trigger the abort check inside the for-await loop.
      mockedCreateRunStream.mockResolvedValue({
        stream: (async function* () {
          yield {
            type: EventType.RUN_STARTED,
            runId: "run_1",
            threadId: "thread_123",
          };
          await hangPromise;
          // After hang resolves, yield another event so the for-await
          // loop iterates again and checks the abort signal.
          yield {
            type: EventType.TEXT_MESSAGE_START,
            messageId: "msg_1",
            role: "assistant",
          };
        })() as never,
        initialThreadId: "thread_123",
      });

      const stream = new TamboStream(makeBaseOptions());

      // Let processing loop start and yield first event
      await new Promise((r) => setTimeout(r, 10));

      // Abort first, then unblock the stream so it checks the signal
      stream.abort();
      resolveHang();

      await expect(stream.thread).rejects.toThrow("Stream aborted");

      try {
        await stream.thread;
      } catch (err) {
        expect((err as Error).name).toBe("AbortError");
      }
    });

    it("iterator ends cleanly after abort", async () => {
      let resolveHang!: () => void;
      const hangPromise = new Promise<void>((r) => {
        resolveHang = r;
      });

      mockedCreateRunStream.mockResolvedValue({
        stream: (async function* () {
          yield {
            type: EventType.RUN_STARTED,
            runId: "run_1",
            threadId: "thread_123",
          };
          await hangPromise;
          yield {
            type: EventType.TEXT_MESSAGE_START,
            messageId: "msg_1",
            role: "assistant",
          };
        })() as never,
        initialThreadId: "thread_123",
      });

      const stream = new TamboStream(makeBaseOptions());

      // Suppress the expected AbortError rejection on .thread
      stream.thread.catch(() => {});

      const collected: StreamEvent[] = [];
      const iterDone = (async () => {
        for await (const item of stream) {
          collected.push(item);
        }
      })();

      await new Promise((r) => setTimeout(r, 10));

      stream.abort();
      resolveHang();

      // Iterator should finish without throwing
      await iterDone;
    });
  });

  describe("single consumption", () => {
    it("throws when iterated a second time", async () => {
      const events = makeEvents();
      setupStreamMocks(events);
      const stream = new TamboStream(makeBaseOptions());

      for await (const _item of stream) {
        // consume
      }

      expect(() => {
        stream[Symbol.asyncIterator]();
      }).toThrow("TamboStream can only be iterated once");
    });
  });

  describe("error propagation", () => {
    it("createRunStream rejection rejects .thread", async () => {
      mockedCreateRunStream.mockRejectedValue(new Error("Network failure"));

      const stream = new TamboStream(makeBaseOptions());

      await expect(stream.thread).rejects.toThrow("Network failure");
    });

    it("error during event processing throws in iterator", async () => {
      mockedCreateRunStream.mockResolvedValue({
        stream: asyncIterableFromArray([
          {
            type: EventType.RUN_STARTED,
            runId: "run_1",
            threadId: "thread_123",
          },
        ]) as never,
        initialThreadId: "thread_123",
      });

      mockedHandleEventStream.mockImplementation(async function* () {
        yield {
          type: EventType.RUN_STARTED,
          runId: "run_1",
          threadId: "thread_123",
        } as never;
        throw new Error("Stream interrupted");
      } as never);

      const stream = new TamboStream(makeBaseOptions());

      // Suppress the unhandled .thread rejection (tested separately)
      stream.thread.catch(() => {});

      const collected: StreamEvent[] = [];
      await expect(async () => {
        for await (const item of stream) {
          collected.push(item);
        }
      }).rejects.toThrow("Stream interrupted");
    });

    it("error during event processing also rejects .thread", async () => {
      mockedCreateRunStream.mockResolvedValue({
        stream: asyncIterableFromArray([
          {
            type: EventType.RUN_STARTED,
            runId: "run_1",
            threadId: "thread_123",
          },
        ]) as never,
        initialThreadId: "thread_123",
      });

      mockedHandleEventStream.mockImplementation(async function* () {
        yield {
          type: EventType.RUN_STARTED,
          runId: "run_1",
          threadId: "thread_123",
        } as never;
        throw new Error("Stream interrupted");
      } as never);

      const stream = new TamboStream(makeBaseOptions());

      await expect(stream.thread).rejects.toThrow("Stream interrupted");
    });

    it("rejects .thread when no thread state found after completion", async () => {
      const events = makeEvents();
      setupStreamMocks(events);

      const stream = new TamboStream(
        makeBaseOptions({
          getThreadSnapshot: jest.fn(() => undefined),
        }),
      );

      await expect(stream.thread).rejects.toThrow(
        "Stream completed but no thread state found",
      );
    });
  });

  describe("external signal", () => {
    it("passing an already-aborted signal rejects .thread immediately", async () => {
      const events = makeEvents();
      setupStreamMocks(events);

      const abortController = new AbortController();
      abortController.abort(new Error("Pre-aborted"));

      const stream = new TamboStream(
        makeBaseOptions({ signal: abortController.signal }),
      );

      await expect(stream.thread).rejects.toThrow("Stream aborted");
    });

    it("aborting external signal propagates to stream", async () => {
      let resolveHang!: () => void;
      const hangPromise = new Promise<void>((r) => {
        resolveHang = r;
      });

      mockedCreateRunStream.mockResolvedValue({
        stream: (async function* () {
          yield {
            type: EventType.RUN_STARTED,
            runId: "run_1",
            threadId: "thread_123",
          };
          await hangPromise;
          yield {
            type: EventType.TEXT_MESSAGE_START,
            messageId: "msg_1",
            role: "assistant",
          };
        })() as never,
        initialThreadId: "thread_123",
      });

      const externalAbort = new AbortController();

      const stream = new TamboStream(
        makeBaseOptions({ signal: externalAbort.signal }),
      );

      await new Promise((r) => setTimeout(r, 10));

      externalAbort.abort(new Error("External cancel"));
      resolveHang();

      await expect(stream.thread).rejects.toThrow("Stream aborted");
    });
  });

  describe("dispatch integration", () => {
    it("calls dispatch for each event with EVENT type and threadId", async () => {
      const events = makeEvents();
      setupStreamMocks(events);
      const options = makeBaseOptions();
      const stream = new TamboStream(options);

      await stream.thread;

      const dispatchCalls = (options.dispatch as jest.Mock).mock.calls;
      expect(dispatchCalls.length).toBeGreaterThanOrEqual(events.length);

      for (const [action] of dispatchCalls) {
        expect(action.type).toBe("EVENT");
        expect(action.threadId).toBe("thread_123");
      }
    });
  });

  describe("new thread creation (threadId undefined)", () => {
    it("extracts threadId from RUN_STARTED event when initialThreadId is undefined", async () => {
      const events = makeEvents();
      mockedCreateRunStream.mockResolvedValue({
        stream: asyncIterableFromArray(events) as never,
        initialThreadId: undefined,
      });

      const fakeThread = makeFakeThread("thread_123");
      const stream = new TamboStream(
        makeBaseOptions({
          threadId: undefined,
          getThreadSnapshot: jest.fn(() => fakeThread),
        }),
      );

      const thread = await stream.thread;
      expect(thread.id).toBe("thread_123");
    });
  });

  describe("skipped events (no snapshot)", () => {
    it("does not yield events when getThreadSnapshot returns undefined", async () => {
      const events = makeEvents();
      setupStreamMocks(events);

      const stream = new TamboStream(
        makeBaseOptions({
          getThreadSnapshot: jest.fn(() => undefined),
        }),
      );

      // Suppress the expected .thread rejection (tested separately)
      stream.thread.catch(() => {});

      const collected: StreamEvent[] = [];
      try {
        for await (const item of stream) {
          collected.push(item);
        }
      } catch {
        // Expected - "Stream completed but no thread state found"
      }

      expect(collected).toHaveLength(0);
    });
  });
});
