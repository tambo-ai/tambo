/**
 * Tests for the thread store.
 *
 * Note: Full integration tests would require mocking the TamboAI client
 * and advanceStream function. These tests cover the synchronous/local
 * functionality that doesn't require network calls.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { tick } from "svelte";
import {
  createThreadStore,
  type ThreadStore,
  type ThreadStoreOptions,
} from "./thread.svelte.js";
import { createRegistryStore, type RegistryStore } from "./registry.svelte.js";

// Mock TamboAI client
const createMockClient = () => ({
  beta: {
    threads: {
      retrieve: vi.fn(),
      list: vi.fn(),
      update: vi.fn(),
      generateName: vi.fn(),
      cancel: vi.fn(),
      messages: {
        updateComponentState: vi.fn(),
      },
    },
  },
});

describe("createThreadStore", () => {
  let store: ThreadStore;
  let registryStore: RegistryStore;
  let mockClient: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    mockClient = createMockClient();
    registryStore = createRegistryStore();

    const options: ThreadStoreOptions = {
      client: mockClient as unknown as ThreadStoreOptions["client"],
      contextKey: "test-context",
      streaming: true,
      autoGenerateThreadName: true,
      autoGenerateNameThreshold: 3,
    };

    store = createThreadStore(options, registryStore);
  });

  describe("initial state", () => {
    it("should have null thread", () => {
      expect(store.thread).toBeNull();
    });

    it("should have empty threads array", () => {
      expect(store.threads).toEqual([]);
    });

    it("should have idle generationStage", () => {
      expect(store.generationStage).toBe("idle");
    });

    it("should have empty statusMessage", () => {
      expect(store.statusMessage).toBe("");
    });

    it("should have null error", () => {
      expect(store.error).toBeNull();
    });

    it("should have isLoading as false", () => {
      expect(store.isLoading).toBe(false);
    });

    it("should have isIdle as true", () => {
      expect(store.isIdle).toBe(true);
    });

    it("should have empty messages", () => {
      expect(store.messages).toEqual([]);
    });

    it("should have undefined currentThreadId", () => {
      expect(store.currentThreadId).toBeUndefined();
    });
  });

  describe("startNewThread", () => {
    it("should create a new thread with placeholder id", async () => {
      const thread = store.startNewThread();
      await tick();

      expect(thread).toBeDefined();
      expect(thread.id).toContain("placeholder");
      expect(store.thread).toBe(thread);
    });

    it("should use provided contextKey", async () => {
      const thread = store.startNewThread("custom-context");
      await tick();

      expect(thread.contextKey).toBe("custom-context");
    });

    it("should use default contextKey when not provided", async () => {
      const thread = store.startNewThread();
      await tick();

      expect(thread.contextKey).toBe("test-context");
    });

    it("should reset state on new thread", async () => {
      // First create a thread with some state
      store.startNewThread();
      await tick();

      // Create another thread
      store.startNewThread();
      await tick();

      expect(store.generationStage).toBe("idle");
      expect(store.statusMessage).toBe("");
      expect(store.error).toBeNull();
      expect(store.thread?.messages).toEqual([]);
    });

    it("should have createdAt timestamp", async () => {
      const before = new Date().toISOString();
      const thread = store.startNewThread();
      const after = new Date().toISOString();
      await tick();

      expect(thread.createdAt).toBeDefined();
      expect(thread.createdAt >= before).toBe(true);
      expect(thread.createdAt <= after).toBe(true);
    });
  });

  describe("clearThread", () => {
    it("should clear the current thread", async () => {
      store.startNewThread();
      await tick();
      expect(store.thread).not.toBeNull();

      store.clearThread();
      await tick();

      expect(store.thread).toBeNull();
    });

    it("should reset generationStage to idle", async () => {
      store.startNewThread();
      await tick();

      store.clearThread();
      await tick();

      expect(store.generationStage).toBe("idle");
    });

    it("should clear statusMessage", async () => {
      store.startNewThread();
      await tick();

      store.clearThread();
      await tick();

      expect(store.statusMessage).toBe("");
    });

    it("should clear error", async () => {
      store.startNewThread();
      await tick();

      store.clearThread();
      await tick();

      expect(store.error).toBeNull();
    });
  });

  describe("updateThreadMessage", () => {
    it("should update a message in the thread", async () => {
      store.startNewThread();
      await tick();

      // Manually add a message to the thread for testing
      const thread = store.thread!;
      const messageId = "test-message-id";
      thread.messages = [
        {
          id: messageId,
          threadId: thread.id,
          role: "assistant" as const,
          content: "Original content",
          createdAt: new Date().toISOString(),
        },
      ];
      await tick();

      store.updateThreadMessage(messageId, { content: "Updated content" });
      await tick();

      expect(store.thread?.messages[0].content).toBe("Updated content");
    });

    it("should not call server when sendToServer is false", async () => {
      store.startNewThread();
      await tick();

      const messageId = "test-message-id";
      store.thread!.messages = [
        {
          id: messageId,
          threadId: store.thread!.id,
          role: "assistant" as const,
          content: "Content",
          createdAt: new Date().toISOString(),
        },
      ];

      store.updateThreadMessage(messageId, { content: "New" }, false);
      await tick();

      expect(
        mockClient.beta.threads.messages.updateComponentState,
      ).not.toHaveBeenCalled();
    });

    it("should do nothing if thread is null", async () => {
      // No thread created
      store.updateThreadMessage("some-id", { content: "test" });
      await tick();

      // Should not throw
      expect(store.thread).toBeNull();
    });

    it("should do nothing if message not found", async () => {
      store.startNewThread();
      await tick();

      store.thread!.messages = [
        {
          id: "existing-id",
          threadId: store.thread!.id,
          role: "assistant" as const,
          content: "Content",
          createdAt: new Date().toISOString(),
        },
      ];

      store.updateThreadMessage("nonexistent-id", { content: "test" });
      await tick();

      // Original message should be unchanged
      expect(store.thread!.messages[0].content).toBe("Content");
    });
  });

  describe("switchThread", () => {
    it("should call client.beta.threads.retrieve", async () => {
      const mockThread = {
        id: "thread-123",
        name: "Test Thread",
        createdAt: "2024-01-01T00:00:00.000Z",
        messages: [],
      };
      mockClient.beta.threads.retrieve.mockResolvedValue(mockThread);

      await store.switchThread("thread-123");

      expect(mockClient.beta.threads.retrieve).toHaveBeenCalledWith(
        "thread-123",
      );
    });

    it("should update thread state on success", async () => {
      const mockThread = {
        id: "thread-123",
        name: "Test Thread",
        createdAt: "2024-01-01T00:00:00.000Z",
        messages: [],
      };
      mockClient.beta.threads.retrieve.mockResolvedValue(mockThread);

      await store.switchThread("thread-123");
      await tick();

      expect(store.thread?.id).toBe("thread-123");
      expect(store.thread?.name).toBe("Test Thread");
    });

    it("should set error on failure", async () => {
      const testError = new Error("Failed to retrieve");
      mockClient.beta.threads.retrieve.mockRejectedValue(testError);

      await expect(store.switchThread("thread-123")).rejects.toThrow(
        "Failed to retrieve",
      );

      expect(store.error?.message).toBe("Failed to retrieve");
    });

    it("should set isLoading during fetch", async () => {
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockClient.beta.threads.retrieve.mockReturnValue(pendingPromise);

      const switchPromise = store.switchThread("thread-123");

      // Should be loading
      expect(store.isLoading).toBe(true);

      // Resolve the promise
      resolvePromise!({
        id: "thread-123",
        name: "Test",
        createdAt: new Date().toISOString(),
        messages: [],
      });

      await switchPromise;

      // Should no longer be loading
      expect(store.isLoading).toBe(false);
    });
  });

  describe("fetchThreads", () => {
    it("should call client.beta.threads.list with contextKey", async () => {
      const mockIterator = {
        [Symbol.asyncIterator]: () => ({
          next: async () => ({ done: true, value: undefined }),
        }),
      };
      mockClient.beta.threads.list.mockReturnValue(mockIterator);

      await store.fetchThreads("my-context");

      expect(mockClient.beta.threads.list).toHaveBeenCalledWith("", {
        contextKey: "my-context",
      });
    });

    it("should use default contextKey when not provided", async () => {
      const mockIterator = {
        [Symbol.asyncIterator]: () => ({
          next: async () => ({ done: true, value: undefined }),
        }),
      };
      mockClient.beta.threads.list.mockReturnValue(mockIterator);

      await store.fetchThreads();

      expect(mockClient.beta.threads.list).toHaveBeenCalledWith("", {
        contextKey: "test-context",
      });
    });

    it("should populate threads array", async () => {
      const mockThreads = [
        { id: "t1", name: "Thread 1", createdAt: "2024-01-01T00:00:00.000Z" },
        { id: "t2", name: "Thread 2", createdAt: "2024-01-02T00:00:00.000Z" },
      ];

      let index = 0;
      const mockIterator = {
        [Symbol.asyncIterator]: () => ({
          next: async () => {
            if (index < mockThreads.length) {
              return { done: false, value: mockThreads[index++] };
            }
            return { done: true, value: undefined };
          },
        }),
      };
      mockClient.beta.threads.list.mockReturnValue(mockIterator);

      const result = await store.fetchThreads();

      expect(result).toHaveLength(2);
      expect(store.threads).toHaveLength(2);
      expect(store.threads[0].id).toBe("t1");
      expect(store.threads[1].id).toBe("t2");
    });
  });

  describe("updateThreadName", () => {
    it("should call client.beta.threads.update", async () => {
      store.startNewThread();
      await tick();

      // Replace placeholder with real ID for this test
      store.thread!.id = "real-thread-id";
      mockClient.beta.threads.update.mockResolvedValue({});

      await store.updateThreadName("New Name", "real-thread-id");

      expect(mockClient.beta.threads.update).toHaveBeenCalledWith(
        "real-thread-id",
        { projectId: "", name: "New Name" },
      );
    });

    it("should update local thread name", async () => {
      store.startNewThread();
      await tick();
      store.thread!.id = "real-thread-id";
      mockClient.beta.threads.update.mockResolvedValue({});

      await store.updateThreadName("New Name", "real-thread-id");
      await tick();

      expect(store.thread?.name).toBe("New Name");
    });

    it("should throw if no thread ID provided and no current thread", async () => {
      await expect(store.updateThreadName("Name")).rejects.toThrow(
        "No thread ID provided",
      );
    });
  });

  describe("generateThreadName", () => {
    it("should call client.beta.threads.generateName", async () => {
      store.startNewThread();
      await tick();
      store.thread!.id = "real-thread-id";
      mockClient.beta.threads.generateName.mockResolvedValue({
        name: "Generated Name",
      });

      await store.generateThreadName("real-thread-id");

      expect(mockClient.beta.threads.generateName).toHaveBeenCalledWith(
        "real-thread-id",
      );
    });

    it("should update local thread name with generated name", async () => {
      store.startNewThread();
      await tick();
      store.thread!.id = "real-thread-id";
      mockClient.beta.threads.generateName.mockResolvedValue({
        name: "AI Generated Name",
      });

      await store.generateThreadName("real-thread-id");
      await tick();

      expect(store.thread?.name).toBe("AI Generated Name");
    });

    it("should warn and not throw for placeholder threads", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      store.startNewThread();
      await tick();

      // Should not throw, just warn
      await store.generateThreadName();

      expect(consoleSpy).toHaveBeenCalledWith(
        "Cannot generate name for placeholder thread",
      );
      consoleSpy.mockRestore();
    });
  });

  describe("cancel", () => {
    it("should set generationStage to idle", async () => {
      store.startNewThread();
      await tick();

      await store.cancel();
      await tick();

      expect(store.generationStage).toBe("idle");
    });

    it("should clear statusMessage", async () => {
      store.startNewThread();
      await tick();

      await store.cancel();
      await tick();

      expect(store.statusMessage).toBe("");
    });

    it("should call client.beta.threads.cancel for non-placeholder threads", async () => {
      store.startNewThread();
      await tick();
      store.thread!.id = "real-thread-id";
      mockClient.beta.threads.cancel.mockResolvedValue({});

      await store.cancel();

      expect(mockClient.beta.threads.cancel).toHaveBeenCalledWith(
        "real-thread-id",
      );
    });

    it("should not call client.beta.threads.cancel for placeholder threads", async () => {
      store.startNewThread();
      await tick();
      // Thread has placeholder ID by default

      await store.cancel();

      expect(mockClient.beta.threads.cancel).not.toHaveBeenCalled();
    });
  });

  describe("derived state", () => {
    it("should derive messages from thread", async () => {
      store.startNewThread();
      await tick();

      store.thread!.messages = [
        {
          id: "msg-1",
          threadId: store.thread!.id,
          role: "user" as const,
          content: "Hello",
          createdAt: new Date().toISOString(),
        },
      ];
      await tick();

      expect(store.messages).toHaveLength(1);
      expect(store.messages[0].content).toBe("Hello");
    });

    it("should derive currentThreadId from thread", async () => {
      expect(store.currentThreadId).toBeUndefined();

      store.startNewThread();
      await tick();

      expect(store.currentThreadId).toContain("placeholder");
    });

    it("should derive isIdle correctly", async () => {
      expect(store.isIdle).toBe(true);

      // isIdle should be true when generationStage is "idle" or "completed"
      // We can't easily test other stages without mocking sendMessage fully
    });
  });
});
