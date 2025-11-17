import { AbstractAgent } from "@ag-ui/client";
import { AsyncQueue, ItemSink } from "@tambo-ai-cloud/core";

export type AgentSubscriber = AbstractAgent["subscribers"][number];
export type EventHandlerParams = Parameters<
  NonNullable<AgentSubscriber["onEvent"]>
>[0];

/**
 * Subscribe to events from an agent and push them to a sink, with proper error
 * handling.
 */
function subscribeToEvents(
  sink: ItemSink<EventHandlerParams>,
  agent: AbstractAgent,
) {
  const { unsubscribe } = agent.subscribe({
    onEvent(params) {
      sink.push(params);
    },
    onRunErrorEvent(params) {
      sink.push(params);
      // Propagate the error to consumers; pending/next pulls will reject
      sink.fail(params.event); // fail() also closes the iterator
    },
    onRunFinishedEvent(params) {
      sink.push(params);
      sink.finish();
    },
    onRunFailed({ error }) {
      sink.fail(error); // fail() also closes the iterator
    },
  });

  return unsubscribe;
}

type RunAgentResult = Awaited<ReturnType<AbstractAgent["runAgent"]>>;
/**
 * Runs an agent and returns an async iterator that emits events from the agent.
 */
export async function* runStreamingAgent(
  agent: AbstractAgent,
  queue: AsyncQueue<EventHandlerParams>,
  args?: Parameters<AbstractAgent["runAgent"]>,
  opts?: { signal?: AbortSignal },
): AsyncIterableIterator<EventHandlerParams, RunAgentResult> {
  const unsubscribe = subscribeToEvents(queue, agent);
  // Guard to ensure we only signal a terminal state once
  let terminated = false;
  const failOnce = (e: unknown) => {
    if (terminated) return;
    terminated = true;
    queue.fail(e instanceof Error ? e : new Error(String(e)));
  };

  const onAbort = () => {
    // Only signal failure; centralize unsubscribe in finally for idempotent cleanup
    failOnce(new Error("Aborted"));
  };

  const cleanup = () => {
    opts?.signal?.removeEventListener("abort", onAbort);
    try {
      unsubscribe();
    } catch {
      console.warn("Failed to unsubscribe");
    }
  };

  if (opts?.signal) {
    if (opts.signal.aborted) onAbort();
    else opts.signal.addEventListener("abort", onAbort, { once: true });
  }

  // Kick off the underlying process (non-blocking)
  // If this can throw synchronously, catch and fail the iterator so consumers get a terminal signal.
  let resultPromise: Promise<RunAgentResult>;
  try {
    resultPromise = agent.runAgent(...(args ?? []));
    // Prevent unhandled rejections if iteration ends early
    void resultPromise.catch(() => undefined);
  } catch (err) {
    // Ensure consumers are notified and resources are cleaned up on sync throw
    cleanup();
    failOnce(err);
    throw err;
  }

  // Before we return, we need to yield all the events from the agent
  // This is important because the agent may emit events after the runAgent call
  // has resolved, and we want to capture those events as well

  // Note that we are doing a manual iteration instead of `yield* iter` because
  // we need to capture any errors with stack traces to here, as they happen
  // inside this iterator
  try {
    for await (const event of queue) {
      yield event;
    }
  } finally {
    cleanup();
  }

  // the final result is not part of the iterator, so we need to await it,
  // and it actually contains the final result of running the agent
  const result = await resultPromise;
  return result;
}
