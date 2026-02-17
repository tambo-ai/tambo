/**
 * Tests for executeRun
 */

import { z } from "zod";
import type { TamboClient } from "./client";
import { executeRun } from "./run";
import { createToolRegistry } from "./tools";

function makeEvent(data: Record<string, unknown>) {
  return data;
}

function mockStream(events: Array<Record<string, unknown>>) {
  return {
    [Symbol.asyncIterator]() {
      let i = 0;
      return {
        async next() {
          if (i < events.length) {
            return { value: events[i++], done: false };
          }
          return { value: undefined, done: true };
        },
      };
    },
  };
}

function makeMockClient(
  streamFactory: () => unknown,
  options?: { userKey?: string },
): TamboClient {
  return {
    sdk: {
      threads: {
        runs: {
          run: jest
            .fn()
            .mockImplementation(async () => await Promise.resolve(streamFactory())),
        },
      },
    },
    queryClient: {} as TamboClient["queryClient"],
    threads: {} as TamboClient["threads"],
    ...(options?.userKey ? { userKey: options.userKey } : {}),
  } as unknown as TamboClient;
}

describe("executeRun", () => {
  it("returns collected text from a simple response", async () => {
    const client = makeMockClient(() =>
      mockStream([
        makeEvent({ type: "RUN_STARTED", runId: "run_1" }),
        makeEvent({ type: "TEXT_MESSAGE_CONTENT", delta: "Hello " }),
        makeEvent({ type: "TEXT_MESSAGE_CONTENT", delta: "world!" }),
        makeEvent({ type: "RUN_FINISHED" }),
      ]),
    );

    const result = await executeRun(client, "thread_1", "Hi");
    expect(result).toBe("Hello world!");
  });

  it("calls onEvent for each streaming event", async () => {
    const events: unknown[] = [];
    const client = makeMockClient(() =>
      mockStream([
        makeEvent({ type: "RUN_STARTED", runId: "run_1" }),
        makeEvent({ type: "TEXT_MESSAGE_CONTENT", delta: "Hi" }),
        makeEvent({ type: "RUN_FINISHED" }),
      ]),
    );

    await executeRun(client, "thread_1", "Hi", {
      onEvent: (e) => events.push(e),
    });

    expect(events).toHaveLength(3);
  });

  it("executes tool calls and sends results back", async () => {
    let callCount = 0;
    const client = makeMockClient(() => {
      callCount++;
      if (callCount === 1) {
        return mockStream([
          makeEvent({ type: "RUN_STARTED", runId: "run_1" }),
          makeEvent({
            type: "TOOL_CALL_START",
            toolCallId: "tc_1",
            toolCallName: "add",
          }),
          makeEvent({
            type: "TOOL_CALL_ARGS",
            toolCallId: "tc_1",
            delta: '{"a":2,',
          }),
          makeEvent({
            type: "TOOL_CALL_ARGS",
            toolCallId: "tc_1",
            delta: '"b":3}',
          }),
          makeEvent({ type: "TOOL_CALL_END", toolCallId: "tc_1" }),
          makeEvent({ type: "RUN_FINISHED" }),
        ]);
      }
      return mockStream([
        makeEvent({ type: "RUN_STARTED", runId: "run_2" }),
        makeEvent({ type: "TEXT_MESSAGE_CONTENT", delta: "The sum is 5" }),
        makeEvent({ type: "RUN_FINISHED" }),
      ]);
    });

    const tools = createToolRegistry();
    tools.register({
      name: "add",
      description: "Add numbers",
      inputSchema: z.object({ a: z.number(), b: z.number() }),
      execute: async ({ a, b }) => ({ sum: a + b }),
    });

    const result = await executeRun(client, "thread_1", "Add 2+3", { tools });
    expect(result).toBe("The sum is 5");

    // Second call should have tool results and previousRunId
    const runFn = client.sdk.threads.runs.run as jest.Mock;
    expect(runFn).toHaveBeenCalledTimes(2);
    const secondCallParams = runFn.mock.calls[1]![1];
    expect(secondCallParams.previousRunId).toBe("run_1");
    expect(secondCallParams.message.content[0].type).toBe("tool_result");
  });

  it("throws when tool calls requested but no registry provided", async () => {
    const client = makeMockClient(() =>
      mockStream([
        makeEvent({ type: "RUN_STARTED", runId: "run_1" }),
        makeEvent({
          type: "TOOL_CALL_START",
          toolCallId: "tc_1",
          toolCallName: "foo",
        }),
        makeEvent({ type: "TOOL_CALL_END", toolCallId: "tc_1" }),
        makeEvent({ type: "RUN_FINISHED" }),
      ]),
    );

    await expect(executeRun(client, "thread_1", "Hi")).rejects.toThrow(
      "no tool registry was provided",
    );
  });

  it("throws when max tool rounds exceeded", async () => {
    const client = makeMockClient(() =>
      mockStream([
        makeEvent({ type: "RUN_STARTED", runId: "run_1" }),
        makeEvent({
          type: "TOOL_CALL_START",
          toolCallId: "tc_1",
          toolCallName: "noop",
        }),
        makeEvent({ type: "TOOL_CALL_ARGS", toolCallId: "tc_1", delta: "{}" }),
        makeEvent({ type: "TOOL_CALL_END", toolCallId: "tc_1" }),
        makeEvent({ type: "RUN_FINISHED" }),
      ]),
    );

    const tools = createToolRegistry();
    tools.register({
      name: "noop",
      description: "Does nothing",
      inputSchema: z.object({}),
      execute: async () => ({}),
    });

    await expect(
      executeRun(client, "thread_1", "Hi", { tools, maxToolRounds: 1 }),
    ).rejects.toThrow("Exceeded maximum tool rounds");
  });

  it("handles tool execution errors gracefully", async () => {
    let callCount = 0;
    const client = makeMockClient(() => {
      callCount++;
      if (callCount === 1) {
        return mockStream([
          makeEvent({ type: "RUN_STARTED", runId: "run_1" }),
          makeEvent({
            type: "TOOL_CALL_START",
            toolCallId: "tc_1",
            toolCallName: "fail",
          }),
          makeEvent({
            type: "TOOL_CALL_ARGS",
            toolCallId: "tc_1",
            delta: "{}",
          }),
          makeEvent({ type: "TOOL_CALL_END", toolCallId: "tc_1" }),
          makeEvent({ type: "RUN_FINISHED" }),
        ]);
      }
      return mockStream([
        makeEvent({ type: "RUN_STARTED", runId: "run_2" }),
        makeEvent({ type: "TEXT_MESSAGE_CONTENT", delta: "Error handled" }),
        makeEvent({ type: "RUN_FINISHED" }),
      ]);
    });

    const tools = createToolRegistry();
    tools.register({
      name: "fail",
      description: "Always fails",
      inputSchema: z.object({}),
      execute: async () => {
        throw new Error("Boom!");
      },
    });

    const result = await executeRun(client, "thread_1", "Hi", { tools });
    expect(result).toBe("Error handled");

    // Tool result should have isError flag
    const runFn = client.sdk.threads.runs.run as jest.Mock;
    const secondCallParams = runFn.mock.calls[1]![1];
    expect(secondCallParams.message.content[0].isError).toBe(true);
  });

  it("passes tools in API format with initial request", async () => {
    const client = makeMockClient(() =>
      mockStream([
        makeEvent({ type: "RUN_STARTED", runId: "run_1" }),
        makeEvent({ type: "TEXT_MESSAGE_CONTENT", delta: "Done" }),
        makeEvent({ type: "RUN_FINISHED" }),
      ]),
    );

    const tools = createToolRegistry();
    tools.register({
      name: "search",
      description: "Search",
      inputSchema: z.object({ q: z.string() }),
      execute: async () => ({ results: [] }),
    });

    await executeRun(client, "thread_1", "Hi", { tools });

    const runFn = client.sdk.threads.runs.run as jest.Mock;
    const params = runFn.mock.calls[0]![1];
    expect(params.tools).toBeDefined();
    expect(params.tools[0].name).toBe("search");
  });

  it("includes userKey in run params when set on client", async () => {
    const client = makeMockClient(
      () =>
        mockStream([
          makeEvent({ type: "RUN_STARTED", runId: "run_1" }),
          makeEvent({ type: "TEXT_MESSAGE_CONTENT", delta: "Hi" }),
          makeEvent({ type: "RUN_FINISHED" }),
        ]),
      { userKey: "user_xyz" },
    );

    await executeRun(client, "thread_1", "Hello");

    const runFn = client.sdk.threads.runs.run as jest.Mock;
    const params = runFn.mock.calls[0]![1];
    expect(params.userKey).toBe("user_xyz");
  });

  it("omits userKey from run params when not set on client", async () => {
    const client = makeMockClient(() =>
      mockStream([
        makeEvent({ type: "RUN_STARTED", runId: "run_1" }),
        makeEvent({ type: "TEXT_MESSAGE_CONTENT", delta: "Hi" }),
        makeEvent({ type: "RUN_FINISHED" }),
      ]),
    );

    await executeRun(client, "thread_1", "Hello");

    const runFn = client.sdk.threads.runs.run as jest.Mock;
    const params = runFn.mock.calls[0]![1];
    expect(params.userKey).toBeUndefined();
  });
});
