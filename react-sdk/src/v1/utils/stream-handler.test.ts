import { EventType } from "@ag-ui/core";
import { handleEventStream } from "./stream-handler";

describe("handleEventStream", () => {
  it("yields events from the stream", async () => {
    const mockEvents = [
      { type: EventType.RUN_STARTED, runId: "run_1", threadId: "thread_1" },
      {
        type: EventType.TEXT_MESSAGE_START,
        messageId: "msg_1",
        role: "assistant",
      },
      { type: EventType.RUN_FINISHED, runId: "run_1", threadId: "thread_1" },
    ];

    async function* mockStream() {
      for (const event of mockEvents) {
        yield event;
      }
    }

    const result: unknown[] = [];
    for await (const event of handleEventStream(mockStream())) {
      result.push(event);
    }

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual(mockEvents[0]);
    expect(result[1]).toEqual(mockEvents[1]);
    expect(result[2]).toEqual(mockEvents[2]);
  });

  it("handles empty stream", async () => {
    async function* emptyStream() {
      // yields nothing
    }

    const result: unknown[] = [];
    for await (const event of handleEventStream(emptyStream())) {
      result.push(event);
    }

    expect(result).toHaveLength(0);
  });

  it("logs events when debug is enabled in non-production", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const mockEvents = [{ type: EventType.RUN_STARTED, runId: "run_1" }];

    async function* mockStream() {
      for (const event of mockEvents) {
        yield event;
      }
    }

    const result: unknown[] = [];
    for await (const event of handleEventStream(mockStream(), {
      debug: true,
    })) {
      result.push(event);
    }

    expect(logSpy).toHaveBeenCalledWith(
      "[StreamHandler] Event:",
      expect.objectContaining({ type: EventType.RUN_STARTED }),
    );

    logSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });

  it("does not log when debug is false", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    async function* mockStream() {
      yield { type: EventType.RUN_STARTED };
    }

    for await (const _event of handleEventStream(mockStream(), {
      debug: false,
    })) {
      // consume stream
    }

    expect(logSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
