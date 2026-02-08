"use client";

/**
 * Stream Context Provider for v1 API
 *
 * Manages streaming state using React Context and useReducer.
 * Provides state and dispatch to child components via separate contexts
 * following the split-context pattern for optimal re-render performance.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { useTamboQuery } from "../../hooks/react-query-hooks";
import { useTamboClient } from "../../providers/tambo-client-provider";
import type { InitialInputMessage, TamboThreadMessage } from "../types/message";
import type { TamboThread } from "../types/thread";
import {
  createInitialState,
  createInitialStateWithMessages,
  createInitialThreadState,
  isPlaceholderThreadId,
  PLACEHOLDER_THREAD_ID,
  streamReducer,
  type StreamAction,
  type StreamState,
} from "../utils/event-accumulator";
import { useTamboConfig } from "./tambo-v1-provider";

/**
 * Thread management functions exposed by the stream context.
 */
export interface ThreadManagement {
  /**
   * Initialize a new thread in the stream context.
   * Use this before sending messages to a new thread.
   * @param threadId - The thread ID to initialize
   * @param initialThread - Optional initial thread data
   */
  initThread: (threadId: string, initialThread?: Partial<TamboThread>) => void;

  /**
   * Switch the current active thread.
   * Does not fetch thread data - use useTamboThread for that.
   * @param threadId - The thread ID to switch to
   */
  switchThread: (threadId: string) => void;

  /**
   * Start a new thread (generates a temporary ID).
   * The actual thread ID will be assigned when the first message is sent.
   * @returns The temporary thread ID
   */
  startNewThread: () => string;
}

/**
 * Context for accessing stream state (read-only).
 * Separated from dispatch context to prevent unnecessary re-renders.
 */
const StreamStateContext = createContext<StreamState | null>(null);

/**
 * Context for dispatching events to the stream reducer.
 * Separated from state context to prevent unnecessary re-renders.
 */
const StreamDispatchContext =
  createContext<React.Dispatch<StreamAction> | null>(null);

/**
 * Context for thread management functions.
 * Separated from state to prevent unnecessary re-renders.
 */
const ThreadManagementContext = createContext<ThreadManagement | null>(null);

/**
 * Props for TamboStreamProvider
 */
export interface TamboStreamProviderProps {
  children: React.ReactNode;

  /**
   * Initial messages to populate the placeholder thread with.
   * These render in the UI before any API call is made.
   */
  initialMessages?: InitialInputMessage[];

  /**
   * Optional override for stream state (primarily for tests).
   * If provided, you must also provide `dispatch`.
   */
  state?: StreamState;

  /**
   * Optional override for stream dispatch (primarily for tests).
   * If provided, you must also provide `state`.
   */
  dispatch?: React.Dispatch<StreamAction>;

  /**
   * Optional override for thread management functions (primarily for tests).
   */
  threadManagement?: ThreadManagement;
}

/**
 * Provider component for stream state management.
 *
 * Uses useReducer with streamReducer to accumulate AG-UI events into
 * thread state. Provides state, dispatch, and thread management via separate contexts.
 *
 * Thread management is done programmatically via the hooks:
 * - startNewThread() - Start a new conversation
 * - switchThread(threadId) - Switch to an existing thread
 * - initThread(threadId) - Initialize a thread for receiving events
 * @returns JSX element wrapping children with stream contexts
 * @example
 * ```tsx
 * <TamboStreamProvider>
 *   <ChatInterface />
 * </TamboStreamProvider>
 * ```
 */
export function TamboStreamProvider(props: TamboStreamProviderProps) {
  const {
    children,
    initialMessages,
    state: providedState,
    dispatch: providedDispatch,
  } = props;

  if (
    (providedState && !providedDispatch) ||
    (!providedState && providedDispatch)
  ) {
    throw new Error(
      "TamboStreamProvider requires both state and dispatch when overriding",
    );
  }

  if (props.threadManagement) {
    const { initThread, switchThread, startNewThread } = props.threadManagement;
    if (
      typeof initThread !== "function" ||
      typeof switchThread !== "function" ||
      typeof startNewThread !== "function"
    ) {
      throw new Error(
        "TamboStreamProvider: threadManagement override is missing required methods",
      );
    }
  }

  // Create stable initial state - only computed once on mount
  // Uses createInitialState which sets up placeholder thread for optimistic UI
  // If initialMessages are provided, the placeholder thread is seeded with them
  const [state, dispatch] = useReducer(
    streamReducer,
    initialMessages,
    (msgs) =>
      msgs?.length
        ? createInitialStateWithMessages(msgs)
        : createInitialState(),
  );

  const activeState = providedState ?? state;
  const activeDispatch = providedDispatch ?? dispatch;

  // Thread management functions
  const initThread = useCallback(
    (threadId: string, initialThread?: Partial<TamboThread>) => {
      activeDispatch({ type: "INIT_THREAD", threadId, initialThread });
    },
    [activeDispatch],
  );

  const switchThread = useCallback(
    (threadId: string) => {
      activeDispatch({ type: "SET_CURRENT_THREAD", threadId });
    },
    [activeDispatch],
  );

  const startNewThread = useCallback(() => {
    // Reset placeholder thread and switch to it
    // This prepares for a new conversation while preserving existing threads.
    // If initialMessages were provided, re-seed the placeholder with them.
    const baseThread = createInitialThreadState(PLACEHOLDER_THREAD_ID).thread;
    const threadWithMessages = initialMessages?.length
      ? {
          ...baseThread,
          messages: initialMessages.map(
            (msg): TamboThreadMessage => ({
              id: `initial_${crypto.randomUUID()}`,
              role: msg.role,
              content: msg.content.map((c) => {
                if (c.type === "text") {
                  return { type: "text" as const, text: c.text };
                }
                return c;
              }),
            }),
          ),
        }
      : baseThread;
    activeDispatch({
      type: "START_NEW_THREAD",
      threadId: PLACEHOLDER_THREAD_ID,
      initialThread: threadWithMessages,
    });
    return PLACEHOLDER_THREAD_ID;
  }, [activeDispatch, initialMessages]);

  const threadManagement = useMemo<ThreadManagement>(() => {
    return (
      props.threadManagement ?? {
        initThread,
        switchThread,
        startNewThread,
      }
    );
  }, [props.threadManagement, initThread, switchThread, startNewThread]);

  return (
    <StreamStateContext.Provider value={activeState}>
      <StreamDispatchContext.Provider value={activeDispatch}>
        <ThreadManagementContext.Provider value={threadManagement}>
          <ThreadSyncManager />
          {children}
        </ThreadManagementContext.Provider>
      </StreamDispatchContext.Provider>
    </StreamStateContext.Provider>
  );
}

/**
 * Internal component that handles automatic thread message syncing.
 * Fetches thread messages when switching to a non-placeholder thread.
 * Must be used within StreamStateContext, StreamDispatchContext, and TamboClientProvider.
 * @internal
 * @returns null - this component renders nothing
 */
function ThreadSyncManager(): null {
  const client = useTamboClient();
  const { userKey } = useTamboConfig();
  const state = useContext(StreamStateContext);
  const dispatch = useContext(StreamDispatchContext);

  // Track which threads have been synced to avoid redundant fetches
  const lastSyncedThreadRef = useRef<string | null>(null);
  const currentThreadId = state?.currentThreadId ?? PLACEHOLDER_THREAD_ID;
  const threadState = state?.threadMap[currentThreadId];

  // Determine if we need to fetch thread messages
  // Only fetch for non-placeholder threads that haven't been synced and have no messages
  const isNotPlaceholder = !isPlaceholderThreadId(currentThreadId);
  const isNotSynced = currentThreadId !== lastSyncedThreadRef.current;
  const hasNoMessages =
    !threadState || threadState.thread.messages.length === 0;
  const shouldFetch = isNotPlaceholder && isNotSynced && hasNoMessages;

  // Fetch messages and thread metadata in parallel
  const { data: messagesData, isSuccess: messagesSuccess } = useTamboQuery({
    queryKey: ["v1-thread-messages", currentThreadId],
    queryFn: async () => await client.threads.messages.list(currentThreadId),
    enabled: shouldFetch,
    staleTime: 1000,
    refetchOnWindowFocus: false,
  });

  useTamboQuery({
    queryKey: ["v1-thread-metadata", currentThreadId],
    queryFn: async () => {
      const data = await client.threads.retrieve(currentThreadId, { userKey });
      if (data.lastCompletedRunId && dispatch) {
        dispatch({
          type: "SET_LAST_COMPLETED_RUN_ID",
          threadId: currentThreadId,
          lastCompletedRunId: data.lastCompletedRunId,
        });
      }
      return data;
    },
    enabled: shouldFetch,
    staleTime: 1000,
    refetchOnWindowFocus: false,
  });

  // Sync fetched messages to stream state
  useEffect(() => {
    if (!messagesSuccess || !messagesData || !dispatch) return;
    if (lastSyncedThreadRef.current === currentThreadId) return;

    dispatch({
      type: "LOAD_THREAD_MESSAGES",
      threadId: currentThreadId,
      messages: messagesData.messages as TamboThreadMessage[],
      skipIfStreaming: true,
    });

    lastSyncedThreadRef.current = currentThreadId;
  }, [messagesSuccess, messagesData, currentThreadId, dispatch]);

  return null;
}

/**
 * Hook to access stream state.
 *
 * Must be used within TamboStreamProvider.
 * @returns Current stream state
 * @throws {Error} if used outside TamboStreamProvider
 * @example
 * ```tsx
 * function ChatMessages() {
 *   const { thread, streaming } = useStreamState();
 *
 *   return (
 *     <div>
 *       {thread.messages.map(msg => <Message key={msg.id} message={msg} />)}
 *       {streaming.status === 'streaming' && <LoadingIndicator />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useStreamState(): StreamState {
  const context = useContext(StreamStateContext);

  if (!context) {
    throw new Error("useStreamState must be used within TamboStreamProvider");
  }

  return context;
}

/**
 * Hook to access stream dispatch function.
 *
 * Must be used within TamboStreamProvider.
 * @returns Dispatch function for sending events to reducer
 * @throws {Error} if used outside TamboStreamProvider
 * @example
 * ```tsx
 * function StreamHandler() {
 *   const dispatch = useStreamDispatch();
 *
 *   useEffect(() => {
 *     async function handleStream() {
 *       for await (const event of streamEvents) {
 *         dispatch({ type: 'EVENT', event });
 *       }
 *     }
 *     handleStream();
 *   }, [dispatch]);
 *
 *   return null;
 * }
 * ```
 */
export function useStreamDispatch(): React.Dispatch<StreamAction> {
  const context = useContext(StreamDispatchContext);

  if (!context) {
    throw new Error(
      "useStreamDispatch must be used within TamboStreamProvider",
    );
  }

  return context;
}

/**
 * Hook to access thread management functions.
 *
 * Must be used within TamboStreamProvider.
 * @returns Thread management functions
 * @throws {Error} if used outside TamboStreamProvider
 * @example
 * ```tsx
 * function ThreadSwitcher() {
 *   const { switchThread, startNewThread } = useThreadManagement();
 *
 *   return (
 *     <div>
 *       <button onClick={() => switchThread('thread_123')}>
 *         Load Thread
 *       </button>
 *       <button onClick={startNewThread}>
 *         New Chat
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useThreadManagement(): ThreadManagement {
  const context = useContext(ThreadManagementContext);

  if (!context) {
    throw new Error(
      "useThreadManagement must be used within TamboStreamProvider",
    );
  }

  return context;
}
