import { AsyncQueue } from "./async-queue";

describe("AsyncQueue", () => {
  describe("basic push and iteration", () => {
    it("should push and pull a single value", async () => {
      const queue = new AsyncQueue<number>();
      queue.push(1);
      queue.finish();

      const result = await queue.next();
      expect(result).toEqual({ value: 1, done: false });

      const endResult = await queue.next();
      expect(endResult).toEqual({ value: undefined, done: true });
    });

    it("should push and pull multiple values", async () => {
      const queue = new AsyncQueue<number>();
      queue.push(1);
      queue.push(2);
      queue.push(3);
      queue.finish();

      const result1 = await queue.next();
      expect(result1).toEqual({ value: 1, done: false });

      const result2 = await queue.next();
      expect(result2).toEqual({ value: 2, done: false });

      const result3 = await queue.next();
      expect(result3).toEqual({ value: 3, done: false });

      const endResult = await queue.next();
      expect(endResult).toEqual({ value: undefined, done: true });
    });

    it("should work with for await loop", async () => {
      const queue = new AsyncQueue<number>();
      queue.push(1);
      queue.push(2);
      queue.push(3);
      queue.finish();

      const values: number[] = [];
      for await (const value of queue) {
        values.push(value);
      }

      expect(values).toEqual([1, 2, 3]);
    });
  });

  describe("asynchronous consumption", () => {
    it("should handle consumer waiting for producer", async () => {
      const queue = new AsyncQueue<number>();

      // Start consuming before producing
      const nextPromise = queue.next();

      // Push value after consumer is waiting
      queue.push(42);

      const result = await nextPromise;
      expect(result).toEqual({ value: 42, done: false });
    });

    it("should handle multiple waiting consumers", async () => {
      const queue = new AsyncQueue<number>();

      // Multiple consumers waiting
      const promise1 = queue.next();
      const promise2 = queue.next();
      const promise3 = queue.next();

      // Produce values
      queue.push(1);
      queue.push(2);
      queue.push(3);

      const [result1, result2, result3] = await Promise.all([
        promise1,
        promise2,
        promise3,
      ]);

      expect(result1).toEqual({ value: 1, done: false });
      expect(result2).toEqual({ value: 2, done: false });
      expect(result3).toEqual({ value: 3, done: false });
    });

    it("should handle finish with waiting consumers", async () => {
      const queue = new AsyncQueue<number>();

      const promise1 = queue.next();
      const promise2 = queue.next();

      queue.finish();

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1).toEqual({ value: undefined, done: true });
      expect(result2).toEqual({ value: undefined, done: true });
    });
  });

  describe("finish behavior", () => {
    it("should signal completion with finish", async () => {
      const queue = new AsyncQueue<number>();
      queue.push(1);
      queue.finish();

      await queue.next();
      const result = await queue.next();

      expect(result).toEqual({ value: undefined, done: true });
    });

    it("should ignore pushes after finish", async () => {
      const queue = new AsyncQueue<number>();
      queue.push(1);
      queue.finish();
      queue.push(2); // Should be ignored

      const result1 = await queue.next();
      expect(result1).toEqual({ value: 1, done: false });

      const result2 = await queue.next();
      expect(result2).toEqual({ value: undefined, done: true });
    });

    it("should be idempotent - multiple finish calls should be safe", async () => {
      const queue = new AsyncQueue<number>();
      queue.push(1);
      queue.finish();
      queue.finish();
      queue.finish();

      const result1 = await queue.next();
      expect(result1).toEqual({ value: 1, done: false });

      const result2 = await queue.next();
      expect(result2).toEqual({ value: undefined, done: true });
    });
  });

  describe("error handling with fail", () => {
    it("should propagate error to consumer", async () => {
      const queue = new AsyncQueue<number>();

      queue.fail(new Error("Test error"));

      await expect(queue.next()).rejects.toThrow("Test error");
    });

    it("should throw error immediately even with queued items", async () => {
      const queue = new AsyncQueue<number>();

      queue.push(1);
      queue.push(2);
      queue.fail(new Error("Test error"));

      // Error is thrown immediately, queued items are not returned
      await expect(queue.next()).rejects.toThrow("Test error");
    });

    it("should normalize undefined error", async () => {
      const queue = new AsyncQueue<number>();
      queue.fail(undefined);

      await expect(queue.next()).rejects.toThrow("Unknown error");
    });

    it("should normalize null error", async () => {
      const queue = new AsyncQueue<number>();
      queue.fail(null);

      await expect(queue.next()).rejects.toThrow("Unknown error");
    });

    it("should propagate error to waiting consumers", async () => {
      const queue = new AsyncQueue<number>();
      const error = new Error("Async error");

      const promise1 = queue.next();
      const promise2 = queue.next();

      queue.fail(error);

      await expect(promise1).rejects.toThrow("Async error");
      await expect(promise2).rejects.toThrow("Async error");
    });

    it("should ignore pushes after fail", async () => {
      const queue = new AsyncQueue<number>();
      const error = new Error("Failed");

      queue.fail(error);
      queue.push(1); // Should be ignored

      await expect(queue.next()).rejects.toThrow("Failed");
    });

    it("should be idempotent - multiple fail calls should be safe", async () => {
      const queue = new AsyncQueue<number>();
      const error1 = new Error("First error");
      const error2 = new Error("Second error");

      queue.fail(error1);
      queue.fail(error2); // Should be ignored

      await expect(queue.next()).rejects.toThrow("First error");
    });

    it("should throw only once and not repeatedly", async () => {
      const queue = new AsyncQueue<number>();
      queue.fail(new Error("Test error"));

      await expect(queue.next()).rejects.toThrow("Test error");

      // Second call should return done, not throw
      const result = await queue.next();
      expect(result).toEqual({ value: undefined, done: true });
    });
  });

  describe("return method (early termination)", () => {
    it("should terminate the iterator early", async () => {
      const queue = new AsyncQueue<number>();
      queue.push(1);
      queue.push(2);
      queue.push(3);

      const result1 = await queue.next();
      expect(result1).toEqual({ value: 1, done: false });

      const returnResult = await queue.return();
      expect(returnResult).toEqual({ value: undefined, done: true });

      // Note: buffered items are still in the queue, so they will be returned
      const result2 = await queue.next();
      expect(result2).toEqual({ value: 2, done: false });

      const result3 = await queue.next();
      expect(result3).toEqual({ value: 3, done: false });

      // After all buffered items are consumed, it returns done
      const result4 = await queue.next();
      expect(result4).toEqual({ value: undefined, done: true });
    });

    it("should work with break in for await loop", async () => {
      const queue = new AsyncQueue<number>();

      // Push values asynchronously
      setTimeout(() => {
        queue.push(1);
        queue.push(2);
        queue.push(3);
        queue.finish();
      }, 0);

      const values: number[] = [];
      for await (const value of queue) {
        values.push(value);
        if (value === 2) break;
      }

      expect(values).toEqual([1, 2]);
    });
  });

  describe("throw method (consumer error)", () => {
    it("should throw an error into the iterator", async () => {
      const queue = new AsyncQueue<number>();
      queue.push(1);

      const result1 = await queue.next();
      expect(result1).toEqual({ value: 1, done: false });

      const throwResult = await queue.throw(new Error("Consumer error"));
      expect(throwResult).toEqual({ value: undefined, done: true });

      await expect(queue.next()).rejects.toThrow("Consumer error");
    });

    it("should use default error message when no error provided", async () => {
      const queue = new AsyncQueue<number>();

      const throwResult = await queue.throw();
      expect(throwResult).toEqual({ value: undefined, done: true });

      await expect(queue.next()).rejects.toThrow("Stream aborted");
    });
  });

  describe("Symbol.asyncIterator", () => {
    it("should return itself as async iterator", () => {
      const queue = new AsyncQueue<number>();
      expect(queue[Symbol.asyncIterator]()).toBe(queue);
    });
  });

  describe("complex scenarios", () => {
    it("should handle interleaved push and pull", async () => {
      const queue = new AsyncQueue<number>();

      queue.push(1);
      const result1 = await queue.next();
      expect(result1).toEqual({ value: 1, done: false });

      queue.push(2);
      queue.push(3);
      const result2 = await queue.next();
      expect(result2).toEqual({ value: 2, done: false });

      const result3 = await queue.next();
      expect(result3).toEqual({ value: 3, done: false });

      queue.finish();
      const result4 = await queue.next();
      expect(result4).toEqual({ value: undefined, done: true });
    });

    it("should handle rapid producer with slow consumer", async () => {
      const queue = new AsyncQueue<number>();

      // Fast producer
      for (let i = 0; i < 100; i++) {
        queue.push(i);
      }
      queue.finish();

      // Slow consumer
      const values: number[] = [];
      for await (const value of queue) {
        values.push(value);
      }

      expect(values).toHaveLength(100);
      expect(values[0]).toBe(0);
      expect(values[99]).toBe(99);
    });

    it("should handle slow producer with fast consumer", async () => {
      const queue = new AsyncQueue<number>();
      const values: number[] = [];

      // Start consuming immediately
      const consumePromise = (async () => {
        for await (const value of queue) {
          values.push(value);
        }
      })();

      // Slow producer
      for (let i = 0; i < 10; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1));
        queue.push(i);
      }
      queue.finish();

      await consumePromise;
      expect(values).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it("should handle concurrent push and next operations", async () => {
      const queue = new AsyncQueue<string>();

      const producer = async () => {
        for (let i = 0; i < 5; i++) {
          queue.push(`item-${i}`);
          await new Promise((resolve) => setTimeout(resolve, 5));
        }
        queue.finish();
      };

      const consumer = async () => {
        const results: string[] = [];
        for await (const value of queue) {
          results.push(value);
        }
        return results;
      };

      const [, results] = await Promise.all([producer(), consumer()]);
      expect(results).toEqual([
        "item-0",
        "item-1",
        "item-2",
        "item-3",
        "item-4",
      ]);
    });
  });

  describe("type safety", () => {
    it("should work with different types", async () => {
      interface TestObject {
        id: number;
        name: string;
      }

      const queue = new AsyncQueue<TestObject>();
      const obj1 = { id: 1, name: "test" };
      const obj2 = { id: 2, name: "test2" };

      queue.push(obj1);
      queue.push(obj2);
      queue.finish();

      const result1 = await queue.next();
      expect(result1.value).toEqual(obj1);

      const result2 = await queue.next();
      expect(result2.value).toEqual(obj2);
    });

    it("should work with string type", async () => {
      const queue = new AsyncQueue<string>();
      queue.push("hello");
      queue.push("world");
      queue.finish();

      const values: string[] = [];
      for await (const value of queue) {
        values.push(value);
      }

      expect(values).toEqual(["hello", "world"]);
    });
  });

  describe("ItemSink interface", () => {
    it("should conform to ItemSink interface", () => {
      const queue = new AsyncQueue<number>();

      // Verify interface methods exist
      expect(typeof queue.push).toBe("function");
      expect(typeof queue.finish).toBe("function");
      expect(typeof queue.fail).toBe("function");
    });

    it("should work when used as ItemSink type", async () => {
      const createSink = (): AsyncQueue<number> => {
        return new AsyncQueue<number>();
      };

      const sink = createSink();
      sink.push(1);
      sink.push(2);
      sink.finish();

      const values: number[] = [];
      for await (const value of sink) {
        values.push(value);
      }

      expect(values).toEqual([1, 2]);
    });
  });
});
