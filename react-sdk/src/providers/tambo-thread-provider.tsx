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
  getClientContext,
  getUnassociatedTools,
  mapTamboToolToContextTool,
} from "../util/registry";
import { handleToolCall } from "../util/tool-caller";
import { useTamboClient } from "./tambo-client-provider";
import { useTamboRegistry } from "./tambo-registry-provider";

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
  /** The input value of the current thread */
  inputValue: string;
  /** Whether the thread is streaming */
  streaming: boolean;
  /** Set the input value of the current thread */
  setInputValue: (value: string) => void;
  /** Send a message to the current thread */
  sendThreadMessage: (
    message: string,
    options?: {
      threadId?: string;
      streamResponse?: boolean;
      contextKey?: string;
      forceToolChoice?: string;
    },
  ) => Promise<TamboThreadMessage>;
  /** The generation stage of the current thread - updated as the thread progresses */
  generationStage: GenerationStage;
  /** The generation status message of the current thread - updated as the thread progresses */
  generationStatusMessage: string;
  /** Whether the thread is idle */
  isIdle: boolean;
}

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
  inputValue: "",
  streaming: true,
  /**
   *
   */
  setInputValue: () => {
    throw new Error("setInputValue not implemented");
  },
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
    throw new Error("advance not implemented");
  },
  generationStage: GenerationStage.IDLE,
  generationStatusMessage: "",
  isIdle: true,
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
  const [inputValue, setInputValue] = useState("");
  const [ignoreToolResponse, setIgnoreToolResponse] = useState(false);
  const ignoreToolResponseRef = useRef(ignoreToolResponse);
  const [currentThreadId, setCurrentThreadId] = useState<string>(
    PLACEHOLDER_THREAD.id,
  );
  const currentThread: TamboThread | undefined = threadMap[currentThreadId];

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
    ignoreToolResponseRef.current = ignoreToolResponse;
  }, [ignoreToolResponse]);

  const isIdle = useMemo(
    () =>
      isIdleStage(
        (currentThread?.generationStage ??
          GenerationStage.IDLE) as GenerationStage,
      ),
    [currentThread?.generationStage],
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
      const chatMessage: TamboThreadMessage & {
        additionalContext?: string;
      } = {
        ...message,
        additionalContext:
          message.role === "user" ? getClientContext() : undefined,
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
          // additionalContext: chatMessage.additionalContext,
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
          // additionalContext: chatMessage.additionalContext,
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
      if (threadId === PLACEHOLDER_THREAD.id) {
        console.warn("Cannot cancel placeholder thread, may be a bug.");
        return;
      }
      if (isIdle) {
        return;
      }
      await client.beta.threads.cancel(threadId);
      setIgnoreToolResponse(true);
      setThreadMap((prevMap) => {
        if (!prevMap[threadId]) {
          return prevMap;
        }
        return {
          ...prevMap,
          [threadId]: {
            ...prevMap[threadId],
            generationStage: GenerationStage.CANCELLED,
          },
        };
      });
    },
    [client.beta.threads, currentThreadId, isIdle],
  );

  const handleAdvanceStream = useCallback(
    async (
      stream: AsyncIterable<TamboAI.Beta.Threads.ThreadAdvanceResponse>,
      params: TamboAI.Beta.Threads.ThreadAdvanceParams,
      threadId: string,
    ): Promise<TamboThreadMessage> => {
      let finalMessage: Readonly<TamboThreadMessage> | undefined;
      let hasSetThreadId = false;
      updateThreadStatus(threadId, GenerationStage.STREAMING_RESPONSE);

      for await (const chunk of stream) {
        if (chunk.responseMessageDto.toolCallRequest) {
          updateThreadStatus(
            chunk.responseMessageDto.threadId,
            GenerationStage.FETCHING_CONTEXT,
          );

          const toolCallResponse = await handleToolCall(
            chunk.responseMessageDto,
            toolRegistry,
          );
          if (ignoreToolResponseRef.current) {
            setIgnoreToolResponse(false);
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

  const currentThreadContextKey = currentThread?.contextKey;

  const sendThreadMessage = useCallback(
    async (
      message: string,
      options: {
        threadId?: string;
        streamResponse?: boolean;
        forceToolChoice?: string;
        contextKey?: string;
      } = {},
    ): Promise<TamboThreadMessage> => {
      setIgnoreToolResponse(false);
      const {
        threadId = currentThreadId ?? PLACEHOLDER_THREAD.id,
        streamResponse = streaming,
        forceToolChoice,
        contextKey = currentThreadContextKey,
      } = options;
      updateThreadStatus(threadId, GenerationStage.FETCHING_CONTEXT);

      addThreadMessage(
        {
          content: [{ type: "text", text: message }],
          renderedComponent: null,
          role: "user",
          threadId: threadId,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          componentState: {},
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
      const params: TamboAI.Beta.Threads.ThreadAdvanceParams = {
        messageToAppend: {
          content: [{ type: "text", text: message }],
          role: "user",
        },
        contextKey,
        availableComponents: availableComponents,
        clientTools: unassociatedTools.map((tool) =>
          mapTamboToolToContextTool(tool),
        ),
        forceToolChoice: forceToolChoice,
      };

      if (streamResponse) {
        const advanceStreamResponse = await advanceStream(
          client,
          params,
          threadId === PLACEHOLDER_THREAD.id ? undefined : threadId,
        );
        return await handleAdvanceStream(
          advanceStreamResponse,
          params,
          threadId,
        );
      }
      let advanceResponse = await (threadId === PLACEHOLDER_THREAD.id
        ? client.beta.threads.advance(params)
        : client.beta.threads.advanceById(threadId, params));

      //handle tool calls
      while (advanceResponse.responseMessageDto.toolCallRequest) {
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
        advanceResponse = await client.beta.threads.advanceById(
          advanceResponse.responseMessageDto.threadId,
          toolCallResponseParams,
        );
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
      currentThreadContextKey,
      switchCurrentThread,
      addThreadMessage,
      client,
      updateThreadMessage,
      updateThreadStatus,
      handleAdvanceStream,
      streaming,
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
        inputValue,
        setInputValue,
        sendThreadMessage,
        streaming,
        generationStage: (currentThread?.generationStage ??
          GenerationStage.IDLE) as GenerationStage,
        generationStatusMessage: currentThread?.statusMessage ?? "",
        isIdle,
        cancel,
      }}
    >
      {children}
    </TamboThreadContext.Provider>
  );
};

/**
 * The useTamboThread hook provides access to the current thread context
 * to the descendants of the TamboThreadProvider.
 * @returns All state and actions for the current thread
 */
export const useTamboThread = () => {
  const context = useContext(TamboThreadContext);
  if (context === undefined) {
    throw new Error("useTamboThread must be used within a TamboThreadProvider");
  }
  return context;
};
