"use client";

/**
 * Stream Context Provider for v1 API
 *
 * Manages streaming state using React Context and useReducer.
 * Provides state and dispatch to child components via separate contexts
 * following the split-context pattern for optimal re-render performance.
 */

// React is used implicitly for JSX transformation (jsx: "react" in tsconfig)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, {
  createContext,
  useReducer,
  useContext,
  useMemo,
  useCallback,
  type ReactNode,
  type Dispatch,
} from "react";
import {
  streamReducer,
  createInitialThreadState,
  type StreamState,
  type StreamAction,
} from "../utils/event-accumulator";
import type { TamboV1Thread } from "../types/thread";

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
  initThread: (
    threadId: string,
    initialThread?: Partial<TamboV1Thread>,
  ) => void;

  /**
   * Switch the current active thread.
   * Does not fetch thread data - use useTamboV1Thread for that.
   * @param threadId - The thread ID to switch to, or null to clear
   */
  switchThread: (threadId: string | null) => void;

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
const StreamDispatchContext = createContext<Dispatch<StreamAction> | null>(
  null,
);

/**
 * Context for thread management functions.
 * Separated from state to prevent unnecessary re-renders.
 */
const ThreadManagementContext = createContext<ThreadManagement | null>(null);

/**
 * Props for TamboV1StreamProvider
 */
export interface TamboV1StreamProviderProps {
  children: ReactNode;

  /**
   * Initial thread state (optional).
   * If not provided, an empty thread will be created.
   */
  initialThread?: Partial<TamboV1Thread>;

  /**
   * Thread ID for the stream context.
   * Used to initialize the thread if initialThread is not provided.
   */
  threadId?: string;
}

/**
 * Creates initial stream state from props.
 * @param props - Provider props
 * @returns Initial stream state
 */
function createInitialState(props: TamboV1StreamProviderProps): StreamState {
  const { initialThread, threadId } = props;

  // Initialize with empty threadMap
  const threadMap: Record<
    string,
    ReturnType<typeof createInitialThreadState>
  > = {};

  // If threadId is provided, initialize that thread
  if (threadId) {
    // Create initial thread state (immutably)
    const baseState = createInitialThreadState(threadId);

    // If initial thread data provided, merge it immutably
    const threadState = initialThread
      ? {
          ...baseState,
          thread: {
            ...baseState.thread,
            ...initialThread,
            id: threadId, // Always use the provided threadId
          },
        }
      : baseState;

    threadMap[threadId] = threadState;
  }

  return {
    threadMap,
    currentThreadId: threadId ?? null,
  };
}

/**
 * Provider component for stream state management.
 *
 * Uses useReducer with streamReducer to accumulate AG-UI events into
 * thread state. Provides state, dispatch, and thread management via separate contexts.
 * @returns JSX element wrapping children with stream contexts
 * @example
 * ```tsx
 * <TamboV1StreamProvider threadId="thread_123">
 *   <ChatInterface />
 * </TamboV1StreamProvider>
 * ```
 */
export function TamboV1StreamProvider(props: TamboV1StreamProviderProps) {
  const { children } = props;

  const initialState = useMemo(
    () => createInitialState(props),
    // Only recompute if threadId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.threadId],
  );

  const [state, dispatch] = useReducer(streamReducer, initialState);

  // Thread management functions
  const initThread = useCallback(
    (threadId: string, initialThread?: Partial<TamboV1Thread>) => {
      dispatch({ type: "INIT_THREAD", threadId, initialThread });
    },
    [],
  );

  const switchThread = useCallback((threadId: string | null) => {
    dispatch({ type: "SET_CURRENT_THREAD", threadId });
  }, []);

  const startNewThread = useCallback(() => {
    const tempId = `temp_${crypto.randomUUID()}`;
    dispatch({ type: "INIT_THREAD", threadId: tempId });
    dispatch({ type: "SET_CURRENT_THREAD", threadId: tempId });
    return tempId;
  }, []);

  const threadManagement = useMemo<ThreadManagement>(
    () => ({
      initThread,
      switchThread,
      startNewThread,
    }),
    [initThread, switchThread, startNewThread],
  );

  return (
    <StreamStateContext.Provider value={state}>
      <StreamDispatchContext.Provider value={dispatch}>
        <ThreadManagementContext.Provider value={threadManagement}>
          {children}
        </ThreadManagementContext.Provider>
      </StreamDispatchContext.Provider>
    </StreamStateContext.Provider>
  );
}

/**
 * Hook to access stream state.
 *
 * Must be used within TamboV1StreamProvider.
 * @returns Current stream state
 * @throws {Error} if used outside TamboV1StreamProvider
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
    throw new Error("useStreamState must be used within TamboV1StreamProvider");
  }

  return context;
}

/**
 * Hook to access stream dispatch function.
 *
 * Must be used within TamboV1StreamProvider.
 * @returns Dispatch function for sending events to reducer
 * @throws {Error} if used outside TamboV1StreamProvider
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
export function useStreamDispatch(): Dispatch<StreamAction> {
  const context = useContext(StreamDispatchContext);

  if (!context) {
    throw new Error(
      "useStreamDispatch must be used within TamboV1StreamProvider",
    );
  }

  return context;
}

/**
 * Hook to access thread management functions.
 *
 * Must be used within TamboV1StreamProvider.
 * @returns Thread management functions
 * @throws {Error} if used outside TamboV1StreamProvider
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
      "useThreadManagement must be used within TamboV1StreamProvider",
    );
  }

  return context;
}
