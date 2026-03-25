import { EventType, type RunErrorEvent } from "@ag-ui/core";
import {
  createInitialState,
  createInitialThreadState,
  streamReducer,
} from "./event-accumulator";

function createTestStreamState(threadId: string) {
  const state = createInitialState();
  return {
    ...state,
    currentThreadId: threadId,
    threadMap: {
      [threadId]: createInitialThreadState(threadId),
    },
  };
}

describe("streamReducer RUN_ERROR handling", () => {
  it("stores error with message and code", () => {
    const state = createTestStreamState("thread_1");
    const event: RunErrorEvent = {
      type: EventType.RUN_ERROR,
      message: "Something went wrong",
      code: "INTERNAL_ERROR",
    };

    const result = streamReducer(state, {
      type: "EVENT",
      event,
      threadId: "thread_1",
    });

    expect(result.threadMap.thread_1.thread.status).toBe("idle");
    expect(result.threadMap.thread_1.streaming.status).toBe("idle");
    expect(result.threadMap.thread_1.streaming.error?.message).toBe(
      "Something went wrong",
    );
    expect(result.threadMap.thread_1.streaming.error?.code).toBe(
      "INTERNAL_ERROR",
    );
  });

  it("propagates category and isRetryable from extended error events", () => {
    const state = createTestStreamState("thread_1");
    const event = {
      type: EventType.RUN_ERROR,
      message: "You do not have access to the organization",
      code: "UPSTREAM_CLIENT_ERROR",
      category: "client_error",
      isRetryable: false,
    } as RunErrorEvent;

    const result = streamReducer(state, {
      type: "EVENT",
      event,
      threadId: "thread_1",
    });

    const error = result.threadMap.thread_1.streaming.error;
    expect(error?.message).toBe("You do not have access to the organization");
    expect(error?.code).toBe("UPSTREAM_CLIENT_ERROR");
    expect(error?.category).toBe("client_error");
    expect(error?.isRetryable).toBe(false);
  });

  it("propagates server_error category with isRetryable true", () => {
    const state = createTestStreamState("thread_1");
    const event = {
      type: EventType.RUN_ERROR,
      message: "The AI provider encountered a temporary error",
      code: "UPSTREAM_SERVER_ERROR",
      category: "server_error",
      isRetryable: true,
    } as RunErrorEvent;

    const result = streamReducer(state, {
      type: "EVENT",
      event,
      threadId: "thread_1",
    });

    const error = result.threadMap.thread_1.streaming.error;
    expect(error?.message).toBe(
      "The AI provider encountered a temporary error",
    );
    expect(error?.code).toBe("UPSTREAM_SERVER_ERROR");
    expect(error?.category).toBe("server_error");
    expect(error?.isRetryable).toBe(true);
  });

  it("sets lastRunCancelled and no error when code is CANCELLED", () => {
    const state = createTestStreamState("thread_1");
    const event: RunErrorEvent = {
      type: EventType.RUN_ERROR,
      message: "Run cancelled",
      code: "CANCELLED",
    };

    const result = streamReducer(state, {
      type: "EVENT",
      event,
      threadId: "thread_1",
    });

    expect(result.threadMap.thread_1.thread.lastRunCancelled).toBe(true);
    expect(result.threadMap.thread_1.streaming.error).toBeUndefined();
  });

  it("handles events without category/isRetryable (backward compat)", () => {
    const state = createTestStreamState("thread_1");
    const event: RunErrorEvent = {
      type: EventType.RUN_ERROR,
      message: "Generic error",
    };

    const result = streamReducer(state, {
      type: "EVENT",
      event,
      threadId: "thread_1",
    });

    const error = result.threadMap.thread_1.streaming.error;
    expect(error?.message).toBe("Generic error");
    expect(error?.category).toBeUndefined();
    expect(error?.isRetryable).toBeUndefined();
  });
});
