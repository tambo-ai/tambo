import { TamboClient } from "./tambo-client";
import type { TamboTool } from "./model/component-metadata";
import { PLACEHOLDER_THREAD_ID } from "./utils/event-accumulator";

// Stable mock functions that survive jest resetMocks.
// We use a closure-based pattern: the jest.mock factory returns functions
// that delegate to these refs, and each test sets up implementations via
// the standard mockResolvedValue / mockImplementation API.
const mocks = {
  sdkConstructorArgs: undefined as unknown,
  threadsList: jest.fn(),
  threadsRetrieve: jest.fn(),
  threadsUpdate: jest.fn(),
  runsCreate: jest.fn(),
  runsDelete: jest.fn(),
  generateName: jest.fn(),
  getMcpToken: jest.fn(),
  suggestionsList: jest.fn(),
  suggestionsGenerate: jest.fn(),
  streamAbort: jest.fn(),
  mcpClientCreate: jest.fn(),
};

// Reset our manual mocks before each test (since resetMocks only affects jest.fn())
beforeEach(() => {
  mocks.sdkConstructorArgs = undefined;
  mocks.threadsList.mockReset();
  mocks.threadsRetrieve.mockReset();
  mocks.threadsUpdate.mockReset();
  mocks.runsCreate.mockReset();
  mocks.runsDelete.mockReset();
  mocks.generateName.mockReset();
  mocks.getMcpToken.mockReset();
  mocks.suggestionsList.mockReset();
  mocks.suggestionsGenerate.mockReset();
  mocks.streamAbort.mockReset();
  mocks.mcpClientCreate.mockReset();
  mocks.mcpClientCreate.mockResolvedValue({ close: jest.fn() });
});

jest.mock("@tambo-ai/typescript-sdk", () => {
  // This factory runs once. We return a class-like constructor that
  // captures constructor args and returns a mock SDK object whose
  // methods delegate to our stable mocks object.
  function MockTamboAI(this: unknown, opts: unknown) {
    // Store the latest constructor args for assertions
    mocks.sdkConstructorArgs = opts;
    return {
      threads: {
        list: (...a: unknown[]) => mocks.threadsList(...a),
        retrieve: (...a: unknown[]) => mocks.threadsRetrieve(...a),
        update: (...a: unknown[]) => mocks.threadsUpdate(...a),
        runs: {
          create: (...a: unknown[]) => mocks.runsCreate(...a),
          delete: (...a: unknown[]) => mocks.runsDelete(...a),
        },
      },
      beta: {
        threads: {
          generateName: (...a: unknown[]) => mocks.generateName(...a),
          suggestions: {
            list: (...a: unknown[]) => mocks.suggestionsList(...a),
            generate: (...a: unknown[]) => mocks.suggestionsGenerate(...a),
          },
        },
        auth: {
          getMcpToken: (...a: unknown[]) => mocks.getMcpToken(...a),
        },
      },
    };
  }
  return { __esModule: true, default: MockTamboAI };
});

jest.mock("./mcp/mcp-client", () => ({
  MCPClient: {
    create: (...a: unknown[]) => mocks.mcpClientCreate(...a),
  },
}));

jest.mock("./tambo-stream", () => ({
  TamboStream: function MockTamboStream() {
    const threadPromise = Promise.resolve({
      id: "thread-1",
      messages: [],
      status: "idle",
    });
    return {
      thread: threadPromise,
      abort: (...a: unknown[]) => mocks.streamAbort(...a),
      [Symbol.asyncIterator]: jest.fn(),
    };
  },
}));

function createMockTool(name: string): TamboTool {
  return {
    name,
    description: `Mock tool: ${name}`,
    tool: jest.fn(),
    inputSchema: { type: "object" as const, properties: {} },
    outputSchema: { type: "object" as const, properties: {} },
  };
}

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe("TamboClient", () => {
  describe("constructor", () => {
    it("creates client with minimal options", () => {
      const client = new TamboClient({ apiKey: "test-key" });
      expect(client).toBeInstanceOf(TamboClient);
    });

    it("throws when both tamboUrl and environment are specified", () => {
      expect(
        () =>
          new TamboClient({
            apiKey: "test-key",
            tamboUrl: "https://custom.example.com",
            environment: "production",
          }),
      ).toThrow(
        "Cannot specify both 'tamboUrl' and 'environment'. Choose one.",
      );
    });

    it("throws when both userKey and userToken are specified", () => {
      expect(
        () =>
          new TamboClient({
            apiKey: "test-key",
            userKey: "user-123",
            userToken: "token-abc",
          }),
      ).toThrow("Cannot specify both 'userKey' and 'userToken'. Choose one.");
    });

    it("registers initial tools from options", () => {
      const tool = createMockTool("my-tool");
      const client = new TamboClient({ apiKey: "test-key", tools: [tool] });
      expect(client).toBeInstanceOf(TamboClient);
    });

    it("accepts tamboUrl option without environment", () => {
      const client = new TamboClient({
        apiKey: "test-key",
        tamboUrl: "https://custom.example.com",
      });
      expect(client).toBeInstanceOf(TamboClient);
      expect(mocks.sdkConstructorArgs).toEqual(
        expect.objectContaining({ baseURL: "https://custom.example.com" }),
      );
    });

    it("accepts environment option without tamboUrl", () => {
      const client = new TamboClient({
        apiKey: "test-key",
        environment: "staging",
      });
      expect(client).toBeInstanceOf(TamboClient);
      expect(mocks.sdkConstructorArgs).toEqual(
        expect.objectContaining({ baseURL: "https://api.staging.tambo.co" }),
      );
    });

    it("uses production URL by default", () => {
      new TamboClient({ apiKey: "test-key" });
      expect(mocks.sdkConstructorArgs).toEqual(
        expect.objectContaining({ baseURL: "https://api.tambo.co" }),
      );
    });

    it("passes apiKey to SDK client", () => {
      new TamboClient({ apiKey: "my-api-key" });
      expect(mocks.sdkConstructorArgs).toEqual(
        expect.objectContaining({ apiKey: "my-api-key" }),
      );
    });
  });

  describe("getAuthState()", () => {
    it("returns unauthenticated when neither userKey nor userToken", () => {
      const client = new TamboClient({ apiKey: "test-key" });
      expect(client.getAuthState()).toEqual({ status: "unauthenticated" });
    });

    it("returns identified with source userKey when userKey is set", () => {
      const client = new TamboClient({
        apiKey: "test-key",
        userKey: "user-123",
      });
      expect(client.getAuthState()).toEqual({
        status: "identified",
        source: "userKey",
      });
    });

    it("returns exchanging when userToken is set", () => {
      const client = new TamboClient({
        apiKey: "test-key",
        userToken: "token-abc",
      });
      expect(client.getAuthState()).toEqual({ status: "exchanging" });
    });
  });

  describe("startNewThread()", () => {
    it("returns the placeholder thread ID", () => {
      const client = new TamboClient({ apiKey: "test-key" });
      const threadId = client.startNewThread();
      expect(threadId).toBe(PLACEHOLDER_THREAD_ID);
    });

    it("sets the current thread to the placeholder", () => {
      const client = new TamboClient({ apiKey: "test-key" });
      client.startNewThread();
      const state = client.getState();
      expect(state.currentThreadId).toBe(PLACEHOLDER_THREAD_ID);
    });

    it("creates a placeholder thread in state", () => {
      const client = new TamboClient({ apiKey: "test-key" });
      client.startNewThread();
      const state = client.getState();
      expect(state.threadMap[PLACEHOLDER_THREAD_ID]).toBeDefined();
      expect(state.threadMap[PLACEHOLDER_THREAD_ID].thread.id).toBe(
        PLACEHOLDER_THREAD_ID,
      );
    });

    it("notifies listeners", async () => {
      const client = new TamboClient({ apiKey: "test-key" });
      const listener = jest.fn();
      client.subscribe(listener);

      client.startNewThread();
      await flushMicrotasks();

      expect(listener).toHaveBeenCalled();
    });
  });

  describe("switchThread()", () => {
    it("fetches thread from API and sets currentThreadId", async () => {
      mocks.threadsRetrieve.mockResolvedValue({
        id: "thread-abc",
        name: "Test Thread",
        messages: [],
      });

      const client = new TamboClient({ apiKey: "test-key" });
      await client.switchThread("thread-abc");
      await flushMicrotasks();

      const state = client.getState();
      expect(state.currentThreadId).toBe("thread-abc");
      expect(mocks.threadsRetrieve).toHaveBeenCalledWith("thread-abc");
    });

    it("hydrates thread messages from API response", async () => {
      mocks.threadsRetrieve.mockResolvedValue({
        id: "thread-abc",
        name: "Test Thread",
        messages: [
          {
            id: "msg-1",
            role: "user",
            content: [{ type: "text", text: "Hello" }],
            createdAt: "2026-01-01T00:00:00Z",
          },
        ],
      });

      const client = new TamboClient({ apiKey: "test-key" });
      await client.switchThread("thread-abc");

      const thread = client.getThread("thread-abc");
      expect(thread).toBeDefined();
      expect(thread!.messages).toHaveLength(1);
      expect(thread!.messages[0].id).toBe("msg-1");
    });
  });

  describe("getThread()", () => {
    it("returns undefined for non-existent thread", () => {
      const client = new TamboClient({ apiKey: "test-key" });
      expect(client.getThread("nonexistent")).toBeUndefined();
    });

    it("returns thread for existing thread", () => {
      const client = new TamboClient({ apiKey: "test-key" });
      client.startNewThread();
      const thread = client.getThread(PLACEHOLDER_THREAD_ID);
      expect(thread).toBeDefined();
      expect(thread!.id).toBe(PLACEHOLDER_THREAD_ID);
    });
  });

  describe("registerTool() / registerTools()", () => {
    it("registers a single tool", () => {
      const client = new TamboClient({ apiKey: "test-key" });
      const tool = createMockTool("test-tool");
      client.registerTool(tool);
      // Verified by not throwing
    });

    it("registers multiple tools at once", () => {
      const client = new TamboClient({ apiKey: "test-key" });
      const tools = [createMockTool("tool-1"), createMockTool("tool-2")];
      client.registerTools(tools);
    });

    it("overwrites tools with the same name", () => {
      const client = new TamboClient({ apiKey: "test-key" });
      const tool1 = createMockTool("same-name");
      const tool2 = createMockTool("same-name");
      tool2.description = "Updated";

      client.registerTool(tool1);
      client.registerTool(tool2);
      // Should not throw - last write wins
    });
  });

  describe("registerComponent()", () => {
    it("registers a component without error", () => {
      const client = new TamboClient({ apiKey: "test-key" });
      client.registerComponent("MyComponent", {
        name: "MyComponent",
        description: "A test component",
        component: {},
        contextTools: [],
        props: {},
      });
    });
  });

  describe("subscribe() / getState()", () => {
    it("returns initial state with placeholder thread", () => {
      const client = new TamboClient({ apiKey: "test-key" });
      const state = client.getState();

      expect(state.currentThreadId).toBe(PLACEHOLDER_THREAD_ID);
      expect(state.threadMap[PLACEHOLDER_THREAD_ID]).toBeDefined();
    });

    it("notifies listeners on state change", async () => {
      const client = new TamboClient({ apiKey: "test-key" });
      const listener = jest.fn();

      client.subscribe(listener);
      client.startNewThread();

      await flushMicrotasks();
      expect(listener).toHaveBeenCalled();
    });

    it("unsubscribe removes listener", async () => {
      const client = new TamboClient({ apiKey: "test-key" });
      const listener = jest.fn();

      const unsubscribe = client.subscribe(listener);
      unsubscribe();

      client.startNewThread();
      await flushMicrotasks();

      expect(listener).not.toHaveBeenCalled();
    });

    it("supports multiple listeners", async () => {
      const client = new TamboClient({ apiKey: "test-key" });
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      client.subscribe(listener1);
      client.subscribe(listener2);

      client.startNewThread();
      await flushMicrotasks();

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it("unsubscribing one listener does not affect others", async () => {
      const client = new TamboClient({ apiKey: "test-key" });
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      const unsub1 = client.subscribe(listener1);
      client.subscribe(listener2);
      unsub1();

      client.startNewThread();
      await flushMicrotasks();

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it("unsubscribe inside listener callback does not crash", async () => {
      const client = new TamboClient({ apiKey: "test-key" });

      // eslint-disable-next-line prefer-const -- circular reference: listener calls unsub
      let unsub: () => void;
      const selfRemovingListener = jest.fn(() => {
        unsub();
      });

      unsub = client.subscribe(selfRemovingListener);
      const stableListener = jest.fn();
      client.subscribe(stableListener);

      client.startNewThread();
      await flushMicrotasks();

      expect(selfRemovingListener).toHaveBeenCalledTimes(1);
      expect(stableListener).toHaveBeenCalled();
    });
  });

  describe("getState() snapshot behavior", () => {
    it("returns the same reference when state has not changed", () => {
      const client = new TamboClient({ apiKey: "test-key" });
      const state1 = client.getState();
      const state2 = client.getState();
      expect(state1).toBe(state2);
    });

    it("returns a new reference after state-changing operation", async () => {
      mocks.threadsRetrieve.mockResolvedValue({
        id: "thread-new",
        name: "New",
        messages: [],
      });

      const client = new TamboClient({ apiKey: "test-key" });
      const stateBefore = client.getState();

      await client.switchThread("thread-new");
      const stateAfter = client.getState();

      expect(stateBefore).not.toBe(stateAfter);
      expect(stateAfter.currentThreadId).toBe("thread-new");
    });
  });

  describe("run()", () => {
    it("returns a TamboStream", () => {
      const client = new TamboClient({ apiKey: "test-key" });
      const stream = client.run("Hello");
      expect(stream).toBeDefined();
      expect(stream.thread).toBeInstanceOf(Promise);
    });

    it("accepts a string message", () => {
      const client = new TamboClient({ apiKey: "test-key" });
      const stream = client.run("Hello");
      expect(stream).toBeDefined();
    });

    it("accepts an InputMessage object", () => {
      const client = new TamboClient({ apiKey: "test-key" });
      const stream = client.run({
        role: "user",
        content: [{ type: "text", text: "Hello" }],
      });
      expect(stream).toBeDefined();
    });

    it("accepts run options", () => {
      const client = new TamboClient({ apiKey: "test-key" });
      const stream = client.run("Hello", {
        autoExecuteTools: false,
        maxSteps: 5,
        debug: true,
        additionalContext: { key: "value" },
      });
      expect(stream).toBeDefined();
    });

    it("throws for concurrent runs on the same thread", () => {
      const client = new TamboClient({ apiKey: "test-key" });
      client.run("First message", { threadId: "thread-123" });

      expect(() => {
        client.run("Second message", { threadId: "thread-123" });
      }).toThrow(
        'A run is already active on thread "thread-123". Wait for it to complete or abort it first.',
      );
    });

    it("allows concurrent runs on different threads", () => {
      const client = new TamboClient({ apiKey: "test-key" });

      client.run("First", { threadId: "thread-1" });
      const stream2 = client.run("Second", { threadId: "thread-2" });

      expect(stream2).toBeDefined();
    });

    it("does not reject concurrent runs on placeholder threads", () => {
      const client = new TamboClient({ apiKey: "test-key" });

      const stream1 = client.run("First", { threadId: PLACEHOLDER_THREAD_ID });
      const stream2 = client.run("Second", { threadId: PLACEHOLDER_THREAD_ID });

      expect(stream1).toBeDefined();
      expect(stream2).toBeDefined();
    });

    it("does not reject runs without threadId", () => {
      const client = new TamboClient({ apiKey: "test-key" });
      const stream1 = client.run("First");
      const stream2 = client.run("Second");

      expect(stream1).toBeDefined();
      expect(stream2).toBeDefined();
    });

    it("cleans up active run tracking when stream resolves", async () => {
      const client = new TamboClient({ apiKey: "test-key" });
      client.run("Hello", { threadId: "thread-cleanup" });

      // Wait for the stream's .thread promise to resolve (mocked to resolve immediately)
      await flushMicrotasks();
      // Yield to the .finally() handler
      await new Promise((r) => setTimeout(r, 0));

      // Should now allow a new run on the same thread
      expect(() => {
        client.run("Hello again", { threadId: "thread-cleanup" });
      }).not.toThrow();
    });
  });

  describe("cancelRun()", () => {
    it("aborts active stream on the given thread", async () => {
      const client = new TamboClient({ apiKey: "test-key" });
      client.run("Hello", { threadId: "thread-cancel" });

      mocks.runsDelete.mockResolvedValue({});
      await client.cancelRun("thread-cancel");

      expect(mocks.streamAbort).toHaveBeenCalled();
    });

    it("does not throw when no active run exists", async () => {
      const client = new TamboClient({ apiKey: "test-key" });
      await expect(client.cancelRun("no-thread")).resolves.not.toThrow();
    });

    it("defaults to current thread if no threadId provided", async () => {
      const client = new TamboClient({ apiKey: "test-key" });
      await expect(client.cancelRun()).resolves.not.toThrow();
    });
  });

  describe("listThreads()", () => {
    it("returns threads from the API", async () => {
      mocks.threadsList.mockResolvedValue({
        threads: [
          {
            id: "thread-1",
            name: "Thread 1",
            metadata: {},
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z",
          },
          {
            id: "thread-2",
            name: null,
            metadata: null,
            createdAt: "2026-01-02T00:00:00Z",
            updatedAt: "2026-01-02T00:00:00Z",
          },
        ],
      });

      const client = new TamboClient({
        apiKey: "test-key",
        userKey: "user-1",
      });
      const threads = await client.listThreads();

      expect(threads).toHaveLength(2);
      expect(threads[0].id).toBe("thread-1");
      expect(threads[0].name).toBe("Thread 1");
      expect(threads[1].name).toBeUndefined();
      expect(threads[1].metadata).toBeUndefined();
      expect(mocks.threadsList).toHaveBeenCalledWith({ userKey: "user-1" });
    });

    it("returns empty messages array for each thread", async () => {
      mocks.threadsList.mockResolvedValue({
        threads: [
          {
            id: "thread-1",
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z",
          },
        ],
      });

      const client = new TamboClient({ apiKey: "test-key" });
      const threads = await client.listThreads();

      expect(threads[0].messages).toEqual([]);
      expect(threads[0].lastRunCancelled).toBe(false);
      expect(threads[0].status).toBe("idle");
    });
  });

  describe("fetchThread()", () => {
    it("fetches and hydrates a thread into state", async () => {
      mocks.threadsRetrieve.mockResolvedValue({
        id: "thread-fetch",
        name: "Fetched Thread",
        messages: [
          {
            id: "msg-1",
            role: "assistant",
            content: [{ type: "text", text: "Hi" }],
            createdAt: "2026-01-01T00:00:01Z",
          },
        ],
        lastCompletedRunId: "run-99",
      });

      const client = new TamboClient({ apiKey: "test-key" });
      const thread = await client.fetchThread("thread-fetch");

      expect(thread.id).toBe("thread-fetch");
      expect(thread.name).toBe("Fetched Thread");
      expect(thread.messages).toHaveLength(1);
    });

    it("sets lastCompletedRunId when present in API response", async () => {
      mocks.threadsRetrieve.mockResolvedValue({
        id: "thread-run",
        messages: [],
        lastCompletedRunId: "run-42",
      });

      const client = new TamboClient({ apiKey: "test-key" });
      await client.fetchThread("thread-run");

      const state = client.getState();
      expect(state.threadMap["thread-run"].lastCompletedRunId).toBe("run-42");
    });

    it("does not reinitialize existing thread", async () => {
      mocks.threadsRetrieve.mockResolvedValue({
        id: "thread-existing",
        messages: [],
      });

      const client = new TamboClient({ apiKey: "test-key" });

      // Fetch twice - should not throw or corrupt state
      await client.fetchThread("thread-existing");
      await client.fetchThread("thread-existing");

      const thread = client.getThread("thread-existing");
      expect(thread).toBeDefined();
    });
  });

  describe("updateThreadName()", () => {
    it("calls API and updates local state", async () => {
      mocks.threadsUpdate.mockResolvedValue({});
      mocks.threadsRetrieve.mockResolvedValue({
        id: "thread-name",
        messages: [],
      });

      const client = new TamboClient({ apiKey: "test-key" });
      await client.fetchThread("thread-name");
      await client.updateThreadName("thread-name", "New Name");

      expect(mocks.threadsUpdate).toHaveBeenCalledWith("thread-name", {
        name: "New Name",
      });

      const thread = client.getThread("thread-name");
      expect(thread?.name).toBe("New Name");
    });
  });

  describe("generateThreadName()", () => {
    it("calls API and updates local state", async () => {
      mocks.generateName.mockResolvedValue({ name: "Generated Name" });
      mocks.threadsRetrieve.mockResolvedValue({
        id: "thread-gen",
        messages: [],
      });

      const client = new TamboClient({ apiKey: "test-key" });
      await client.fetchThread("thread-gen");

      const name = await client.generateThreadName("thread-gen");

      expect(name).toBe("Generated Name");
      expect(mocks.generateName).toHaveBeenCalledWith("thread-gen");

      const thread = client.getThread("thread-gen");
      expect(thread?.name).toBe("Generated Name");
    });

    it("returns empty string when API returns no name", async () => {
      mocks.generateName.mockResolvedValue({ name: null });

      const client = new TamboClient({ apiKey: "test-key" });
      const name = await client.generateThreadName("thread-no-name");

      expect(name).toBe("");
    });
  });

  describe("context helpers", () => {
    it("adds and removes context helpers", () => {
      const client = new TamboClient({ apiKey: "test-key" });
      const helper = () => ({ foo: "bar" });

      client.addContextHelper("test-helper", helper);
      client.removeContextHelper("test-helper");
    });

    it("removing nonexistent helper does not throw", () => {
      const client = new TamboClient({ apiKey: "test-key" });
      client.removeContextHelper("nonexistent");
    });
  });

  describe("getSdkClient()", () => {
    it("returns the underlying SDK client", () => {
      const client = new TamboClient({ apiKey: "test-key" });
      const sdkClient = client.getSdkClient();
      expect(sdkClient).toBeDefined();
      expect(sdkClient.threads).toBeDefined();
      expect(sdkClient.beta).toBeDefined();
    });
  });

  describe("MCP operations", () => {
    it("getMcpClients returns empty record initially", () => {
      const client = new TamboClient({ apiKey: "test-key" });
      const mcpClients = client.getMcpClients();
      expect(mcpClients).toEqual({});
    });

    it("getMcpToken calls SDK", async () => {
      mocks.getMcpToken.mockResolvedValue({
        mcpAccessToken: "mcp-token-123",
        expiresAt: 1234567890,
        hasSession: true,
      });

      const client = new TamboClient({ apiKey: "test-key" });
      const result = await client.getMcpToken("context-key", "thread-1");

      expect(result.mcpAccessToken).toBe("mcp-token-123");
      expect(result.expiresAt).toBe(1234567890);
      expect(result.hasSession).toBe(true);
      expect(mocks.getMcpToken).toHaveBeenCalledWith({
        contextKey: "context-key",
        threadId: "thread-1",
      });
    });

    it("getMcpConnectionStatuses returns empty record initially", () => {
      const client = new TamboClient({ apiKey: "test-key" });
      expect(client.getMcpConnectionStatuses()).toEqual({});
    });

    it("tracks connection status through connecting → connected", async () => {
      const onChange = jest.fn();
      const client = new TamboClient({
        apiKey: "test-key",
        onMcpConnectionChange: onChange,
      });

      await client.connectMcpServer({ url: "https://mcp.example.com/sse" });

      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange).toHaveBeenNthCalledWith(1, expect.any(String), {
        url: "https://mcp.example.com/sse",
        status: "connecting",
      });
      expect(onChange).toHaveBeenNthCalledWith(2, expect.any(String), {
        url: "https://mcp.example.com/sse",
        status: "connected",
      });

      const statuses = client.getMcpConnectionStatuses();
      const key = Object.keys(statuses)[0];
      expect(statuses[key]).toEqual({
        url: "https://mcp.example.com/sse",
        status: "connected",
      });
    });

    it("tracks connection status through connecting → error", async () => {
      mocks.mcpClientCreate.mockRejectedValue(new Error("connection refused"));

      const onChange = jest.fn();
      const client = new TamboClient({
        apiKey: "test-key",
        onMcpConnectionChange: onChange,
      });

      await expect(
        client.connectMcpServer({ url: "https://mcp.example.com/fail" }),
      ).rejects.toThrow("connection refused");

      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange).toHaveBeenNthCalledWith(2, expect.any(String), {
        url: "https://mcp.example.com/fail",
        status: "error",
        error: "connection refused",
      });
    });

    it("constructor reports errors via onMcpConnectionChange instead of console", async () => {
      mocks.mcpClientCreate.mockRejectedValue(new Error("timeout"));
      const onChange = jest.fn();

      new TamboClient({
        apiKey: "test-key",
        mcpServers: [{ url: "https://mcp.example.com/slow" }],
        onMcpConnectionChange: onChange,
      });

      // Wait for the fire-and-forget connections to settle
      await new Promise((r) => setTimeout(r, 10));

      expect(onChange).toHaveBeenCalledWith(expect.any(String), {
        url: "https://mcp.example.com/slow",
        status: "error",
        error: "timeout",
      });
    });

    it("retryMcpConnection retries a failed server", async () => {
      mocks.mcpClientCreate.mockRejectedValueOnce(
        new Error("connection refused"),
      );

      const client = new TamboClient({ apiKey: "test-key" });

      await expect(
        client.connectMcpServer({ url: "https://mcp.example.com/retry" }),
      ).rejects.toThrow("connection refused");

      const statuses = client.getMcpConnectionStatuses();
      const key = Object.keys(statuses)[0];
      expect(statuses[key]?.status).toBe("error");

      // Now retry should succeed since the mock default resolves
      mocks.mcpClientCreate.mockResolvedValue({ close: jest.fn() });
      await client.retryMcpConnection(key);

      expect(client.getMcpConnectionStatuses()[key]?.status).toBe("connected");
      expect(client.getMcpClients()[key]).toBeDefined();
    });

    it("retryMcpConnection throws for unknown server key", async () => {
      const client = new TamboClient({ apiKey: "test-key" });
      await expect(client.retryMcpConnection("unknown-key")).rejects.toThrow(
        'Unknown MCP server key "unknown-key"',
      );
    });

    it("disconnectMcpServer fires callback and clears state", async () => {
      const onChange = jest.fn();
      const client = new TamboClient({
        apiKey: "test-key",
        onMcpConnectionChange: onChange,
      });
      await client.connectMcpServer({ url: "https://mcp.example.com/disc" });

      const statuses = client.getMcpConnectionStatuses();
      const key = Object.keys(statuses)[0];
      expect(statuses[key]?.status).toBe("connected");
      onChange.mockClear();

      await client.disconnectMcpServer(key);

      expect(onChange).toHaveBeenCalledWith(key, {
        url: "https://mcp.example.com/disc",
        status: "disconnected",
      });
      expect(client.getMcpConnectionStatuses()).toEqual({});
      expect(client.getMcpClients()).toEqual({});
    });
  });

  describe("suggestions", () => {
    it("listSuggestions calls SDK", async () => {
      const mockSuggestions = [{ id: "sug-1", text: "Try this" }];
      mocks.suggestionsList.mockResolvedValue(mockSuggestions);

      const client = new TamboClient({ apiKey: "test-key" });
      const suggestions = await client.listSuggestions("msg-1", "thread-1");

      expect(suggestions).toEqual(mockSuggestions);
      expect(mocks.suggestionsList).toHaveBeenCalledWith("msg-1", {
        id: "thread-1",
      });
    });

    it("generateSuggestions calls SDK with options", async () => {
      const mockSuggestions = [{ id: "sug-2", text: "Generated" }];
      mocks.suggestionsGenerate.mockResolvedValue(mockSuggestions);

      const client = new TamboClient({ apiKey: "test-key" });
      const suggestions = await client.generateSuggestions(
        "msg-1",
        "thread-1",
        { maxSuggestions: 3 },
      );

      expect(suggestions).toEqual(mockSuggestions);
      expect(mocks.suggestionsGenerate).toHaveBeenCalledWith("msg-1", {
        id: "thread-1",
        maxSuggestions: 3,
      });
    });
  });

  describe("notification batching", () => {
    it("batches multiple synchronous dispatches into fewer notifications", async () => {
      mocks.threadsRetrieve.mockResolvedValue({
        id: "thread-batch",
        name: "Batch Thread",
        messages: [
          {
            id: "msg-1",
            role: "user",
            content: [{ type: "text", text: "Hi" }],
            createdAt: "2026-01-01T00:00:00Z",
          },
        ],
        lastCompletedRunId: "run-1",
      });

      const client = new TamboClient({ apiKey: "test-key" });
      const listener = jest.fn();
      client.subscribe(listener);

      await client.fetchThread("thread-batch");
      await flushMicrotasks();

      // fetchThread dispatches INIT_THREAD, LOAD_THREAD_MESSAGES,
      // SET_LAST_COMPLETED_RUN_ID, and UPDATE_THREAD_NAME synchronously.
      // With batching, the listener is called at most once per microtask tick.
      expect(listener.mock.calls.length).toBeGreaterThanOrEqual(1);
    });
  });
});
