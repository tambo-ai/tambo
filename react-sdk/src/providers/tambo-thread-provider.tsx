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
import {
  GenerationStage,
  isIdleStage,
  TamboThreadMessage,
} from "../model/generate-component-response";
import { TamboThread } from "../model/tambo-thread";
import { renderComponentIntoMessage } from "../util/generate-component";
import {
  getAvailableComponents,
  getUnassociatedTools,
  mapTamboToolToContextTool,
} from "../util/registry";
import { handleToolCall } from "../util/tool-caller";
import { useTamboClient } from "./tambo-client-provider";
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

export interface TamboThreadContextProps {
  /** The current thread */
  thread: TamboThread;
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
    message: TamboThreadMessage,
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
    },
  ) => Promise<TamboThreadMessage>;
}

// Combined context interface that includes generation stage fields
export interface CombinedTamboThreadContextProps
  extends TamboThreadContextProps,
    TamboGenerationStageContextProps {}

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

export interface TamboThreadProviderProps {
  /** Whether to stream the response */
  streaming?: boolean;
}

/**
 * The TamboThreadProvider is a React provider that provides a thread context
 * to the descendants of the provider.
 * @param props - The props for the TamboThreadProvider
 * @param props.children - The children to wrap
 * @param props.streaming - Whether to stream the response by default. Defaults to true.
 * @returns The TamboThreadProvider component
 */
export const TamboThreadProvider: React.FC<
  PropsWithChildren<TamboThreadProviderProps>
> = ({ children, streaming = true }) => {
  const [threadMap, setThreadMap] = useState<Record<string, TamboThread>>({
    [PLACEHOLDER_THREAD.id]: PLACEHOLDER_THREAD,
  });
  const client = useTamboClient();
  const { componentList, toolRegistry, componentToolAssociations } =
    useTamboRegistry();
  const { getAdditionalContext } = useTamboContextHelpers();
  const [ignoreResponse, setIgnoreResponse] = useState(false);
  const ignoreResponseRef = useRef(ignoreResponse);
  const [currentThreadId, setCurrentThreadId] = useState<string>(
    PLACEHOLDER_THREAD.id,
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

  const fetchThread = useCallback(
    async (threadId: string, includeInternalMessages = true) => {
      const thread = await client.beta.threads.retrieve(threadId, {
        includeInternal: includeInternalMessages,
      });
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
    if (
      currentThreadId &&
      currentThreadId !== PLACEHOLDER_THREAD.id &&
      !threadMap[currentThreadId]
    ) {
      fetchThread(currentThreadId);
    }
  }, [currentThreadId, fetchThread, threadMap]);

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
        // TODO: if this fails, we need to revert the local state update
        await client.beta.threads.messages.create(message.threadId, {
          content: message.content,
          role: message.role,
          additionalContext: chatMessage.additionalContext,
        });
      }
      return threadMap[threadId]?.messages || [];
    },
    [client.beta.threads.messages, currentThread, threadMap],
  );

  const updateThreadMessage = useCallback(
    async (
      id: string,
      message: TamboThreadMessage,
      sendToServer = true,
      createdAt: string = new Date().toISOString(),
    ) => {
      const chatMessage: TamboThreadMessage = {
        ...message,
        createdAt,
      };

      setThreadMap((prevMap) => {
        if (!message.threadId) {
          return prevMap;
        }
        const prevMessages = prevMap[message.threadId]?.messages || [];
        const updatedMessages = prevMessages.map((msg) => {
          if (msg.id === id) {
            return chatMessage;
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
      if (sendToServer) {
        // TODO: if this fails, we need to revert the local state update
        await client.beta.threads.messages.create(message.threadId, {
          content: message.content,
          role: message.role,
          additionalContext: chatMessage.additionalContext,
        });
      }
    },
    [client.beta.threads.messages],
  );

  const startNewThread = useCallback(() => {
    setCurrentThreadId(PLACEHOLDER_THREAD.id);
    setThreadMap((prevMap) => {
      return {
        ...prevMap,
        [PLACEHOLDER_THREAD.id]: PLACEHOLDER_THREAD,
      };
    });
  }, []);

  const updateThreadName = useCallback(
    async (name: string, threadId?: string) => {
      threadId ??= currentThreadId;

      setThreadMap((prevMap) => {
        if (!prevMap[threadId]) {
          return prevMap;
        }
        return { ...prevMap, [threadId]: { ...prevMap[threadId], name } };
      });

      if (threadId !== PLACEHOLDER_THREAD.id) {
        const currentProject = await client.beta.projects.getCurrent();
        await client.beta.threads.update(threadId, {
          name,
          projectId: currentProject.id,
        });
      }
    },
    [currentThreadId, client.beta.projects, client.beta.threads],
  );

  const generateThreadName = useCallback(
    async (threadId?: string) => {
      threadId ??= currentThreadId;
      if (threadId === PLACEHOLDER_THREAD.id) {
        console.warn("Cannot generate name for empty thread");
        return threadMap[threadId];
      }

      const threadWithGeneratedName =
        await client.beta.threads.generateName(threadId);

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
      return threadWithGeneratedName;
    },
    [client.beta.threads, currentThreadId, threadMap],
  );

  const switchCurrentThread = useCallback(
    async (threadId: string, fetch = true) => {
      if (threadId === PLACEHOLDER_THREAD.id) {
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
            ...prevMap[PLACEHOLDER_THREAD.id],
            id: threadId,
          },
        };
        return updatedThreadMap;
      });
      if (fetch) {
        await fetchThread(threadId);
      }
    },
    [fetchThread],
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
      params: TamboAI.Beta.Threads.ThreadAdvanceParams,
      threadId: string,
    ): Promise<TamboThreadMessage> => {
      if (ignoreResponseRef.current) {
        setIgnoreResponse(false);
        return {
          threadId: threadId,
          content: [{ type: "text", text: "" }],
          role: "assistant",
          createdAt: new Date().toISOString(),
          id: crypto.randomUUID(),
          componentState: {},
        };
      }
      let finalMessage: Readonly<TamboThreadMessage> | undefined;
      let hasSetThreadId = false;
      updateThreadStatus(threadId, GenerationStage.STREAMING_RESPONSE);

      for await (const chunk of stream) {
        if (chunk.responseMessageDto.toolCallRequest) {
          // Increment tool call count for this tool
          const toolName = chunk.responseMessageDto.toolCallRequest.toolName;
          if (toolName && params.toolCallCounts) {
            params.toolCallCounts[toolName] =
              (params.toolCallCounts[toolName] ?? 0) + 1;
          }

          updateThreadStatus(
            chunk.responseMessageDto.threadId,
            GenerationStage.FETCHING_CONTEXT,
          );

          updateThreadMessage(
            chunk.responseMessageDto.id,
            {
              ...chunk.responseMessageDto,
            },
            false,
          );

          const toolCallResponse = await handleToolCall(
            chunk.responseMessageDto,
            toolRegistry,
          );
          if (ignoreResponseRef.current) {
            setIgnoreResponse(false);
            {
              return {
                threadId: threadId,
                content: [{ type: "text", text: "" }],
                role: "assistant",
                createdAt: new Date().toISOString(),
                id: crypto.randomUUID(),
                componentState: {},
              };
            }
          }
          const toolCallResponseString =
            typeof toolCallResponse.result === "string"
              ? toolCallResponse.result
              : JSON.stringify(toolCallResponse.result);
          const toolCallResponseParams: TamboAI.Beta.Threads.ThreadAdvanceParams =
            {
              ...params,
              messageToAppend: {
                content: [{ type: "text", text: toolCallResponseString }],
                role: "tool",
                actionType: "tool_response",
                component: chunk.responseMessageDto.component,
                tool_call_id: chunk.responseMessageDto.tool_call_id,
                error: toolCallResponse.error,
              },
            };

          updateThreadMessage(
            chunk.responseMessageDto.id,
            {
              ...chunk.responseMessageDto,
              error: toolCallResponse.error,
            },
            false,
          );

          addThreadMessage(
            {
              threadId: chunk.responseMessageDto.threadId,
              content: [{ type: "text", text: toolCallResponseString }],
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
          );
        } else {
          if (ignoreResponseRef.current) {
            setIgnoreResponse(false);
            return (
              finalMessage ?? {
                threadId: threadId,
                content: [{ type: "text", text: "" }],
                role: "assistant",
                createdAt: new Date().toISOString(),
                id: crypto.randomUUID(),
                componentState: {},
              }
            );
          }
          if (
            !hasSetThreadId &&
            chunk.responseMessageDto.threadId &&
            chunk.responseMessageDto.threadId !== currentThread?.id
          ) {
            hasSetThreadId = true;
            await switchCurrentThread(chunk.responseMessageDto.threadId, false);
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
            // if we start getting a new message mid-stream, put the previous one on screen
            const isNewMessage =
              chunk.responseMessageDto.id !== finalMessage.id;

            finalMessage = chunk.responseMessageDto.component?.componentName
              ? renderComponentIntoMessage(
                  chunk.responseMessageDto,
                  componentList,
                )
              : chunk.responseMessageDto;

            if (isNewMessage) {
              await addThreadMessage(finalMessage, false);
            } else {
              await updateThreadMessage(finalMessage.id, finalMessage, false);
            }
          }
        }
      }

      updateThreadStatus(
        finalMessage?.threadId ?? threadId,
        GenerationStage.COMPLETE,
      );
      return (
        finalMessage ?? {
          threadId: "",
          content: [{ type: "text", text: `Error processing stream` }],
          role: "assistant",
          createdAt: new Date().toISOString(),
          id: crypto.randomUUID(),
          componentState: {},
        }
      );
    },
    [
      addThreadMessage,
      client,
      componentList,
      currentThread?.id,
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
      } = {},
    ): Promise<TamboThreadMessage> => {
      setIgnoreResponse(false);
      const {
        threadId = currentThreadId ?? PLACEHOLDER_THREAD.id,
        streamResponse = streaming,
        forceToolChoice,
        contextKey,
        additionalContext,
      } = options;
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

      addThreadMessage(
        {
          content: [{ type: "text", text: message }],
          renderedComponent: null,
          role: "user",
          threadId: threadId,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          componentState: {},
          additionalContext: combinedContext,
        },
        false,
      );

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

      const params: TamboAI.Beta.Threads.ThreadAdvanceParams = {
        messageToAppend: {
          content: [{ type: "text", text: message }],
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
      };

      if (streamResponse) {
        let advanceStreamResponse: AsyncIterable<TamboAI.Beta.Threads.ThreadAdvanceResponse>;
        try {
          advanceStreamResponse = await advanceStream(
            client,
            params,
            threadId === PLACEHOLDER_THREAD.id ? undefined : threadId,
          );
        } catch (error) {
          updateThreadStatus(threadId, GenerationStage.ERROR);
          throw error;
        }
        try {
          return await handleAdvanceStream(
            advanceStreamResponse,
            params,
            threadId,
          );
        } catch (error) {
          updateThreadStatus(threadId, GenerationStage.ERROR);
          throw error;
        }
      }

      let advanceResponse: TamboAI.Beta.Threads.ThreadAdvanceResponse;
      try {
        advanceResponse = await (threadId === PLACEHOLDER_THREAD.id
          ? client.beta.threads.advance(params)
          : client.beta.threads.advanceById(threadId, params));
      } catch (error) {
        updateThreadStatus(threadId, GenerationStage.ERROR);
        throw error;
      }

      //handle tool calls
      try {
        while (advanceResponse.responseMessageDto.toolCallRequest) {
          // Increment tool call count for this tool
          const toolName =
            advanceResponse.responseMessageDto.toolCallRequest.toolName;
          if (toolName) {
            toolCallCounts[toolName] = (toolCallCounts[toolName] || 0) + 1;
          }

          updateThreadStatus(threadId, GenerationStage.FETCHING_CONTEXT);
          const toolCallResponse = await handleToolCall(
            advanceResponse.responseMessageDto,
            toolRegistry,
          );
          const toolResponseString =
            typeof toolCallResponse.result === "string"
              ? toolCallResponse.result
              : JSON.stringify(toolCallResponse.result);
          const toolCallResponseParams: TamboAI.Beta.Threads.ThreadAdvanceParams =
            {
              ...params,
              messageToAppend: {
                ...params.messageToAppend,
                content: [{ type: "text", text: toolResponseString }],
                role: "tool",
                actionType: "tool_response",
                component: advanceResponse.responseMessageDto.component,
                tool_call_id: advanceResponse.responseMessageDto.tool_call_id,
                error: toolCallResponse.error,
              },
            };
          if (toolCallResponse.error) {
            //update toolcall message with error
            const toolCallMessage = {
              ...advanceResponse.responseMessageDto,
              error: toolCallResponse.error,
            };
            updateThreadMessage(toolCallMessage.id, toolCallMessage, false);
          }
          updateThreadStatus(threadId, GenerationStage.HYDRATING_COMPONENT);
          addThreadMessage(
            {
              threadId: threadId,
              content: [{ type: "text", text: toolResponseString }],
              role: "tool",
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
              componentState: {},
              actionType: "tool_response",
              tool_call_id: advanceResponse.responseMessageDto.tool_call_id,
              error: toolCallResponse.error,
            },
            false,
          );

          advanceResponse = await client.beta.threads.advanceById(
            advanceResponse.responseMessageDto.threadId,
            toolCallResponseParams,
          );
        }
      } catch (error) {
        updateThreadStatus(
          advanceResponse.responseMessageDto.threadId,
          GenerationStage.ERROR,
        );
        throw error;
      }

      const finalMessage = advanceResponse.responseMessageDto.component
        ?.componentName
        ? renderComponentIntoMessage(
            advanceResponse.responseMessageDto,
            componentList,
          )
        : advanceResponse.responseMessageDto;
      await switchCurrentThread(advanceResponse.responseMessageDto.threadId);
      updateThreadStatus(
        advanceResponse.responseMessageDto.threadId,
        GenerationStage.COMPLETE,
      );
      return finalMessage;
    },
    [
      componentList,
      toolRegistry,
      componentToolAssociations,
      currentThreadId,
      switchCurrentThread,
      addThreadMessage,
      client,
      updateThreadMessage,
      updateThreadStatus,
      handleAdvanceStream,
      streaming,
      getAdditionalContext,
    ],
  );

  return (
    <TamboThreadContext.Provider
      value={{
        thread: currentThread,
        switchCurrentThread,
        startNewThread,
        updateThreadName,
        generateThreadName,
        addThreadMessage,
        updateThreadMessage,
        streaming,
        cancel,
        sendThreadMessage,
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
