// Re-exported from @tambo-ai/client
export {
  streamReducer,
  createInitialState,
  createInitialStateWithMessages,
  createInitialThreadState,
  isPlaceholderThreadId,
  PLACEHOLDER_THREAD_ID,
  UnreachableCaseError,
} from "@tambo-ai/client";
export type {
  ThreadState,
  StreamState,
  StreamAction,
  EventAction,
  InitThreadAction,
  SetCurrentThreadAction,
  StartNewThreadAction,
  LoadThreadMessagesAction,
  SetLastCompletedRunIdAction,
  UpdateThreadNameAction,
} from "@tambo-ai/client";
