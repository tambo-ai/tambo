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
  type ReactNode,
  type Dispatch,
} from "react";
import {
  streamReducer,
  type StreamState,
  type StreamAction,
} from "../utils/event-accumulator";
import type { TamboV1Thread } from "../types/thread";

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

  /**
   * Project ID for the thread.
   * Required if threadId is provided without initialThread.
   */
  projectId?: string;
}

/**
 * Creates initial stream state from props.
 * @param props - Provider props
 * @returns Initial stream state
 */
function createInitialState(props: TamboV1StreamProviderProps): StreamState {
  const { initialThread, threadId, projectId } = props;

  // Use provided thread or create default
  const thread: TamboV1Thread = {
    id: threadId ?? initialThread?.id ?? "",
    projectId: projectId ?? initialThread?.projectId ?? "",
    title: initialThread?.title,
    messages: initialThread?.messages ?? [],
    status: initialThread?.status ?? "idle",
    metadata: initialThread?.metadata,
    createdAt: initialThread?.createdAt ?? new Date().toISOString(),
    updatedAt: initialThread?.updatedAt ?? new Date().toISOString(),
  };

  return {
    thread,
    streaming: { status: "idle" },
    accumulatingToolArgs: new Map(),
  };
}

/**
 * Provider component for stream state management.
 *
 * Uses useReducer with streamReducer to accumulate AG-UI events into
 * thread state. Provides state and dispatch via separate contexts.
 * @returns JSX element wrapping children with stream contexts
 * @example
 * ```tsx
 * <TamboV1StreamProvider threadId="thread_123" projectId="proj_456">
 *   <ChatInterface />
 * </TamboV1StreamProvider>
 * ```
 */
export function TamboV1StreamProvider(props: TamboV1StreamProviderProps) {
  const { children } = props;

  const initialState = useMemo(
    () => createInitialState(props),
    // Only recompute if these specific props change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.threadId, props.projectId],
  );

  const [state, dispatch] = useReducer(streamReducer, initialState);

  return (
    <StreamStateContext.Provider value={state}>
      <StreamDispatchContext.Provider value={dispatch}>
        {children}
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
