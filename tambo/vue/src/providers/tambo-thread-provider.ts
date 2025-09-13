import TamboAI, { advanceStream } from "@tambo-ai/typescript-sdk";
import { Thread } from "@tambo-ai/typescript-sdk/resources/beta/threads/threads";
import { InjectionKey, computed, inject, provide, reactive, ref } from "vue";
import { GenerationStage, TamboThreadMessage } from "../model/generate-component-response";
import { TamboThread } from "../model/tambo-thread";
import { renderComponentIntoMessage } from "../util/generate-component";
import { getAvailableComponents, getUnassociatedTools, mapTamboToolToContextTool } from "../util/registry";
import { handleToolCall } from "../util/tool-caller";
import { useTamboClient } from "./tambo-client-provider";
import { useTamboContextHelpers } from "./tambo-context-helpers-provider";
import { useTamboRegistry } from "./tambo-registry-provider";

export interface TamboGenerationStageContextProps {
  generationStage: GenerationStage;
  generationStatusMessage: string;
  isIdle: boolean;
}

export interface TamboThreadContextProps {
  thread: TamboThread;
  switchCurrentThread: (threadId: string, fetch?: boolean) => Promise<void> | void;
  startNewThread: () => void;
  updateThreadName: (name: string, threadId?: string) => Promise<void>;
  generateThreadName: (threadId?: string) => Promise<Thread>;
  addThreadMessage: (
    message: TamboThreadMessage,
    sendToServer: boolean,
  ) => Promise<TamboAI.Beta.Threads.ThreadMessage[]>;
  updateThreadMessage: (
    id: string,
    message: Partial<TamboThreadMessage> & { threadId: string },
    sendToServer: boolean,
  ) => Promise<void>;
  cancel: (threadId?: string) => Promise<void>;
  streaming: boolean;
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
}

export interface CombinedTamboThreadContextProps
  extends TamboThreadContextProps,
    TamboGenerationStageContextProps {}

export const PLACEHOLDER_THREAD: TamboThread = {
  id: "placeholder",
  messages: [],
  createdAt: "",
  projectId: "",
  updatedAt: "",
  metadata: {},
};

export const TamboThreadKey: InjectionKey<TamboThreadContextProps> = Symbol("TamboThreadContext");
export const TamboGenerationStageKey: InjectionKey<TamboGenerationStageContextProps> = Symbol("TamboGenerationStageContext");

export interface TamboThreadProviderProps { streaming?: boolean }

export function createTamboThreadContext(props: TamboThreadProviderProps = {}) {
  const streaming = props.streaming ?? true;
  const threadMap = reactive<Record<string, TamboThread>>({ [PLACEHOLDER_THREAD.id]: PLACEHOLDER_THREAD });
  const client = useTamboClient();
  const { componentList, toolRegistry, componentToolAssociations, onCallUnregisteredTool } = useTamboRegistry();
  const { getAdditionalContext } = useTamboContextHelpers();
  const ignoreResponse = ref(false);
  const currentThreadId = ref<string>(PLACEHOLDER_THREAD.id);

  const currentThread = computed(() => threadMap[currentThreadId.value]);
  const currentGenerationStage = computed(
    () => (currentThread.value?.generationStage as GenerationStage) ?? GenerationStage.IDLE,
  );
  const currentStatusMessage = computed(() => currentThread.value?.statusMessage ?? "");
  const isIdle = computed(() => [
    GenerationStage.IDLE,
    GenerationStage.COMPLETE,
    GenerationStage.ERROR,
    GenerationStage.CANCELLED,
  ].includes(currentGenerationStage.value));

  async function fetchThread(threadId: string, includeInternalMessages = true) {
    const thread = await client.beta.threads.retrieve(threadId, { includeInternal: includeInternalMessages });
    const messageCache = new Map<string, TamboThreadMessage>();
    const existing = threadMap[threadId];
    if (existing) {
      for (const message of existing.messages) messageCache.set(message.id, message);
    }
    const threadWithRenderedComponents: TamboThread = {
      ...thread,
      messages: thread.messages.map((message) => {
        const cached = messageCache.get(message.id);
        if (cached) return { ...cached, ...message };
        if (message.component?.componentName) {
          return renderComponentIntoMessage(message, componentList);
        }
        return message as any;
      }),
    } as any;
    threadMap[threadId] = threadWithRenderedComponents;
  }

  async function addThreadMessage(
    message: TamboThreadMessage,
    sendToServer = true,
    createdAt: string = new Date().toISOString(),
  ) {
    const threadId = message.threadId;
    const messageId = message.id;
    const chatMessage: TamboThreadMessage = { ...message, createdAt };
    if (!threadId) return [];
    const prevMessages = threadMap[threadId]?.messages || [];
    const haveMessage = prevMessages.find((m) => m.id === messageId);
    const updatedMessages = haveMessage
      ? prevMessages.map((m) => (m.id === messageId ? chatMessage : m))
      : [...prevMessages, chatMessage];
    threadMap[threadId] = { ...(threadMap[threadId] || ({} as any)), messages: updatedMessages } as any;
    if (sendToServer) {
      await client.beta.threads.messages.create(message.threadId, {
        content: message.content,
        role: message.role,
        additionalContext: chatMessage.additionalContext,
      });
    }
    return threadMap[threadId]?.messages || [];
  }

  async function updateThreadMessage(
    id: string,
    message: Partial<TamboThreadMessage> & { threadId: string },
    sendToServer = true,
    createdAt: string = new Date().toISOString(),
  ) {
    const prevMessages = threadMap[message.threadId]?.messages || [];
    const updatedMessages = prevMessages.map((msg) =>
      msg.id === id
        ? ({
            ...msg,
            ...message,
            id: msg.id,
            createdAt: (message as any).createdAt ?? msg.createdAt ?? createdAt,
          } as TamboThreadMessage)
        : msg,
    );
    threadMap[message.threadId] = { ...(threadMap[message.threadId] as any), messages: updatedMessages } as any;
    if (sendToServer && message.content && message.role) {
      await client.beta.threads.messages.create(message.threadId, {
        content: message.content,
        role: message.role,
        additionalContext: message.additionalContext,
      });
    }
  }

  function startNewThread() {
    currentThreadId.value = PLACEHOLDER_THREAD.id;
    threadMap[PLACEHOLDER_THREAD.id] = PLACEHOLDER_THREAD;
  }

  async function updateThreadName(name: string, threadId?: string) {
    const id = threadId ?? currentThreadId.value;
    if (!threadMap[id]) return;
    threadMap[id] = { ...threadMap[id], name } as any;
    if (id !== PLACEHOLDER_THREAD.id) {
      const currentProject = await client.beta.projects.getCurrent();
      await client.beta.threads.update(id, { name, projectId: currentProject.id });
    }
  }

  async function generateThreadName(threadId?: string) {
    const id = threadId ?? currentThreadId.value;
    if (id === PLACEHOLDER_THREAD.id) {
      console.warn("Cannot generate name for empty thread");
      return threadMap[id] as any;
    }
    const threadWithGeneratedName = await client.beta.threads.generateName(id);
    if (!threadMap[id]) return threadWithGeneratedName as any;
    threadMap[id] = { ...threadMap[id], name: threadWithGeneratedName.name } as any;
    return threadWithGeneratedName as any;
  }

  async function switchCurrentThread(threadId: string, fetch = true) {
    if (threadId === PLACEHOLDER_THREAD.id) {
      console.warn("Switching to placeholder thread, may be a bug.");
      return;
    }
    currentThreadId.value = threadId;
    if (!threadMap[threadId]) {
      threadMap[threadId] = { ...threadMap[PLACEHOLDER_THREAD.id], id: threadId } as any;
    }
    if (fetch) await fetchThread(threadId);
  }

  function updateThreadStatus(threadId: string, stage: GenerationStage, statusMessage?: string) {
    const cur = threadMap[threadId] || ({} as any);
    threadMap[threadId] = { ...cur, generationStage: stage, statusMessage } as any;
  }

  async function cancel(threadId?: string) {
    const id = threadId ?? currentThreadId.value;
    const stage = (currentThread.value?.generationStage as GenerationStage) ?? GenerationStage.IDLE;
    if ([GenerationStage.IDLE, GenerationStage.COMPLETE, GenerationStage.ERROR, GenerationStage.CANCELLED].includes(stage)) {
      return;
    }
    ignoreResponse.value = true;
    const thread = threadMap[id];
    if (thread) {
      threadMap[id] = {
        ...thread,
        generationStage: GenerationStage.CANCELLED,
        messages: thread.messages.map((m, idx, arr) =>
          m.id === arr[arr.length - 1].id ? ({ ...m, isCancelled: true } as any) : m,
        ),
      } as any;
    }
    await client.beta.threads.cancel(id);
  }

  async function handleAdvanceStreamVue(
    stream: AsyncIterable<TamboAI.Beta.Threads.ThreadAdvanceResponse>,
    params: TamboAI.Beta.Threads.ThreadAdvanceParams,
    threadId: string,
  ): Promise<TamboThreadMessage> {
    if (ignoreResponse.value) {
      ignoreResponse.value = false;
      return {
        threadId,
        content: [{ type: "text", text: "" }],
        role: "assistant",
        createdAt: new Date().toISOString(),
        id: crypto.randomUUID(),
        componentState: {},
      } as any;
    }
    let finalMessage: Readonly<TamboThreadMessage> | undefined;
    let hasSetThreadId = false;
    updateThreadStatus(threadId, GenerationStage.STREAMING_RESPONSE);
    for await (const chunk of stream) {
      if (chunk.responseMessageDto.toolCallRequest) {
        const toolName = chunk.responseMessageDto.toolCallRequest.toolName;
        if (toolName && params.toolCallCounts) params.toolCallCounts[toolName] = (params.toolCallCounts[toolName] ?? 0) + 1;
        updateThreadStatus(chunk.responseMessageDto.threadId, GenerationStage.FETCHING_CONTEXT);
        await updateThreadMessage(chunk.responseMessageDto.id, { ...chunk.responseMessageDto } as any, false);
        const toolCallResponse = await handleToolCall(
          chunk.responseMessageDto,
          useTamboRegistry().toolRegistry,
          onCallUnregisteredTool,
        );
        if (ignoreResponse.value) {
          ignoreResponse.value = false;
          return {
            threadId,
            content: [{ type: "text", text: "" }],
            role: "assistant",
            createdAt: new Date().toISOString(),
            id: crypto.randomUUID(),
            componentState: {},
          } as any;
        }
        const toolCallResponseString =
          typeof toolCallResponse.result === "string"
            ? toolCallResponse.result
            : JSON.stringify(toolCallResponse.result);
        const toolCallResponseParams: TamboAI.Beta.Threads.ThreadAdvanceParams = {
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
        await updateThreadMessage(
          chunk.responseMessageDto.id,
          { ...chunk.responseMessageDto, error: toolCallResponse.error } as any,
          false,
        );
        await addThreadMessage(
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
          } as any,
          false,
        );
        updateThreadStatus(chunk.responseMessageDto.threadId, GenerationStage.STREAMING_RESPONSE);
        const toolCallResponseStream = await advanceStream(
          client,
          toolCallResponseParams,
          chunk.responseMessageDto.threadId,
        );
        return await handleAdvanceStreamVue(
          toolCallResponseStream,
          toolCallResponseParams,
          chunk.responseMessageDto.threadId,
        );
      } else {
        if (ignoreResponse.value) {
          ignoreResponse.value = false;
          return (
            finalMessage ??
            ({
              threadId,
              content: [{ type: "text", text: "" }],
              role: "assistant",
              createdAt: new Date().toISOString(),
              id: crypto.randomUUID(),
              componentState: {},
            } as any)
          );
        }
        if (!hasSetThreadId && chunk.responseMessageDto.threadId && chunk.responseMessageDto.threadId !== currentThread.value?.id) {
          hasSetThreadId = true;
          await switchCurrentThread(chunk.responseMessageDto.threadId, false);
        }
        if (!finalMessage) {
          finalMessage = chunk.responseMessageDto.component?.componentName
            ? renderComponentIntoMessage(chunk.responseMessageDto, componentList)
            : (chunk.responseMessageDto as any);
          await addThreadMessage(finalMessage, false);
        } else {
          const isNewMessage = chunk.responseMessageDto.id !== finalMessage.id;
          finalMessage = chunk.responseMessageDto.component?.componentName
            ? renderComponentIntoMessage(chunk.responseMessageDto, componentList)
            : (chunk.responseMessageDto as any);
          if (isNewMessage) await addThreadMessage(finalMessage, false);
          else await updateThreadMessage(finalMessage.id, finalMessage as any, false);
        }
      }
    }
    updateThreadStatus(finalMessage?.threadId ?? threadId, GenerationStage.COMPLETE);
    return (
      finalMessage ??
      ({
        threadId: "",
        content: [{ type: "text", text: `Error processing stream` }],
        role: "assistant",
        createdAt: new Date().toISOString(),
        id: crypto.randomUUID(),
        componentState: {},
      } as any)
    );
  }

  async function sendThreadMessage(
    message: string,
    options: {
      threadId?: string;
      streamResponse?: boolean;
      forceToolChoice?: string;
      contextKey?: string;
      additionalContext?: Record<string, any>;
      content?: TamboAI.Beta.Threads.ChatCompletionContentPart[];
    } = {},
  ): Promise<TamboThreadMessage> {
    ignoreResponse.value = false;
    const {
      threadId = currentThreadId.value ?? PLACEHOLDER_THREAD.id,
      streamResponse = streaming,
      forceToolChoice,
      contextKey,
      additionalContext,
      content,
    } = options;
    updateThreadStatus(threadId, GenerationStage.FETCHING_CONTEXT);
    const helperContexts = await getAdditionalContext();
    const combinedContext: Record<string, any> = { ...(additionalContext ?? {}) };
    for (const helperContext of helperContexts) combinedContext[helperContext.name] = helperContext.context;
    const messageContent = content ?? [{ type: "text" as const, text: message }];
    addThreadMessage(
      {
        content: messageContent as any,
        renderedComponent: null,
        role: "user",
        threadId,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        componentState: {},
        additionalContext: combinedContext,
      } as any,
      false,
    );
    const availableComponents = getAvailableComponents(
      componentList,
      toolRegistry,
      componentToolAssociations,
    );
    const unassociatedTools = getUnassociatedTools(toolRegistry, componentToolAssociations);
    const toolCallCounts: Record<string, number> = {};
    const params: TamboAI.Beta.Threads.ThreadAdvanceParams = {
      messageToAppend: { content: messageContent as any, role: "user", additionalContext: combinedContext },
      contextKey,
      availableComponents,
      clientTools: unassociatedTools.map((tool) => mapTamboToolToContextTool(tool)),
      forceToolChoice,
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
        throw error as any;
      }
      try {
        return await handleAdvanceStreamVue(advanceStreamResponse, params, threadId);
      } catch (error) {
        updateThreadStatus(threadId, GenerationStage.ERROR);
        throw error as any;
      }
    }
    let advanceResponse: TamboAI.Beta.Threads.ThreadAdvanceResponse;
    try {
      advanceResponse = await (threadId === PLACEHOLDER_THREAD.id
        ? (client.beta.threads.advance(params) as any)
        : (client.beta.threads.advanceById(threadId, params) as any));
    } catch (error) {
      updateThreadStatus(threadId, GenerationStage.ERROR);
      throw error as any;
    }
    try {
      while (advanceResponse.responseMessageDto.toolCallRequest) {
        const toolName = advanceResponse.responseMessageDto.toolCallRequest.toolName;
        if (toolName) toolCallCounts[toolName] = (toolCallCounts[toolName] || 0) + 1;
        updateThreadStatus(threadId, GenerationStage.FETCHING_CONTEXT);
        const toolCallResponse = await handleToolCall(
          advanceResponse.responseMessageDto,
          useTamboRegistry().toolRegistry,
          onCallUnregisteredTool,
        );
        const toolResponseString =
          typeof toolCallResponse.result === "string"
            ? toolCallResponse.result
            : JSON.stringify(toolCallResponse.result);
        const toolCallResponseParams: TamboAI.Beta.Threads.ThreadAdvanceParams = {
          ...params,
          messageToAppend: {
            ...(params.messageToAppend as any),
            content: [{ type: "text", text: toolResponseString }],
            role: "tool",
            actionType: "tool_response",
            component: advanceResponse.responseMessageDto.component,
            tool_call_id: advanceResponse.responseMessageDto.tool_call_id,
            error: toolCallResponse.error,
          },
        };
        if (toolCallResponse.error) {
          const toolCallMessage = {
            ...advanceResponse.responseMessageDto,
            error: toolCallResponse.error,
          } as any;
          await updateThreadMessage(toolCallMessage.id, toolCallMessage, false);
        }
        updateThreadStatus(threadId, GenerationStage.HYDRATING_COMPONENT);
        await addThreadMessage(
          {
            threadId,
            content: [{ type: "text", text: toolResponseString }],
            role: "tool",
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            componentState: {},
            actionType: "tool_response",
            tool_call_id: advanceResponse.responseMessageDto.tool_call_id,
            error: toolCallResponse.error,
          } as any,
          false,
        );
        advanceResponse = (await client.beta.threads.advanceById(
          (advanceResponse as any).responseMessageDto.threadId,
          toolCallResponseParams,
        )) as any;
      }
    } catch (error) {
      updateThreadStatus((advanceResponse as any).responseMessageDto.threadId, GenerationStage.ERROR);
      throw error as any;
    }

    const finalMessage = (advanceResponse as any).responseMessageDto.component?.componentName
      ? renderComponentIntoMessage((advanceResponse as any).responseMessageDto, componentList)
      : ((advanceResponse as any).responseMessageDto as any);
    await switchCurrentThread((advanceResponse as any).responseMessageDto.threadId);
    updateThreadStatus((advanceResponse as any).responseMessageDto.threadId, GenerationStage.COMPLETE);
    return finalMessage as any;
  }

  const threadCtx: TamboThreadContextProps = {
    get thread() {
      return currentThread.value as any;
    },
    switchCurrentThread,
    startNewThread,
    updateThreadName: async (name: string, threadId?: string) => {
      await updateThreadName(name, threadId);
    },
    generateThreadName: async (threadId?: string) => {
      return await generateThreadName(threadId);
    },
    addThreadMessage,
    updateThreadMessage,
    streaming,
    cancel,
    sendThreadMessage,
  };

  const generationCtx: TamboGenerationStageContextProps = {
    get generationStage() {
      return currentGenerationStage.value;
    },
    get generationStatusMessage() {
      return currentStatusMessage.value;
    },
    get isIdle() {
      return isIdle.value;
    },
  } as any;

  return { threadCtx, generationCtx };
}

export function provideTamboThread(props: TamboThreadProviderProps = {}) {
  const { threadCtx, generationCtx } = createTamboThreadContext(props);
  provide(TamboThreadKey, threadCtx);
  provide(TamboGenerationStageKey, generationCtx);
  return threadCtx;
}

export function useTamboGenerationStage(): TamboGenerationStageContextProps {
  const ctx = inject(TamboGenerationStageKey);
  if (!ctx) throw new Error("useTamboGenerationStage must be used after provideTamboThread");
  return ctx;
}

export function useTamboThread(): CombinedTamboThreadContextProps {
  const threadCtx = inject(TamboThreadKey);
  const stageCtx = inject(TamboGenerationStageKey);
  if (!threadCtx || !stageCtx) {
    throw new Error("useTamboThread must be used after provideTamboThread");
  }
  return { ...(threadCtx as any), ...(stageCtx as any) } as CombinedTamboThreadContextProps;
}

