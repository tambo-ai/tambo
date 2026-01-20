"use client";
import TamboAI, { advanceStream } from "@tambo-ai/typescript-sdk";
import { Thread } from "@tambo-ai/typescript-sdk/resources/beta/threads/threads";
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { TamboTool } from "../model/component-metadata";
import {
  GenerationStage,
  isIdleStage,
  TamboThreadMessage,
} from "../model/generate-component-response";
import { TamboThread } from "../model/tambo-thread";
import { toText } from "../util/content-parts";
import { renderComponentIntoMessage } from "../util/generate-component";
import {
  getAvailableComponents,
  getUnassociatedTools,
  mapTamboToolToContextTool,
} from "../util/registry";
import { handleToolCall } from "../util/tool-caller";
import { useTamboClient, useTamboQueryClient } from "./tambo-client-provider";
import { useTamboContextHelpers } from "./tambo-context-helpers-provider";
import { useTamboRegistry } from "./tambo-registry-provider";

// Generation Stage Context - separate from thread context to prevent re-renders
export interface TamboGenerationStageContextProps {
  generationStage: GenerationStage;
  generationStatusMessage: string;
  isIdle: boolean;
}

const TamboGenerationStageContext = createContext<
  TamboGenerationStageContextProps | undefined
>(undefined);

interface TamboGenerationStageProviderProps {
  generationStage: GenerationStage;
  statusMessage: string;
}

/**
 *
 * This provider is used to provide the generation stage context to the descendants of the provider.
 * @param props - The props for the GenerationStageProvider
 * @param props.children - The children to wrap
 * @param props.generationStage - The generation stage to provide
 * @param props.statusMessage - The status message to provide
 * @returns The GenerationStageProvider component
 */
export const TamboGenerationStageProvider: React.FC<
  PropsWithChildren<TamboGenerationStageProviderProps>
> = ({ children, generationStage, statusMessage }) => {
  const isIdle = isIdleStage(generationStage);

  const contextValue = useMemo(() => {
    return {
      generationStage,
      generationStatusMessage: statusMessage,
      isIdle,
    };
  }, [generationStage, statusMessage, isIdle]);

  return (
    <TamboGenerationStageContext.Provider value={contextValue}>
      {children}
    </TamboGenerationStageContext.Provider>
  );
};

// Type for partial message updates that requires threadId
type PartialTamboThreadMessageWithThreadId = Partial<TamboThreadMessage> & {
  threadId: string;
};

export interface TamboThreadContextProps {
  /** The current thread */
  thread: TamboThread;
  /** The current thread ID */
  currentThreadId: string | null;
  /** The current thread (alias for thread, may be null) */
  currentThread: TamboThread | null;
  /** Map of all threads by ID */
  threadMap: Record<string, TamboThread>;
  /** Update the thread map (internal use only) */
  setThreadMap: React.Dispatch<
    React.SetStateAction<Record<string, TamboThread>>
  >;
  /** Switch to a different thread */
  switchCurrentThread: (threadId: string, fetch?: boolean) => void;
  /** Start a new thread */
  startNewThread: () => void;
  /** Update a thread's name */
  updateThreadName: (name: string, threadId?: string) => void;
  /** Let Tambo generate and set a thread's name based on the thread's messages */
  generateThreadName: (threadId?: string) => Promise<Thread>;
  /** Add a message to the current thread */
  addThreadMessage: (
    message: TamboThreadMessage,
    sendToServer: boolean,
  ) => Promise<TamboAI.Beta.Threads.ThreadMessage[]>;
  /** Update a message in the current thread */
  updateThreadMessage: (
    id: string,
    message: PartialTamboThreadMessageWithThreadId,
    sendToServer: boolean,
  ) => Promise<void>;
  /** Cancel a thread */
  cancel: (threadId?: string) => Promise<void>;
  /** Whether the thread is streaming */
  streaming: boolean;
  /** Send a message to the current thread */
  sendThreadMessage: (
    message: string,
    options?: {
      threadId?: string;
      streamResponse?: boolean;
      contextKey?: string;
      forceToolChoice?: string;
      additionalContext?: Record<string, any>;
      content?: TamboAI.Beta.Threads.ChatCompletionContentPart[];
    },
  ) => Promise<TamboThreadMessage>;
  /** The context key to use for the thread */
  contextKey?: string;
}

// Combined context interface that includes generation stage fields
export interface CombinedTamboThreadContextProps
  extends TamboThreadContextProps, TamboGenerationStageContextProps {}

/**
 * This is a stub entry for when the thread is not yet created, the first time
 * the user sends a message
 *
 * Note that the consumer needs to be careful never to send `PLACEHOLDER_THREAD.id` to the server,
 * as this doesn't really exist on the server side.
 */
export const PLACEHOLDER_THREAD: TamboThread = {
  id: "placeholder",
  messages: [],
  createdAt: "",
  projectId: "",
  updatedAt: "",
  metadata: {},
};

export const TamboThreadContext = createContext<TamboThreadContextProps>({
  thread: PLACEHOLDER_THREAD,
  currentThreadId: PLACEHOLDER_THREAD.id,
  currentThread: PLACEHOLDER_THREAD,
  threadMap: { [PLACEHOLDER_THREAD.id]: PLACEHOLDER_THREAD },
  setThreadMap: () => {
    throw new Error("setThreadMap not implemented");
  },
  /**
   *
   */
  switchCurrentThread: () => {
    throw new Error("switchCurrentThread not implemented");
  },
  /**
   *
   */
  startNewThread: () => {
    throw new Error("startNewThread not implemented");
  },
  /**
   *
   */
  updateThreadName: () => {
    throw new Error("updateThreadName not implemented");
  },
  /**
   *
   */
  generateThreadName: () => {
    throw new Error("generateThreadName not implemented");
  },
  /**
   *
   */
  addThreadMessage: () => {
    throw new Error("updateThreadMessageHistory not implemented");
  },
  streaming: true,
  /**
   *
   */
  updateThreadMessage: () => {
    throw new Error("updateThreadMessage not implemented");
  },
  /**
   *
   */
  sendThreadMessage: () => {
    throw new Error("sendThreadMessage not implemented");
  },
  /**
   *
   */
  cancel: () => {
    throw new Error("cancel not implemented");
  },
});

export type InitialTamboThreadMessage = Pick<
  TamboThreadMessage,
  "role" | "content"
> & {
  /** Optional ID - will be auto-generated if not provided */
  id?: string;
  /** Optional creation timestamp - will be auto-generated if not provided */
  createdAt?: string;
  /** Optional additional context to include with the message */
  additionalContext?: Record<string, any>;
  /** Optional component state - will default to empty object if not provided */
  componentState?: Record<string, any>;
};

export interface TamboThreadProviderProps {
  /** Whether to stream the response */
  streaming?: boolean;
  /** Initial messages to be included in new threads */
  initialMessages?: InitialTamboThreadMessage[];
  /** Whether to automatically generate thread names. Defaults to true. */
  autoGenerateThreadName?: boolean;
  /** The message count threshold at which the thread name will be auto-generated. Defaults to 3. */
  autoGenerateNameThreshold?: number;
  /** The context key to use for the thread */
  contextKey?: string;
}

/**
 * The TamboThreadProvider is a React provider that provides a thread context
 * to the descendants of the provider.
 * @param props - The props for the TamboThreadProvider
 * @param props.children - The children to wrap
 * @param props.streaming - Whether to stream the response by default. Defaults to true.
 * @param props.initialMessages - Initial messages to be included in new threads
 * @param props.autoGenerateThreadName - Whether to automatically generate thread names. Defaults to true.
 * @param props.autoGenerateNameThreshold - The message count threshold at which the thread name will be auto-generated. Defaults to 3.
 * @param props.contextKey - The context key to use for thread isolation
 * @returns The TamboThreadProvider component
 */
export const TamboThreadProvider: React.FC<
  PropsWithChildren<TamboThreadProviderProps>
> = ({
  children,
  streaming = true,
  initialMessages = [],
  autoGenerateThreadName = true,
  autoGenerateNameThreshold = 3,
  contextKey,
}) => {
  // Create placeholder thread with initial messages
  const placeholderThread: TamboThread = useMemo(
    () => ({
      id: "placeholder",
      messages: initialMessages.map((msg) => ({
        ...msg,
        id: msg.id ?? crypto.randomUUID(),
        threadId: "placeholder",
        createdAt: msg.createdAt ?? new Date().toISOString(),
        componentState: msg.componentState ?? {},
      })),
      createdAt: "",
      projectId: "",
      updatedAt: "",
      metadata: {},
      contextKey,
    }),
    [contextKey, initialMessages],
  );

  const [threadMap, setThreadMap] = useState<Record<string, TamboThread>>({
    [placeholderThread.id]: placeholderThread,
  });
  const client = useTamboClient();
  const queryClient = useTamboQueryClient();
  const {
    componentList,
    toolRegistry,
    componentToolAssociations,
    onCallUnregisteredTool,
  } = useTamboRegistry();
  const { getAdditionalContext } = useTamboContextHelpers();
  const [ignoreResponse, setIgnoreResponse] = useState(false);
  const ignoreResponseRef = useRef(ignoreResponse);
  const [currentThreadId, setCurrentThreadId] = useState<string>(
    placeholderThread.id,
  );
  const currentThread: TamboThread | undefined = threadMap[currentThreadId];

  // Generation stage props for GenerationStageProvider
  const currentGenerationStage =
    (currentThread?.generationStage as GenerationStage) ?? GenerationStage.IDLE;
  const currentStatusMessage = currentThread?.statusMessage ?? "";

  // Use existing messages from the current thread to avoid re-generating any components
  const currentMessageCache = useMemo(() => {
    const messageCache = new Map<string, TamboThreadMessage>();
    if (currentThread) {
      for (const message of currentThread.messages) {
        messageCache.set(message.id, message);
      }
    }
    return messageCache;
  }, [currentThread]);

  useEffect(() => {
    ignoreResponseRef.current = ignoreResponse;
  }, [ignoreResponse]);

  const updateThreadsCache = useCallback(
    async (
      updateFn: (
        old: TamboAI.Beta.Threads.ThreadsOffsetAndLimit | undefined,
      ) => TamboAI.Beta.Threads.ThreadsOffsetAndLimit | undefined,
      contextKey?: string,
    ) => {
      try {
        const currentProject = await client.beta.projects.getCurrent();

        queryClient.setQueryData(
          ["threads", currentProject.id, contextKey],
          updateFn,
        );

        await queryClient.invalidateQueries({
          queryKey: ["threads"],
        });
      } catch (error) {
        console.warn("Failed to update threads cache:", error);
      }
    },
    [client.beta.projects, queryClient],
  );

  const addThreadToCache = useCallback(
    async (threadId: string, contextKey: string | undefined) => {
      const optimisticThread = {
        ...PLACEHOLDER_THREAD,
        id: threadId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await updateThreadsCache((old) => {
        if (!old) return old;
        return {
          ...old,
          items: [optimisticThread, ...(old.items ?? [])],
          total: (old.total ?? 0) + 1,
          count: (old.count ?? 0) + 1,
        } as TamboAI.Beta.Threads.ThreadsOffsetAndLimit;
      }, contextKey);
    },
    [updateThreadsCache],
  );

  const updateThreadInCache = useCallback(
    async (
      threadId: string,
      updateFn: (
        thread: TamboAI.Beta.Threads.Thread,
      ) => TamboAI.Beta.Threads.Thread,
      contextKey?: string,
    ) => {
      await updateThreadsCache((old) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: old.items.map((thread) =>
            thread.id === threadId ? updateFn(thread) : thread,
          ),
          total: old.total,
          count: old.count,
        } as TamboAI.Beta.Threads.ThreadsOffsetAndLimit;
      }, contextKey);
    },
    [updateThreadsCache],
  );

  const fetchThread = useCallback(
    async (threadId: string) => {
      const thread = await client.beta.threads.retrieve(threadId);
      const threadWithRenderedComponents = {
        ...thread,
        messages: thread.messages.map((message) => {
          if (currentMessageCache.has(message.id)) {
            const renderedMessage = currentMessageCache.get(message.id);
            return {
              ...renderedMessage,
              ...message,
            };
          }
          if (message.component?.componentName) {
            const messageWithComponent = renderComponentIntoMessage(
              message,
              componentList,
            );
            return messageWithComponent;
          }
          return message;
        }),
      };

      setThreadMap((prevMap) => {
        const updatedThreadMap = {
          ...prevMap,
          [threadId]: threadWithRenderedComponents,
        };
        return updatedThreadMap;
      });
    },
    [client.beta.threads, componentList, currentMessageCache],
  );

  useEffect(() => {
    async function loadThread() {
      try {
        await fetchThread(currentThreadId);
      } catch (error) {
        console.error("Failed to fetch thread:", error);
      }
    }

    if (
      currentThreadId &&
      currentThreadId !== placeholderThread.id &&
      !threadMap[currentThreadId]
    ) {
      loadThread().catch((err) => {
        console.error("Unexpected error in loadThread:", err);
      });
    }
  }, [currentThreadId, fetchThread, threadMap, placeholderThread.id]);

  const addThreadMessage = useCallback(
    async (
      message: TamboThreadMessage,
      sendToServer = true,
      createdAt: string = new Date().toISOString(),
    ) => {
      if (!currentThread) {
        console.warn("Cannot add messages if we do not have a current thread");
        return [];
      }

      const chatMessage: TamboThreadMessage = {
        ...message,
        createdAt,
      };
      const threadId = message.threadId;
      const messageId = chatMessage.id;
      // optimistically update the thread in the local state
      setThreadMap((prevMap) => {
        if (!threadId) {
          return prevMap;
        }
        const prevMessages = prevMap[threadId]?.messages || [];
        const haveMessage = prevMessages.find((msg) => msg.id === messageId);
        // Update in place if the message already exists
        const updatedMessages = haveMessage
          ? prevMessages.map((msg) => {
              if (msg.id === messageId) {
                return chatMessage;
              }
              return msg;
            })
          : [...prevMessages, chatMessage];

        const updatedThreadMap = {
          ...prevMap,
          [threadId]: {
            ...prevMap[threadId],
            messages: updatedMessages,
          },
        };
        return updatedThreadMap;
      });

      if (sendToServer) {
        try {
          await client.beta.threads.messages.create(message.threadId, {
            content: message.content,
            role: message.role,
            additionalContext: chatMessage.additionalContext,
          });
        } catch (error) {
          console.error("Failed to add message to server", error);

          // Revert optimistic local state update
          setThreadMap((prev) => {
            const prevMessages = prev[threadId]?.messages || [];

            // addThreadMessage -> for new messages or simple updates
            // On Fail -> remove the added/updated message (no prev state)
            const updatedMessages = prevMessages.filter(
              (msg) => msg.id !== messageId,
            );
            return {
              ...prev,
              [threadId]: {
                ...prev[threadId],
                messages: updatedMessages,
              },
            };
          });
          throw error;
        }
      }
      return threadMap[threadId]?.messages || [];
    },
    [client.beta.threads.messages, currentThread, threadMap],
  );

  const updateThreadMessage = useCallback(
    async (
      id: string,
      message: PartialTamboThreadMessageWithThreadId,
      sendToServer = true,
      createdAt: string = new Date().toISOString(),
    ) => {
      setThreadMap((prevMap) => {
        const prevMessages = prevMap[message.threadId]?.messages || [];
        const updatedMessages = prevMessages.map((msg) => {
          if (msg.id === id) {
            // Merge the partial update with the existing message
            const updatedMessage: TamboThreadMessage = {
              ...msg,
              ...message,
              id: msg.id,
              createdAt: message.createdAt ?? msg.createdAt ?? createdAt,
            };
            return updatedMessage;
          }
          return msg;
        });
        return {
          ...prevMap,
          [message.threadId]: {
            ...prevMap[message.threadId],
            messages: updatedMessages,
          },
        };
      });

      if (sendToServer && message.content && message.role) {
        try {
          await client.beta.threads.messages.create(message.threadId, {
            content: message.content,
            role: message.role,
            additionalContext: message.additionalContext,
          });
        } catch (error) {
          console.error("Failed to update message on server", error);

          // Revert local state update by removing the optimistic message
          setThreadMap((prev) => {
            const updatedMessages = prev[message.threadId]?.messages?.filter(
              (msg) => msg.id !== id,
            );
            return {
              ...prev,
              [message.threadId]: {
                ...prev[message.threadId],
                messages: updatedMessages,
              },
            };
          });
          throw error;
        }
      }
    },
    [client.beta.threads.messages],
  );

  const generateThreadName = useCallback(
    async (threadId?: string, contextKey?: string) => {
      threadId ??= currentThreadId;
      if (threadId === placeholderThread.id) {
        console.warn("Cannot generate name for empty thread");
        return threadMap[threadId];
      }

      const threadWithGeneratedName =
        await client.beta.threads.generateName(threadId);

      // Update local thread state
      setThreadMap((prevMap) => {
        if (!prevMap[threadId]) {
          return prevMap;
        }
        return {
          ...prevMap,
          [threadId]: {
            ...prevMap[threadId],
            name: threadWithGeneratedName.name,
          },
        };
      });

      // Update threads cache to reflect the new name in the UI
      await updateThreadInCache(
        threadId,
        (thread) => ({
          ...thread,
          name: threadWithGeneratedName.name,
        }),
        contextKey,
      );

      return threadWithGeneratedName;
    },
    [
      client.beta.threads,
      currentThreadId,
      threadMap,
      placeholderThread.id,
      updateThreadInCache,
    ],
  );

  const maybeAutoGenerateThreadName = useCallback(
    (threadId: string, contextKey?: string) => {
      // Use setThreadMap to access the latest state
      setThreadMap((map) => {
        const thread = map[threadId];

        if (!thread || !autoGenerateThreadName) {
          return map;
        }

        if (
          autoGenerateNameThreshold == null ||
          thread.id === placeholderThread.id
        ) {
          return map;
        }

        const messageCount = thread.messages.length;

        // Only auto-generate if thread has no name and threshold is met
        if (!thread.name && messageCount >= autoGenerateNameThreshold) {
          // Generating a thread name is not critical, so we can fire-and-forget
          void generateThreadName(threadId, contextKey).catch((error) => {
            console.error("Failed to generate thread name:", error);
          });
        }

        return map;
      });
    },
    [
      autoGenerateThreadName,
      autoGenerateNameThreshold,
      placeholderThread.id,
      generateThreadName,
    ],
  );

  const startNewThread = useCallback(() => {
    setCurrentThreadId(placeholderThread.id);
    setThreadMap((prevMap) => {
      return {
        ...prevMap,
        [placeholderThread.id]: placeholderThread,
      };
    });
  }, [placeholderThread]);

  const updateThreadName = useCallback(
    async (name: string, threadId?: string) => {
      threadId ??= currentThreadId;
      const previousName = threadMap[threadId]?.name;

      setThreadMap((prevMap) => {
        if (!prevMap[threadId]) {
          return prevMap;
        }
        return { ...prevMap, [threadId]: { ...prevMap[threadId], name } };
      });

      if (threadId !== placeholderThread.id) {
        try {
          const currentProject = await client.beta.projects.getCurrent();
          await client.beta.threads.update(threadId, {
            name,
            projectId: currentProject.id,
          });
        } catch (error) {
          console.error("Failed to update thread name on server", error);
          // Revert local state update
          setThreadMap((prevMap) => {
            if (!prevMap[threadId]) {
              return prevMap;
            }
            return {
              ...prevMap,
              [threadId]: { ...prevMap[threadId], name: previousName },
            };
          });
          throw error;
        }
      }
    },
    [
      currentThreadId,
      client.beta.projects,
      client.beta.threads,
      placeholderThread.id,
      threadMap,
    ],
  );

  const switchCurrentThread = useCallback(
    async (threadId: string, fetch = true) => {
      if (threadId === placeholderThread.id) {
        console.warn("Switching to placeholder thread, may be a bug.");
        return;
      }

      setCurrentThreadId(threadId);
      setThreadMap((prevMap) => {
        if (prevMap[threadId]) {
          return prevMap;
        }
        // If this is a new thread, add placeholder thread messages to the thread
        const updatedThreadMap = {
          ...prevMap,
          [threadId]: {
            ...prevMap[placeholderThread.id],
            id: threadId,
          },
        };
        return updatedThreadMap;
      });

      if (fetch) {
        await fetchThread(threadId);
      }
    },
    [fetchThread, placeholderThread],
  );

  const updateThreadStatus = useCallback(
    (threadId: string, stage: GenerationStage, statusMessage?: string) => {
      setThreadMap((prevMap) => {
        const updatedThreadMap = {
          ...prevMap,
          [threadId]: {
            ...prevMap[threadId],
            generationStage: stage,
            statusMessage: statusMessage,
          },
        };
        return updatedThreadMap;
      });
    },
    [],
  );

  const cancel = useCallback(
    async (threadId?: string) => {
      threadId ??= currentThreadId;
      const currentGenerationStage =
        currentThread?.generationStage ?? GenerationStage.IDLE;
      if (isIdleStage(currentGenerationStage as GenerationStage)) {
        return;
      }
      setIgnoreResponse(true);
      setThreadMap((prevMap) => {
        if (!prevMap[threadId]) {
          return prevMap;
        }

        return {
          ...prevMap,
          [threadId]: {
            ...prevMap[threadId],
            generationStage: GenerationStage.CANCELLED,
            messages: prevMap[threadId].messages.map((message) => {
              if (
                message.id ===
                prevMap[threadId].messages[
                  prevMap[threadId].messages.length - 1
                ].id
              ) {
                return {
                  ...message,
                  isCancelled: true,
                };
              }
              return message;
            }),
          },
        };
      });

      await client.beta.threads.cancel(threadId);
    },
    [client.beta.threads, currentThreadId, currentThread?.generationStage],
  );

  const handleAdvanceStream = useCallback(
    async (
      stream: AsyncIterable<TamboAI.Beta.Threads.ThreadAdvanceResponse>,
      params: TamboAI.Beta.Threads.ThreadAdvanceByIDParams,
      threadId: string,
      contextKey?: string,
    ): Promise<TamboThreadMessage> => {
      if (ignoreResponseRef.current) {
        setIgnoreResponse(false);
        return createEmptyMessage(threadId);
      }
      let finalMessage: Readonly<TamboThreadMessage> | undefined;
      let hasSetThreadId = false;
      updateThreadStatus(threadId, GenerationStage.STREAMING_RESPONSE);

      for await (const chunk of stream) {
        // Store MCP access token in thread data
        if (chunk.mcpAccessToken) {
          // note that we're only setting it positively during streaming, because it might
          // not have been set yet in the chunk (i.e. we're not unsetting it in the chunk)
          setThreadMap((prev) => {
            const thread = prev[threadId];
            if (thread) {
              return {
                ...prev,
                [threadId]: {
                  ...thread,
                  mcpAccessToken: chunk.mcpAccessToken,
                },
              };
            }
            return prev;
          });
        }

        if (chunk.responseMessageDto.toolCallRequest) {
          const toolName = chunk.responseMessageDto.toolCallRequest.toolName;
          updateThreadStatus(
            chunk.responseMessageDto.threadId,
            GenerationStage.FETCHING_CONTEXT,
          );

          await updateThreadMessage(
            chunk.responseMessageDto.id,
            {
              ...chunk.responseMessageDto,
            },
            false,
          );

          const toolCallResponse = await handleToolCall(
            chunk.responseMessageDto.toolCallRequest,
            toolRegistry,
            onCallUnregisteredTool,
          );
          if (ignoreResponseRef.current) {
            setIgnoreResponse(false);
            return createEmptyMessage(threadId);
          }

          const contentParts = await convertToolResponse(toolCallResponse);

          const toolCallResponseParams: TamboAI.Beta.Threads.ThreadAdvanceByIDParams =
            {
              ...params,
              // Exclude initialMessages from tool response since thread already exists
              initialMessages: undefined,
              ...(toolName
                ? {
                    toolCallCounts: {
                      ...(params.toolCallCounts ?? {}),
                      [toolName]: (params.toolCallCounts?.[toolName] ?? 0) + 1,
                    },
                  }
                : {}),
              messageToAppend: {
                content: contentParts,
                role: "tool",
                actionType: "tool_response",
                component: chunk.responseMessageDto.component,
                tool_call_id: chunk.responseMessageDto.tool_call_id,
                error: toolCallResponse.error,
              },
            };

          await updateThreadMessage(
            chunk.responseMessageDto.id,
            {
              ...chunk.responseMessageDto,
              error: toolCallResponse.error,
            },
            false,
          );

          await addThreadMessage(
            {
              threadId: chunk.responseMessageDto.threadId,
              content: contentParts,
              role: "tool",
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
              componentState: {},
              actionType: "tool_response",
              tool_call_id: chunk.responseMessageDto.tool_call_id,
              error: toolCallResponse.error,
            },
            false,
          );

          updateThreadStatus(
            chunk.responseMessageDto.threadId,
            GenerationStage.STREAMING_RESPONSE,
          );
          const toolCallResponseStream = await advanceStream(
            client,
            toolCallResponseParams,
            chunk.responseMessageDto.threadId,
          );

          return await handleAdvanceStream(
            toolCallResponseStream,
            toolCallResponseParams,
            chunk.responseMessageDto.threadId,
            contextKey,
          );
        } else {
          if (ignoreResponseRef.current) {
            setIgnoreResponse(false);
            return finalMessage ?? createEmptyMessage(threadId);
          }
          if (
            !hasSetThreadId &&
            chunk.responseMessageDto.threadId &&
            chunk.responseMessageDto.threadId !== currentThread?.id
          ) {
            hasSetThreadId = true;
            const wasPlaceholderThread =
              currentThreadId === PLACEHOLDER_THREAD.id;
            await switchCurrentThread(chunk.responseMessageDto.threadId, false);

            // If we're switching from placeholder to a real thread
            // this means a new thread was created, so add it to cache
            if (wasPlaceholderThread) {
              await addThreadToCache(
                chunk.responseMessageDto.threadId,
                contextKey,
              );
              // Check if we should auto-generate name for the newly created thread
              maybeAutoGenerateThreadName(
                chunk.responseMessageDto.threadId,
                contextKey,
              );
            }
          }

          if (!finalMessage) {
            finalMessage = chunk.responseMessageDto.component?.componentName
              ? renderComponentIntoMessage(
                  chunk.responseMessageDto,
                  componentList,
                )
              : chunk.responseMessageDto;
            await addThreadMessage(finalMessage, false);
          } else {
            // Handle streaming tool calls
            if (chunk.responseMessageDto.component?.toolCallRequest) {
              const { toolName } =
                chunk.responseMessageDto.component.toolCallRequest;
              const tool = toolName ? toolRegistry[toolName] : undefined;

              // if there is a tool call request on a component in a streaming chunk, and the tool
              // is marked as streamable by the correct annotation, handle it
              const isStreamable =
                tool?.annotations?.tamboStreamableHint ?? false;

              if (isStreamable) {
                // We're not paying attention to the tool call response here - we only want the
                // final tool call which is handled by the presence of a toolCallRequest on the
                // top-level responseMessageDto
                // see above: `if (chunk.responseMessageDto.toolCallRequest) { ... }`
                void (await handleToolCall(
                  chunk.responseMessageDto.component.toolCallRequest,
                  toolRegistry,
                  onCallUnregisteredTool,
                ));
              }
            }

            // Capture previous message ID before updating finalMessage
            const previousMessageId = finalMessage.id;

            if (chunk.responseMessageDto.component?.componentName) {
              finalMessage = renderComponentIntoMessage(
                chunk.responseMessageDto,
                componentList,
              );
            } else {
              finalMessage = chunk.responseMessageDto;
            }

            // if we start getting a new message mid-stream, put the previous one on screen
            const isNewMessage =
              chunk.responseMessageDto.id !== previousMessageId;
            if (isNewMessage) {
              await addThreadMessage(finalMessage, false);
            } else {
              await updateThreadMessage(finalMessage.id, finalMessage, false);
            }
          }
        }
      }

      const completedThreadId = finalMessage?.threadId ?? threadId;

      updateThreadStatus(completedThreadId, GenerationStage.COMPLETE);
      maybeAutoGenerateThreadName(completedThreadId, contextKey);

      return (
        finalMessage ?? {
          ...createEmptyMessage(completedThreadId),
          content: [{ type: "text", text: "Error processing stream" }],
        }
      );
    },
    [
      addThreadMessage,
      addThreadToCache,
      maybeAutoGenerateThreadName,
      client,
      componentList,
      currentThread?.id,
      currentThreadId,
      onCallUnregisteredTool,
      switchCurrentThread,
      toolRegistry,
      updateThreadMessage,
      updateThreadStatus,
    ],
  );

  const sendThreadMessage = useCallback(
    async (
      message: string,
      options: {
        threadId?: string;
        streamResponse?: boolean;
        forceToolChoice?: string;
        contextKey?: string;
        additionalContext?: Record<string, any>;
        content?: TamboAI.Beta.Threads.ChatCompletionContentPart[];
      } = {},
    ): Promise<TamboThreadMessage> => {
      setIgnoreResponse(false);
      const {
        threadId = currentThreadId ?? placeholderThread.id,
        streamResponse = streaming,
        forceToolChoice,
        contextKey,
        additionalContext,
        content,
      } = options;
      if (!streamResponse) {
        throw new Error(
          "Non-streaming mode is deprecated. Use streaming mode instead.",
        );
      }
      updateThreadStatus(threadId, GenerationStage.FETCHING_CONTEXT);

      // Get additional context from enabled helpers
      const helperContexts = await getAdditionalContext();

      // Combine all contexts
      const combinedContext: Record<string, any> = {
        ...(additionalContext ?? {}),
      };

      // Add helper contexts to combinedContext
      for (const helperContext of helperContexts) {
        combinedContext[helperContext.name] = helperContext.context;
      }

      // Build and optimistically add user message (for revert on fail)
      const optimiticMessageId = crypto.randomUUID();
      const messageContent = content ?? [
        { type: "text" as const, text: message },
      ];

      await addThreadMessage(
        {
          content: messageContent as any,
          renderedComponent: null,
          role: "user",
          threadId: threadId,
          id: optimiticMessageId,
          createdAt: new Date().toISOString(),
          componentState: {},
          additionalContext: combinedContext,
        },
        false,
      );

      maybeAutoGenerateThreadName(threadId, contextKey);

      const availableComponents = getAvailableComponents(
        componentList,
        toolRegistry,
        componentToolAssociations,
      );
      const unassociatedTools = getUnassociatedTools(
        toolRegistry,
        componentToolAssociations,
      );

      // Track tool call counts for this message processing
      const toolCallCounts: Record<string, number> = {};

      const params: TamboAI.Beta.Threads.ThreadAdvanceByIDParams = {
        messageToAppend: {
          content: messageContent as any,
          role: "user",
          additionalContext: combinedContext,
        },
        contextKey,
        availableComponents: availableComponents,
        clientTools: unassociatedTools.map((tool) =>
          mapTamboToolToContextTool(tool),
        ),
        forceToolChoice: forceToolChoice,
        toolCallCounts,
        ...(threadId === placeholderThread.id &&
          initialMessages.length > 0 && {
            initialMessages: initialMessages.map((msg) => ({
              content: msg.content,
              role: msg.role,
              additionalContext: msg.additionalContext,
            })),
          }),
      };

      let advanceStreamResponse: AsyncIterable<TamboAI.Beta.Threads.ThreadAdvanceResponse>;
      try {
        advanceStreamResponse = await advanceStream(
          client,
          params,
          threadId === placeholderThread.id ? undefined : threadId,
        );
      } catch (error) {
        updateThreadStatus(threadId, GenerationStage.ERROR);
        // Rollback the optimistic user message
        setThreadMap((prev) => {
          const thread = prev[threadId];
          if (!thread) return prev;
          return {
            ...prev,
            [threadId]: {
              ...thread,
              messages: thread.messages.filter(
                (msg) => msg.id !== optimiticMessageId,
              ),
            },
          };
        });
        throw error;
      }
      try {
        const result = await handleAdvanceStream(
          advanceStreamResponse,
          params,
          threadId,
          contextKey,
        );

        return result;
      } catch (error) {
        updateThreadStatus(threadId, GenerationStage.ERROR);
        // Rollback the optimistic user message
        setThreadMap((prev) => {
          const thread = prev[threadId];
          if (!thread) return prev;
          return {
            ...prev,
            [threadId]: {
              ...thread,
              messages: thread.messages.filter(
                (msg) => msg.id !== optimiticMessageId,
              ),
            },
          };
        });
        throw error;
      }
    },
    [
      componentList,
      toolRegistry,
      componentToolAssociations,
      currentThreadId,
      addThreadMessage,
      client,
      updateThreadStatus,
      handleAdvanceStream,
      streaming,
      getAdditionalContext,
      placeholderThread.id,
      initialMessages,
      maybeAutoGenerateThreadName,
    ],
  );

  return (
    <TamboThreadContext.Provider
      value={{
        thread: currentThread,
        currentThreadId,
        currentThread,
        threadMap,
        setThreadMap,
        switchCurrentThread,
        startNewThread,
        updateThreadName,
        generateThreadName,
        addThreadMessage,
        updateThreadMessage,
        streaming,
        cancel,
        sendThreadMessage,
        contextKey,
      }}
    >
      <TamboGenerationStageProvider
        generationStage={currentGenerationStage}
        statusMessage={currentStatusMessage}
      >
        {children}
      </TamboGenerationStageProvider>
    </TamboThreadContext.Provider>
  );
};

/**
 * The useTamboGenerationStage hook provides access to the generation stage context
 * to the descendants of the TamboThreadProvider.
 * @returns The generation stage context
 */
export const useTamboGenerationStage = (): TamboGenerationStageContextProps => {
  const generationStageContext = useContext(TamboGenerationStageContext);

  if (generationStageContext === undefined) {
    throw new Error(
      "useTamboGenerationStage must be used within a TamboThreadProvider",
    );
  }

  return generationStageContext;
};

/**
 * The useTamboThread hook provides access to the current thread context
 * to the descendants of the TamboThreadProvider.
 * @returns All state and actions for the current thread
 */
export const useTamboThread = (): CombinedTamboThreadContextProps => {
  const threadContext = useContext(TamboThreadContext);
  const generationStageContext = useContext(TamboGenerationStageContext);

  if (threadContext === undefined) {
    throw new Error("useTamboThread must be used within a TamboThreadProvider");
  }

  if (generationStageContext === undefined) {
    throw new Error("useTamboThread must be used within a TamboThreadProvider");
  }

  return {
    ...threadContext,
    ...generationStageContext,
  };
};

async function convertToolResponse(toolCallResponse: {
  result: unknown;
  error?: string;
  tamboTool?: TamboTool;
}): Promise<TamboAI.Beta.Threads.ChatCompletionContentPart[]> {
  // If the tool call errored, surface that as text so the model reliably sees the error
  if (toolCallResponse.error) {
    return [{ type: "text", text: toText(toolCallResponse.result) }];
  }

  // Use custom transform when available
  if (toolCallResponse.tamboTool?.transformToContent) {
    return await toolCallResponse.tamboTool.transformToContent(
      // result shape is user-defined; let the transform decide how to handle it
      toolCallResponse.result as any,
    );
  }

  // Default fallback to stringified text
  return [{ type: "text", text: toText(toolCallResponse.result) }];
}

/**
 * Create a placeholder/cancelled message with default values
 * @param threadId - ID of the thread the message belongs to
 * @returns An empty TamboThreadMessage
 */
function createEmptyMessage(threadId: string): TamboThreadMessage {
  return {
    threadId,
    content: [{ type: "text", text: "" }],
    role: "assistant",
    createdAt: new Date().toISOString(),
    id: crypto.randomUUID(),
    componentState: {},
  };
}
