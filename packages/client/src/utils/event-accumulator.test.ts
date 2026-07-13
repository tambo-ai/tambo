import {
  EventType,
  type ReasoningMessageContentEvent,
  type ReasoningMessageEndEvent,
  type ReasoningMessageStartEvent,
  type RunErrorEvent,
  type RunFinishedEvent,
  type RunStartedEvent,
  type TextMessageStartEvent,
} from "@ag-ui/core";
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
      code: "LLM_CLIENT_ERROR",
      category: "client_error",
      isRetryable: false,
      status: 401,
    } as RunErrorEvent;

    const result = streamReducer(state, {
      type: "EVENT",
      event,
      threadId: "thread_1",
    });

    const error = result.threadMap.thread_1.streaming.error;
    expect(error?.message).toBe("You do not have access to the organization");
    expect(error?.code).toBe("LLM_CLIENT_ERROR");
    expect(error?.category).toBe("client_error");
    expect(error?.isRetryable).toBe(false);
    expect(error?.status).toBe(401);
  });

  it("propagates server_error category with isRetryable true", () => {
    const state = createTestStreamState("thread_1");
    const event = {
      type: EventType.RUN_ERROR,
      message: "The AI provider encountered a temporary error",
      code: "LLM_SERVER_ERROR",
      category: "server_error",
      isRetryable: true,
      status: 500,
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
    expect(error?.code).toBe("LLM_SERVER_ERROR");
    expect(error?.category).toBe("server_error");
    expect(error?.isRetryable).toBe(true);
    expect(error?.status).toBe(500);
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

describe("streamReducer REASONING_MESSAGE_* handling", () => {
  it("accumulates reasoning content and duration on an assistant message", () => {
    const state = createTestStreamState("thread_1");

    const startEvent: ReasoningMessageStartEvent = {
      type: EventType.REASONING_MESSAGE_START,
      messageId: "reasoning-message-1",
      role: "reasoning",
      timestamp: 1704067200000,
    };
    const contentEvent: ReasoningMessageContentEvent = {
      type: EventType.REASONING_MESSAGE_CONTENT,
      messageId: "reasoning-message-1",
      delta: "Let me think about this...",
      timestamp: 1704067201000,
    };
    const endEvent: ReasoningMessageEndEvent = {
      type: EventType.REASONING_MESSAGE_END,
      messageId: "reasoning-message-1",
      timestamp: 1704067205000,
    };

    const afterStart = streamReducer(state, {
      type: "EVENT",
      event: startEvent,
      threadId: "thread_1",
    });
    const afterContent = streamReducer(afterStart, {
      type: "EVENT",
      event: contentEvent,
      threadId: "thread_1",
    });
    const afterEnd = streamReducer(afterContent, {
      type: "EVENT",
      event: endEvent,
      threadId: "thread_1",
    });

    const [message] = afterEnd.threadMap.thread_1.thread.messages;

    expect(message.role).toBe("assistant");
    expect(message.reasoning).toEqual(["Let me think about this..."]);
    expect(message.reasoningDurationMS).toBe(5000);
  });
});

describe("streamReducer ephemeral reasoning message lifecycle", () => {
  it("clears streaming.messageId when a run finishes", () => {
    let state = createTestStreamState("thread_1");

    const runStarted: RunStartedEvent = {
      type: EventType.RUN_STARTED,
      threadId: "thread_1",
      runId: "run_1",
    };
    const reasoningStart: ReasoningMessageStartEvent = {
      type: EventType.REASONING_MESSAGE_START,
      messageId: "reasoning-1",
      role: "reasoning",
    };
    const runFinished: RunFinishedEvent = {
      type: EventType.RUN_FINISHED,
      threadId: "thread_1",
      runId: "run_1",
    };

    for (const event of [runStarted, reasoningStart, runFinished]) {
      state = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });
    }

    const threadState = state.threadMap.thread_1;
    // The reasoning event created an ephemeral message that was never adopted.
    expect(threadState.thread.messages[0].id).toMatch(/^ephemeral_/);
    // messageId must be cleared so the next run cannot hijack the orphan.
    expect(threadState.streaming.messageId).toBeUndefined();
  });

  it("clears streaming.messageId when a run errors", () => {
    let state = createTestStreamState("thread_1");

    const runStarted: RunStartedEvent = {
      type: EventType.RUN_STARTED,
      threadId: "thread_1",
      runId: "run_1",
    };
    const reasoningStart: ReasoningMessageStartEvent = {
      type: EventType.REASONING_MESSAGE_START,
      messageId: "reasoning-1",
      role: "reasoning",
    };
    const runError: RunErrorEvent = {
      type: EventType.RUN_ERROR,
      message: "boom",
      code: "INTERNAL_ERROR",
    };

    for (const event of [runStarted, reasoningStart, runError]) {
      state = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });
    }

    expect(state.threadMap.thread_1.streaming.messageId).toBeUndefined();
  });

  it("does not adopt an orphaned ephemeral from a previous run", () => {
    let state = createTestStreamState("thread_1");

    // Run 1: model stalls after emitting reasoning only. An ephemeral is created
    // to hold the reasoning but never adopted by a TEXT_MESSAGE_START.
    const run1Started: RunStartedEvent = {
      type: EventType.RUN_STARTED,
      threadId: "thread_1",
      runId: "run_1",
    };
    const reasoningStart: ReasoningMessageStartEvent = {
      type: EventType.REASONING_MESSAGE_START,
      messageId: "reasoning-1",
      role: "reasoning",
    };
    const reasoningContent: ReasoningMessageContentEvent = {
      type: EventType.REASONING_MESSAGE_CONTENT,
      messageId: "reasoning-1",
      delta: "thinking...",
    };
    const run1Finished: RunFinishedEvent = {
      type: EventType.RUN_FINISHED,
      threadId: "thread_1",
      runId: "run_1",
    };

    // Run 2: a normal assistant text message.
    const run2Started: RunStartedEvent = {
      type: EventType.RUN_STARTED,
      threadId: "thread_1",
      runId: "run_2",
    };
    const textStart: TextMessageStartEvent = {
      type: EventType.TEXT_MESSAGE_START,
      messageId: "real-message-1",
      role: "assistant",
    };

    for (const event of [
      run1Started,
      reasoningStart,
      reasoningContent,
      run1Finished,
      run2Started,
      textStart,
    ]) {
      state = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });
    }

    const { messages } = state.threadMap.thread_1.thread;
    // The orphaned ephemeral must remain untouched at index 0.
    expect(messages[0].id).toMatch(/^ephemeral_/);
    expect(messages[0].reasoning).toEqual(["thinking..."]);
    // A fresh message is created for run 2 rather than hijacking the orphan.
    expect(messages).toHaveLength(2);
    expect(messages[1].id).toBe("real-message-1");
    expect(state.threadMap.thread_1.streaming.messageId).toBe("real-message-1");
  });

  it("still adopts the current run's ephemeral within the same run", () => {
    let state = createTestStreamState("thread_1");

    const runStarted: RunStartedEvent = {
      type: EventType.RUN_STARTED,
      threadId: "thread_1",
      runId: "run_1",
    };
    const reasoningStart: ReasoningMessageStartEvent = {
      type: EventType.REASONING_MESSAGE_START,
      messageId: "reasoning-1",
      role: "reasoning",
    };
    const reasoningContent: ReasoningMessageContentEvent = {
      type: EventType.REASONING_MESSAGE_CONTENT,
      messageId: "reasoning-1",
      delta: "thinking...",
    };
    const textStart: TextMessageStartEvent = {
      type: EventType.TEXT_MESSAGE_START,
      messageId: "real-message-1",
      role: "assistant",
    };

    for (const event of [
      runStarted,
      reasoningStart,
      reasoningContent,
      textStart,
    ]) {
      state = streamReducer(state, {
        type: "EVENT",
        event,
        threadId: "thread_1",
      });
    }

    const { messages } = state.threadMap.thread_1.thread;
    // The ephemeral is adopted: its position is reused and the ID is rewritten.
    expect(messages).toHaveLength(1);
    expect(messages[0].id).toBe("real-message-1");
    expect(messages[0].reasoning).toEqual(["thinking..."]);
    expect(state.threadMap.thread_1.streaming.messageId).toBe("real-message-1");
  });
});
