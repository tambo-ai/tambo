"use client";
import TamboAI, { advanceStream } from "@tambo-ai/typescript-sdk";
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  GenerationStage,
  isIdleStage,
  TamboThreadMessage,
} from "../model/generate-component-response";
import { TamboThread } from "../model/tambo-thread";
import { renderComponentIntoMessage } from "../util/generate-component";
import { getAvailableComponents, getClientContext } from "../util/registry";
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
  /** The input value of the current thread */
  inputValue: string;
  /** Set the input value of the current thread */
  setInputValue: (value: string) => void;
  /** Send a message to the current thread */
  sendThreadMessage: (
    message: string,
    options: {
      threadId: string;
      streamResponse?: boolean;
      contextKey?: string;
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
  addThreadMessage: () => {
    throw new Error("updateThreadMessageHistory not implemented");
  },
  inputValue: "",
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
});

/**
 * The TamboThreadProvider is a React provider that provides a thread context
 * to the descendants of the provider.
 * @param props - The props for the TamboThreadProvider
 * @param props.children - The children to wrap
 * @returns The TamboThreadProvider component
 */
export const TamboThreadProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [threadMap, setThreadMap] = useState<Record<string, TamboThread>>({
    [PLACEHOLDER_THREAD.id]: PLACEHOLDER_THREAD,
  });
  const client = useTamboClient();
  const { componentList, toolRegistry, componentToolAssociations } =
    useTamboRegistry();
  const [inputValue, setInputValue] = useState("");

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

      setThreadMap((prevMap) => ({
        ...prevMap,
        [threadId]: threadWithRenderedComponents,
      }));
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
      // optimistically update the thread in the local state
      setThreadMap((prevMap) => {
        if (!threadId) {
          return prevMap;
        }
        const prevMessages = prevMap[threadId]?.messages || [];
        return {
          ...prevMap,
          [threadId]: {
            ...prevMap[threadId],
            messages: [...prevMessages, chatMessage],
          },
        };
      });
      if (sendToServer) {
        // TODO: if this fails, we need to revert the local state update
        await client.beta.threads.messages.create(currentThreadId, {
          content: message.content,
          role: message.role,
          // additionalContext: chatMessage.additionalContext,
        });
      }
      const updatedMessageHistory = [...currentThread.messages, chatMessage];

      return updatedMessageHistory;
    },
    [client.beta.threads.messages, currentThread, currentThreadId],
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
        await client.beta.threads.messages.create(currentThreadId, {
          content: message.content,
          role: message.role,
          // additionalContext: chatMessage.additionalContext,
        });
      }
    },
    [client.beta.threads.messages, currentThreadId],
  );

  const deleteThreadMessage = useCallback(
    (messageId: string) => {
      if (!currentThread) return;

      setThreadMap((prevMap) => ({
        ...prevMap,
        [currentThread.id]: {
          ...prevMap[currentThread.id],
          messages: prevMap[currentThread.id].messages.filter(
            (msg) => msg.id !== messageId,
          ),
        },
      }));
    },
    [currentThread],
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

  const switchCurrentThread = useCallback(
    async (threadId: string, fetch = true) => {
      if (threadId === PLACEHOLDER_THREAD.id) {
        console.warn("Switching to placeholder thread, may be a bug.");
        return;
      }

      setCurrentThreadId(threadId);
      if (!threadMap[threadId]) {
        setThreadMap((prevMap) => {
          return {
            ...prevMap,
            [threadId]: {
              ...prevMap[PLACEHOLDER_THREAD.id],
              id: threadId,
            },
          };
        });
      }
      if (fetch) {
        await fetchThread(threadId);
      }
    },
    [fetchThread, threadMap],
  );

  const updateThreadStatus = useCallback(
    (threadId: string, stage: GenerationStage, statusMessage?: string) => {
      setThreadMap((prevMap) => {
        return {
          ...prevMap,
          [threadId]: {
            ...prevMap[threadId],
            generationStage: stage,
            statusMessage: statusMessage,
          },
        };
      });
    },
    [],
  );

  const handleAdvanceStream = useCallback(
    async (
      stream: AsyncIterable<TamboAI.Beta.Threads.ThreadAdvanceResponse>,
      params: TamboAI.Beta.Threads.ThreadAdvanceParams,
      threadId: string,
      messageIdToRemove?: string,
    ): Promise<TamboThreadMessage> => {
      let finalMessage: TamboThreadMessage | undefined;
      let hasSetThreadId = false;
      let isFirstChunk = true;
      updateThreadStatus(threadId, GenerationStage.STREAMING_RESPONSE);

      for await (const chunk of stream) {
        if (isFirstChunk && messageIdToRemove) {
          deleteThreadMessage(messageIdToRemove);
        }
        isFirstChunk = false;

        if (chunk.responseMessageDto.toolCallRequest) {
          updateThreadStatus(threadId, GenerationStage.FETCHING_CONTEXT);
          const toolCallResponse = await handleToolCall(
            chunk.responseMessageDto,
            toolRegistry,
          );
          const toolCallResponseString =
            typeof toolCallResponse === "string"
              ? toolCallResponse
              : JSON.stringify(toolCallResponse);
          const toolCallResponseParams: TamboAI.Beta.Threads.ThreadAdvanceParams =
            {
              ...params,
              messageToAppend: {
                content: [{ type: "text", text: toolCallResponseString }],
                role: "tool",
                actionType: "tool_response",
                component: chunk.responseMessageDto.component,
                tool_call_id: chunk.responseMessageDto.tool_call_id,
              },
            };
          updateThreadStatus(threadId, GenerationStage.STREAMING_RESPONSE);
          const toolCallResponseStream = await advanceStream(
            client,
            toolCallResponseParams,
            chunk.responseMessageDto.threadId,
          );

          // Pass the current message's ID to be removed when the new stream starts, since we now know it is a tool call request message
          return await handleAdvanceStream(
            toolCallResponseStream,
            toolCallResponseParams,
            threadId,
            finalMessage?.id,
          );
        } else {
          if (
            !hasSetThreadId &&
            chunk.responseMessageDto.threadId &&
            chunk.responseMessageDto.threadId !== currentThread?.id
          ) {
            hasSetThreadId = true;
            switchCurrentThread(chunk.responseMessageDto.threadId, false);
          }

          if (!finalMessage) {
            finalMessage = chunk.responseMessageDto.component?.componentName
              ? renderComponentIntoMessage(
                  chunk.responseMessageDto,
                  componentList,
                )
              : chunk.responseMessageDto;
            addThreadMessage(finalMessage, false);
          } else {
            const previousId = finalMessage.id;
            finalMessage = chunk.responseMessageDto.component?.componentName
              ? renderComponentIntoMessage(
                  chunk.responseMessageDto,
                  componentList,
                )
              : chunk.responseMessageDto;
            updateThreadMessage(previousId, finalMessage, false);
          }
        }
      }

      updateThreadStatus(threadId, GenerationStage.COMPLETE);
      if (finalMessage) {
        await fetchThread(finalMessage.threadId);
      }
      return (
        finalMessage ?? {
          threadId: "",
          content: [{ type: "text", text: `Error processing stream` }],
          role: "hydra",
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
      deleteThreadMessage,
      fetchThread,
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
        threadId: string;
        streamResponse?: boolean;
        contextKey?: string;
      },
    ): Promise<TamboThreadMessage> => {
      const { threadId, streamResponse } = options;
      updateThreadStatus(threadId, GenerationStage.CHOOSING_COMPONENT);

      addThreadMessage(
        {
          content: [{ type: "text", text: message }],
          renderedComponent: null,
          role: "user",
          threadId: currentThread.id,
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
      const params: TamboAI.Beta.Threads.ThreadAdvanceParams = {
        messageToAppend: {
          content: [{ type: "text", text: message }],
          role: "user",
        },
        contextKey: options.contextKey,
        availableComponents: availableComponents,
      };

      if (streamResponse) {
        const advanceStreamResponse = await advanceStream(
          client,
          params,
          currentThreadId === PLACEHOLDER_THREAD.id
            ? undefined
            : currentThreadId,
        );
        return await handleAdvanceStream(
          advanceStreamResponse,
          params,
          threadId,
        );
      }
      let advanceResponse = await (currentThreadId === PLACEHOLDER_THREAD.id
        ? client.beta.threads.advance(params)
        : client.beta.threads.advanceById(currentThreadId, params));

      //handle tool calls
      while (advanceResponse.responseMessageDto.toolCallRequest) {
        updateThreadStatus(threadId, GenerationStage.FETCHING_CONTEXT);
        const toolCallResponse = await handleToolCall(
          advanceResponse.responseMessageDto,
          toolRegistry,
        );
        const toolResponseString =
          typeof toolCallResponse === "string"
            ? toolCallResponse
            : JSON.stringify(toolCallResponse);
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
            },
          };
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
      updateThreadStatus(threadId, GenerationStage.COMPLETE);
      return finalMessage;
    },
    [
      componentList,
      toolRegistry,
      componentToolAssociations,
      currentThread,
      switchCurrentThread,
      addThreadMessage,
      client,
      updateThreadStatus,
      handleAdvanceStream,
    ],
  );

  return (
    <TamboThreadContext.Provider
      value={{
        thread: currentThread,
        switchCurrentThread,
        startNewThread,
        addThreadMessage,
        updateThreadMessage,
        inputValue,
        setInputValue,
        sendThreadMessage,
        generationStage: (currentThread?.generationStage ??
          GenerationStage.IDLE) as GenerationStage,
        generationStatusMessage: currentThread?.statusMessage ?? "",
        isIdle: isIdleStage(
          (currentThread?.generationStage ??
            GenerationStage.IDLE) as GenerationStage,
        ),
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
