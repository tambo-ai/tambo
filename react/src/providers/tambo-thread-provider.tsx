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
  TamboThreadMessage,
} from "../model/generate-component-response";
import { TamboThread } from "../model/tambo-thread";
import { renderComponentIntoMessage } from "../util/generate-component";
import { getAvailableComponents, getClientContext } from "../util/registry";
import { handleToolCall } from "../util/tool-caller";
import { useTamboClient } from "./tambo-client-provider";
import { useTamboRegistry } from "./tambo-registry-provider";

export interface TamboThreadContextProps {
  thread: TamboThread;
  switchCurrentThread: (threadId: string) => void;
  addThreadMessage: (
    message: TamboThreadMessage,
    sendToServer: boolean,
  ) => Promise<TamboAI.Beta.Threads.ThreadMessage[]>;
  updateThreadMessage: (
    id: string,
    message: TamboThreadMessage,
    sendToServer: boolean,
  ) => Promise<void>;
  setLastThreadStatus: (status: GenerationStage) => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  sendThreadMessage: (
    message: string,
    options?: {
      threadId?: string;
      streamResponse?: boolean;
      contextKey?: string;
    },
  ) => Promise<TamboThreadMessage>;
}

/** This is a stub entry for when the thread is not yet created, the first time
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
  switchCurrentThread: () => {
    throw new Error("switchCurrentThread not implemented");
  },
  addThreadMessage: () => {
    throw new Error("updateThreadMessageHistory not implemented");
  },
  setLastThreadStatus: () => {
    throw new Error("setLastThreadStatus not implemented");
  },
  inputValue: "",
  setInputValue: () => {
    throw new Error("setInputValue not implemented");
  },
  updateThreadMessage: () => {
    throw new Error("updateThreadMessage not implemented");
  },
  sendThreadMessage: () => {
    throw new Error("advance not implemented");
  },
});

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
  const [unresolvedThreadId, setUnresolvedThreadId] = useState<
    string | undefined
  >(PLACEHOLDER_THREAD.id);
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

  useEffect(() => {
    if (unresolvedThreadId && currentThreadId !== unresolvedThreadId) {
      setThreadMap((prevMap) => {
        const unresolvedThread = prevMap[unresolvedThreadId];
        const currentThread = prevMap[currentThreadId];
        return {
          ...prevMap,
          [unresolvedThreadId]: PLACEHOLDER_THREAD,
          [currentThreadId]: {
            ...currentThread,
            id: currentThreadId,
            messages: [...unresolvedThread.messages, ...currentThread.messages],
          },
        };
      });
      setUnresolvedThreadId(undefined);
    }
  }, [currentThreadId, unresolvedThreadId]);

  const switchCurrentThread = useCallback(
    async (threadId: string) => {
      if (threadId === PLACEHOLDER_THREAD.id) {
        console.warn("Switching to placeholder thread, may be a bug");
        return;
      }
      setCurrentThreadId(threadId);
      if (!threadMap[threadId]) {
        setThreadMap((prevMap) => ({
          ...prevMap,
          [threadId]: {
            ...PLACEHOLDER_THREAD,
            id: threadId,
          },
        }));
      }
      await fetchThread(threadId);
    },
    [fetchThread, threadMap],
  );

  const setLastThreadStatus = (status: GenerationStage) => {
    setThreadMap((prevMap) => {
      if (!currentThreadId) {
        return prevMap;
      }
      const headMessages = prevMap[currentThreadId].messages.slice(0, -1);
      const lastMessage =
        prevMap[currentThreadId].messages[
          prevMap[currentThreadId].messages.length - 1
        ];
      const updatedLastMessage = {
        ...lastMessage,
        status,
      };
      return {
        ...prevMap,
        [currentThreadId]: {
          ...prevMap[currentThreadId],
          messages: [...headMessages, updatedLastMessage],
        },
      };
    });
  };

  const updateThreadStatus = useCallback(
    (stage: GenerationStage) => {
      setThreadMap((prevMap) => {
        return {
          ...prevMap,
          [currentThreadId]: {
            ...prevMap[currentThreadId],
            generationStage: stage,
          },
        };
      });
    },
    [currentThreadId],
  );

  const handleAdvanceStream = useCallback(
    async (
      stream: AsyncIterable<TamboAI.Beta.Threads.ThreadAdvanceResponse>,
      params: TamboAI.Beta.Threads.ThreadAdvanceParams,
    ): Promise<TamboThreadMessage> => {
      let finalMessage: TamboThreadMessage | undefined;
      let hasSetThreadId = false;
      updateThreadStatus(GenerationStage.STREAMING_RESPONSE);
      for await (const chunk of stream) {
        if (chunk.responseMessageDto.toolCallRequest) {
          updateThreadStatus(GenerationStage.FETCHING_CONTEXT);
          const toolCallResponse = await handleToolCall(
            chunk.responseMessageDto,
            toolRegistry,
          );
          const toolCallResponseParams: TamboAI.Beta.Threads.ThreadAdvanceParams =
            {
              ...params,
              messageToAppend: {
                content: [{ type: "text", text: "tool response" }],
                role: "tool",
                actionType: "tool_response",
                toolResponse: toolCallResponse,
                component: chunk.responseMessageDto.component,
              },
            };
          updateThreadStatus(GenerationStage.STREAMING_RESPONSE);
          const toolCallResponseStream = await advanceStream(
            client,
            toolCallResponseParams,
            chunk.responseMessageDto.threadId,
          );
          return handleAdvanceStream(
            toolCallResponseStream,
            toolCallResponseParams,
          );
        } else {
          if (
            !hasSetThreadId &&
            chunk.responseMessageDto.threadId &&
            chunk.responseMessageDto.threadId !== currentThread?.id
          ) {
            hasSetThreadId = true;
            switchCurrentThread(chunk.responseMessageDto.threadId);
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

      updateThreadStatus(GenerationStage.COMPLETE);
      return (
        finalMessage ?? {
          threadId: "",
          content: [{ type: "text", text: `Error processing stream` }],
          role: "hydra",
          createdAt: new Date().toISOString(),
          id: crypto.randomUUID(),
        }
      );
    },
    [
      toolRegistry,
      client,
      currentThread?.id,
      switchCurrentThread,
      componentList,
      addThreadMessage,
      updateThreadMessage,
    ],
  );

  const sendThreadMessage = useCallback(
    async (
      message: string,
      options: {
        threadId?: string;
        streamResponse?: boolean;
        contextKey?: string;
      } = {},
    ): Promise<TamboThreadMessage> => {
      const { threadId, streamResponse } = options;
      const currentThreadId = threadId ?? currentThread?.id;

      if (currentThreadId !== PLACEHOLDER_THREAD.id) {
        await switchCurrentThread(currentThreadId);
      }

      updateThreadStatus(GenerationStage.CHOOSING_COMPONENT);

      addThreadMessage(
        {
          content: [{ type: "text", text: message }],
          renderedComponent: null,
          role: "user",
          threadId: currentThread.id,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
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
        return handleAdvanceStream(advanceStreamResponse, params);
      }
      let advanceResponse = await (currentThreadId === PLACEHOLDER_THREAD.id
        ? client.beta.threads.advance(params)
        : client.beta.threads.advanceById(currentThreadId, params));

      //handle tool calls
      while (advanceResponse.responseMessageDto.toolCallRequest) {
        updateThreadStatus(GenerationStage.FETCHING_CONTEXT);
        const toolCallResponse = await handleToolCall(
          advanceResponse.responseMessageDto,
          toolRegistry,
        );
        const toolCallResponseParams: TamboAI.Beta.Threads.ThreadAdvanceParams =
          {
            ...params,
            messageToAppend: {
              ...params.messageToAppend,
              content: [{ type: "text", text: "tool response" }],
              role: "tool",
              actionType: "tool_response",
              toolResponse: toolCallResponse,
              component: advanceResponse.responseMessageDto.component,
            },
          };
        updateThreadStatus(GenerationStage.HYDRATING_COMPONENT);
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
      updateThreadStatus(GenerationStage.COMPLETE);
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
      handleAdvanceStream,
    ],
  );

  return (
    <TamboThreadContext.Provider
      value={{
        thread: currentThread,
        switchCurrentThread,
        addThreadMessage,
        updateThreadMessage,
        setLastThreadStatus,
        inputValue,
        setInputValue,
        sendThreadMessage,
      }}
    >
      {children}
    </TamboThreadContext.Provider>
  );
};

export const useTamboThread = () => {
  const context = useContext(TamboThreadContext);
  if (context === undefined) {
    throw new Error("useTamboThread must be used within a TamboThreadProvider");
  }
  return context;
};
