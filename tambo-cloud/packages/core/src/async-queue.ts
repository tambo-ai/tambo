/**
 * This interface is used to represent something to push values into, i.e. to be
 * used by producers.
 */
export interface ItemSink<T> {
  push(v: T): void;
  finish(): void;
  fail(err: unknown): void;
}

export type ItemQueue<T> = ItemSink<T> & AsyncIterableIterator<T>;

/**
 * Generic queue-backed AsyncIterator you can push values into.
 *
 * Consumers can simple treat this as an AsyncIterableIterator<T> using `for await`
 *
 * Producers can use the ItemSink interface to push values into the queue.
 *
 * Usage is something like:
 * ```
 * const queue = new AsyncQueue<T>();
 *
 * // Producers - write values to the queue
 * queue.push(value);
 * queue.finish();
 *
 * // Consumers - read values from the queue
 * for await (const value of queue) {
 *   console.log(value);
 * }
 * ```
 *
 * Producers should call `finish()` to end the stream, or `fail(err)` to error it.
 */
export class AsyncQueue<T> implements ItemQueue<T> {
  private queue: T[] = [];
  private waiters: Array<{
    resolve: (r: IteratorResult<T>) => void;
    reject: (reason?: unknown) => void;
  }> = [];
  private done = false;
  private failed: unknown | null = null;

  toString() {
    return `${this.constructor.name}(${this.queue.length} items, ${this.waiters.length} waiters, ${this.done ? "done" : "not done"}, ${this.failed ? "failed" : "not failed"})`;
  }

  /**
   * Push a value into the queue.
   * Called by: Producer (the code writing values to the queue)
   */
  push(v: T) {
    if (this.done || this.failed !== null) {
      if (this.done) {
        console.warn(`${this.constructor.name} already done, ignoring push`);
      } else {
        console.warn(`${this.constructor.name} already failed, ignoring push`);
      }
      return;
    }
    if (this.waiters.length) {
      const { resolve } = this.waiters.shift()!;
      resolve({ value: v, done: false });
    } else {
      this.queue.push(v);
    }
  }

  /**
   * Signal that no more values will be pushed (graceful completion). Called by:
   * Producer (when it's done sending values)
   *
   * @param quietly - if true, no warning will be logged if the queue is already
   *   done or failed. This is useful for calling finish() in a `finally` block,
   *   where we may have already marked the queue as done or failed.
   */
  finish(quietly = false) {
    if (this.done || this.failed !== null) {
      if (!quietly) {
        if (this.done) {
          console.warn(
            `${this.constructor.name} already done, ignoring finish`,
          );
        } else {
          console.warn(
            `${this.constructor.name} already failed, ignoring finish`,
          );
        }
      }
      return;
    }
    this.done = true;
    while (this.waiters.length) {
      const { resolve } = this.waiters.shift()!;
      resolve({ value: undefined, done: true });
    }
  }

  /**
   * Signal that an error occurred (error completion).
   * Called by: Producer (when it encounters an error)
   */
  fail(err: unknown) {
    if (this.done || this.failed !== null) {
      if (this.done) {
        console.warn(`${this.constructor.name} already done, ignoring fail`);
      } else {
        console.warn(`${this.constructor.name} already failed, ignoring fail`);
      }
      return;
    }
    // Normalize once so every consumer sees the same error instance
    const error = err ?? new Error("Unknown error");
    this.failed = error;
    this.done = true; // Mark as done so no more operations can occur
    while (this.waiters.length) {
      const { reject } = this.waiters.shift()!;
      // Reject the promise immediately to propagate the same normalized error
      reject(error);
    }
  }

  /**
   * Get the next value from the queue (AsyncIterator protocol method).
   * Called by: Consumer (the code reading from the queue, e.g., `for await`)
   */
  async next(): Promise<IteratorResult<T>> {
    if (this.failed !== null) {
      // Throw on pull to propagate the error to the consumer `for await`
      const err = this.failed;
      this.failed = null; // avoid throwing repeatedly
      throw err;
    }
    if (this.queue.length) {
      return { value: this.queue.shift()!, done: false };
    }
    if (this.done) return { value: undefined, done: true };

    const promise = new Promise<IteratorResult<T>>((resolve, reject) =>
      this.waiters.push({ resolve, reject }),
    );
    return await promise;
  }

  /**
   * Signal early termination from the consumer side (AsyncIterator protocol method).
   * Called by: Consumer (e.g., when breaking out of a `for await` loop early)
   */
  async return(): Promise<IteratorResult<T>> {
    this.finish();
    return await Promise.resolve({ value: undefined, done: true });
  }

  /**
   * Throw an error into the iterator (AsyncIterator protocol method).
   * Called by: Consumer (when the consumer wants to abort with an error)
   */
  async throw(e?: unknown): Promise<IteratorResult<T>> {
    this.fail(e ?? new Error("Stream aborted"));
    return { value: undefined, done: true };
  }

  [Symbol.asyncIterator]() {
    return this;
  }
}
