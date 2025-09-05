import { AbstractAgent } from "@ag-ui/client";

export type AgentSubscriber = AbstractAgent["subscribers"][number];
type EventHandlerParams = Parameters<
  NonNullable<AgentSubscriber["onEvent"]>
>[0];

/**
 * Generic queue-backed AsyncIterator you can push values into.
 * Call `finish()` to end the stream, or `fail(err)` to error it.
 */
function createPushAsyncIterator<T>() {
  type Resolver = (r: IteratorResult<T>) => void;

  const queue: T[] = [];
  const waiters: Resolver[] = [];
  let done = false;
  let failed: unknown | null = null;

  function push(v: T) {
    if (done || failed !== null) return;
    if (waiters.length) {
      const resolve = waiters.shift()!;
      resolve({ value: v, done: false });
    } else {
      queue.push(v);
    }
  }

  function finish() {
    if (done || failed !== null) return;
    done = true;
    while (waiters.length) {
      const waiter = waiters.shift()!;
      waiter({ value: undefined, done: true });
    }
  }

  function fail(err: unknown) {
    if (done || failed !== null) return;
    failed = err ?? new Error("Unknown error");
    while (waiters.length) {
      const resolve = waiters.shift()!;
      // Propagate error on next pull
      // We can't throw directly here, so we resolve and let `next()` throw.
      // We'll handle via a flag in `next()`.
      resolve({ value: undefined, done: true });
    }
  }

  async function next(): Promise<IteratorResult<T>> {
    if (failed !== null) {
      // Throw on pull to propagate the error to the consumer `for await`
      const err = failed;
      failed = null; // avoid throwing repeatedly
      throw err;
    }
    if (queue.length) {
      return { value: queue.shift()!, done: false };
    }
    if (done) return { value: undefined, done: true };

    const promise = new Promise<IteratorResult<T>>((resolve) =>
      waiters.push(resolve),
    );
    return await promise;
  }

  async function return_(): Promise<IteratorResult<T>> {
    finish();
    return await Promise.resolve({ value: undefined, done: true });
  }

  return {
    push,
    finish,
    fail,
    iterator: {
      next,
      return: return_,
      throw: async (e?: unknown) => {
        fail(e ?? new Error("Stream aborted"));
        return { value: undefined, done: true };
      },
      [Symbol.asyncIterator]() {
        return this;
      },
    } satisfies AsyncIterableIterator<T>,
  };
}

/**
 * Adapts your client's event callbacks into an AsyncIterableIterator<LLMResponse>.
 * - Pass an optional AbortSignal to stop streaming.
 * - The `subscribe` function must return an `unsubscribe()` cleanup.
 */
function eventsToAsyncIterator(
  subscribe: (agentSubcriber: AgentSubscriber) => { unsubscribe: () => void },
  opts?: { signal?: AbortSignal },
): AsyncIterableIterator<EventHandlerParams> {
  const { push, finish, fail, iterator } =
    createPushAsyncIterator<EventHandlerParams>();

  const { unsubscribe } = subscribe({
    onEvent(params) {
      push(params);
    },
    onRunErrorEvent(params) {
      push(params);
      // TODO: not quite sure what to pass here
      fail(params.event);
      finish(); // avoid throwing; let the consumer decide how to surface the error
    },
    onRunFinishedEvent(params) {
      push(params);
      finish();
    },
  });

  // Support external cancellation
  const onAbort = () => {
    try {
      unsubscribe();
    } catch {
      console.warn("Failed to unsubscribe");
    }
    fail(new Error("Aborted"));
  };
  if (opts?.signal) {
    if (opts.signal.aborted) onAbort();
    else opts.signal.addEventListener("abort", onAbort, { once: true });
  }

  // Ensure iterator.return() cleans up
  const origReturn = iterator.return.bind(iterator);
  iterator.return = async () => {
    try {
      unsubscribe();
    } catch {
      console.warn("Failed to unsubscribe");
    }
    if (opts?.signal) opts.signal.removeEventListener("abort", onAbort);
    return await origReturn();
  };

  return iterator;
}

type RunAgentResult = Awaited<ReturnType<AbstractAgent["runAgent"]>>;
/**
 * Runs an agent and returns an async iterator that emits events from the agent.
 */
export async function* runStreamingAgent(
  agent: AbstractAgent,
  args?: Parameters<AbstractAgent["runAgent"]>,
  opts?: { signal?: AbortSignal },
): AsyncIterableIterator<EventHandlerParams, RunAgentResult> {
  // Build the iterator first so early events are captured
  const iter = eventsToAsyncIterator(agent.subscribe.bind(agent), {
    signal: opts?.signal,
  });

  // Kick off the underlying process (non-blocking)
  // If this can throw synchronously, you might want to catch and fail the iterator.
  const resultPromise = agent.runAgent(...(args ?? []));

  // Before we return, we need to yield all the events from the agent
  // This is important because the agent may emit events after the runAgent call
  // has resolved, and we want to capture those events as well
  yield* iter;

  // the final result is not part of the iterator, so we need to await it,
  // and it actually contains the final result of running the agent
  const result = await resultPromise;
  return result;
}
