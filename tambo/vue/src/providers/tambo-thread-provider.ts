import TamboAI, { advanceStream } from "@tambo-ai/typescript-sdk";
import { defineComponent, h, inject, provide, ref, computed } from "vue";
import { GenerationStage, isIdleStage, type TamboThreadMessage } from "../model/generate-component-response";
import { type TamboThread } from "../model/tambo-thread";
import { renderComponentIntoMessage } from "../util/generate-component";
import { getAvailableComponents, getUnassociatedTools, mapTamboToolToContextTool } from "../util/registry";
import { handleToolCall } from "../util/tool-caller";
import { TAMBO_CLIENT_CTX, TAMBO_CONTEXT_HELPERS_CTX, TAMBO_GEN_STAGE_CTX, TAMBO_REGISTRY_CTX, TAMBO_THREAD_CTX, type TamboGenerationStageContextProps, type TamboThreadContextProps } from "./injection-keys";

export const PLACEHOLDER_THREAD: TamboThread = {
  id: "placeholder",
  messages: [],
  createdAt: "",
  projectId: "",
  updatedAt: "",
  metadata: {},
};

export interface TamboThreadProviderProps { streaming?: boolean }

export const TamboThreadProvider = defineComponent<TamboThreadProviderProps>({
  name: "TamboThreadProvider",
  props: { streaming: { type: Boolean, required: false, default: true } },
  setup(props, { slots }) {
    const client = inject(TAMBO_CLIENT_CTX)!;
    const registry = inject(TAMBO_REGISTRY_CTX)!;
    const ctxHelpers = inject(TAMBO_CONTEXT_HELPERS_CTX)!;

    const threadMap = ref<Record<string, TamboThread>>({ [PLACEHOLDER_THREAD.id]: PLACEHOLDER_THREAD });
    const currentThreadId = ref<string>(PLACEHOLDER_THREAD.id);
    const ignoreResponse = ref(false);

    const currentThread = computed(() => threadMap.value[currentThreadId.value]);
    const currentGenerationStage = computed(
      () => (currentThread.value?.generationStage as GenerationStage) ?? GenerationStage.IDLE,
    );
    const currentStatusMessage = computed(() => currentThread.value?.statusMessage ?? "");

    const updateThreadStatus = (threadId: string, stage: GenerationStage, statusMessage?: string) => {
      threadMap.value = {
        ...threadMap.value,
        [threadId]: {
          ...threadMap.value[threadId],
          generationStage: stage,
          statusMessage,
        },
      };
    };

    const fetchThread = async (threadId: string, includeInternalMessages = true) => {
      const thread = await (client.client as TamboAI).beta.threads.retrieve(threadId, { includeInternal: includeInternalMessages });
      const cache = new Map<string, TamboThreadMessage>();
      currentThread.value?.messages.forEach((m) => cache.set(m.id, m));
      const withRendered = {
        ...thread,
        messages: thread.messages.map((message) => {
          if (cache.has(message.id)) return { ...cache.get(message.id)!, ...message } as any;
          if (message.component?.componentName) {
            return renderComponentIntoMessage(message, registry.componentList);
          }
          return message;
        }),
      } as TamboThread;
      threadMap.value = { ...threadMap.value, [threadId]: withRendered };
    };

    const addThreadMessage = async (
      message: TamboThreadMessage,
      sendToServer = true,
      createdAt: string = new Date().toISOString(),
    ) => {
      const threadId = message.threadId;
      const msgId = message.id;
      const chatMessage = { ...message, createdAt };
      threadMap.value = {
        ...threadMap.value,
        [threadId]: {
          ...threadMap.value[threadId],
          messages: (() => {
            const prev = threadMap.value[threadId]?.messages || [];
            const have = prev.find((m) => m.id === msgId);
            return have ? prev.map((m) => (m.id === msgId ? (chatMessage as any) : m)) : [...prev, (chatMessage as any)];
          })(),
        },
      };
      if (sendToServer) {
        await (client.client as TamboAI).beta.threads.messages.create(message.threadId, {
          content: message.content,
          role: message.role,
          additionalContext: (chatMessage as any).additionalContext,
        });
      }
      return threadMap.value[threadId]?.messages || [];
    };

    const updateThreadMessage = async (
      id: string,
      message: Partial<TamboThreadMessage> & { threadId: string },
      sendToServer = true,
      createdAt: string = new Date().toISOString(),
    ) => {
      const prev = threadMap.value[message.threadId]?.messages || [];
      const updated = prev.map((m) =>
        m.id === id
          ? ({
              ...m,
              ...message,
              id: m.id,
              createdAt: (message as any).createdAt ?? m.createdAt ?? createdAt,
            } as any)
          : m,
      );
      threadMap.value = {
        ...threadMap.value,
        [message.threadId]: { ...threadMap.value[message.threadId], messages: updated },
      };
      if (sendToServer && message.content && message.role) {
        await (client.client as TamboAI).beta.threads.messages.create(message.threadId, {
          content: message.content as any,
          role: message.role as any,
          additionalContext: (message as any).additionalContext,
        });
      }
    };

    const startNewThread = () => {
      currentThreadId.value = PLACEHOLDER_THREAD.id;
      threadMap.value = { ...threadMap.value, [PLACEHOLDER_THREAD.id]: PLACEHOLDER_THREAD };
    };

    const updateThreadName = async (name: string, threadId?: string) => {
      threadId ??= currentThreadId.value;
      if (!threadMap.value[threadId]) return;
      threadMap.value = {
        ...threadMap.value,
        [threadId]: { ...threadMap.value[threadId], name },
      };
      if (threadId !== PLACEHOLDER_THREAD.id) {
        const currentProject = await (client.client as TamboAI).beta.projects.getCurrent();
        await (client.client as TamboAI).beta.threads.update(threadId, { name, projectId: currentProject.id });
      }
    };

    const generateThreadName = async (threadId?: string) => {
      threadId ??= currentThreadId.value;
      if (threadId === PLACEHOLDER_THREAD.id) {
        console.warn("Cannot generate name for empty thread");
        return threadMap.value[threadId];
      }
      const generated = await (client.client as TamboAI).beta.threads.generateName(threadId);
      threadMap.value = {
        ...threadMap.value,
        [threadId]: { ...threadMap.value[threadId], name: (generated as any).name },
      };
      return generated;
    };

    const switchCurrentThread = async (threadId: string, fetch = true) => {
      if (threadId === PLACEHOLDER_THREAD.id) {
        console.warn("Switching to placeholder thread, may be a bug.");
        return;
      }
      currentThreadId.value = threadId;
      if (!threadMap.value[threadId]) {
        threadMap.value = {
          ...threadMap.value,
          [threadId]: { ...threadMap.value[PLACEHOLDER_THREAD.id], id: threadId },
        };
      }
      if (fetch) await fetchThread(threadId);
    };

    const cancel = async (threadId?: string) => {
      threadId ??= currentThreadId.value;
      const stage = (currentThread.value?.generationStage as GenerationStage) ?? GenerationStage.IDLE;
      if (isIdleStage(stage)) return;
      ignoreResponse.value = true;
      threadMap.value = {
        ...threadMap.value,
        [threadId]: {
          ...threadMap.value[threadId],
          generationStage: GenerationStage.CANCELLED,
          messages: threadMap.value[threadId].messages.map((m, idx, arr) => ({
            ...(m as any),
            isCancelled: m.id === arr[arr.length - 1].id ? true : (m as any).isCancelled,
          })),
        },
      };
      await (client.client as TamboAI).beta.threads.cancel(threadId);
    };

    const handleAdvanceStream = async (
      stream: AsyncIterable<TamboAI.Beta.Threads.ThreadAdvanceResponse>,
      params: TamboAI.Beta.Threads.ThreadAdvanceParams,
      threadId: string,
    ): Promise<TamboThreadMessage> => {
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
            chunk.responseMessageDto as any,
            registry.toolRegistry,
            registry.onCallUnregisteredTool as any,
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
            typeof toolCallResponse.result === "string" ? toolCallResponse.result : JSON.stringify(toolCallResponse.result);
          const toolCallResponseParams: TamboAI.Beta.Threads.ThreadAdvanceParams = {
            ...params,
            messageToAppend: {
              content: [{ type: "text", text: toolCallResponseString }],
              role: "tool",
              actionType: "tool_response",
              component: chunk.responseMessageDto.component,
              tool_call_id: chunk.responseMessageDto.tool_call_id,
              error: toolCallResponse.error,
            } as any,
          };
          await updateThreadMessage(chunk.responseMessageDto.id, { ...chunk.responseMessageDto, error: toolCallResponse.error } as any, false);
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
          const toolCallResponseStream = await advanceStream(client.client as any, toolCallResponseParams as any, chunk.responseMessageDto.threadId);
          return await handleAdvanceStream(toolCallResponseStream, toolCallResponseParams, chunk.responseMessageDto.threadId);
        } else {
          if (ignoreResponse.value) {
            ignoreResponse.value = false;
            return (
              (finalMessage as any) ?? {
                threadId,
                content: [{ type: "text", text: "" }],
                role: "assistant",
                createdAt: new Date().toISOString(),
                id: crypto.randomUUID(),
                componentState: {},
              }
            );
          }
          if (!hasSetThreadId && chunk.responseMessageDto.threadId && chunk.responseMessageDto.threadId !== currentThread.value?.id) {
            hasSetThreadId = true;
            await switchCurrentThread(chunk.responseMessageDto.threadId, false);
          }
          if (!finalMessage) {
            finalMessage = chunk.responseMessageDto.component?.componentName
              ? renderComponentIntoMessage(chunk.responseMessageDto as any, registry.componentList)
              : (chunk.responseMessageDto as any);
            await addThreadMessage(finalMessage as any, false);
          } else {
            const isNew = chunk.responseMessageDto.id !== (finalMessage as any).id;
            finalMessage = chunk.responseMessageDto.component?.componentName
              ? renderComponentIntoMessage(chunk.responseMessageDto as any, registry.componentList)
              : (chunk.responseMessageDto as any);
            if (isNew) await addThreadMessage(finalMessage as any, false);
            else await updateThreadMessage((finalMessage as any).id, finalMessage as any, false);
          }
        }
      }
      updateThreadStatus((finalMessage as any)?.threadId ?? threadId, GenerationStage.COMPLETE);
      return (
        (finalMessage as any) ?? {
          threadId: "",
          content: [{ type: "text", text: `Error processing stream` }],
          role: "assistant",
          createdAt: new Date().toISOString(),
          id: crypto.randomUUID(),
          componentState: {},
        }
      );
    };

    const sendThreadMessage: TamboThreadContextProps["sendThreadMessage"] = async (
      message,
      options = {},
    ) => {
      ignoreResponse.value = false;
      const {
        threadId = currentThreadId.value ?? PLACEHOLDER_THREAD.id,
        streamResponse = props.streaming,
        forceToolChoice,
        contextKey,
        additionalContext,
        content,
      } = options;
      updateThreadStatus(threadId, GenerationStage.FETCHING_CONTEXT);
      const helperContexts = await ctxHelpers.getAdditionalContext();
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
        registry.componentList,
        registry.toolRegistry,
        registry.componentToolAssociations,
      );
      const unassociatedTools = getUnassociatedTools(
        registry.toolRegistry,
        registry.componentToolAssociations,
      );
      const toolCallCounts: Record<string, number> = {};
      const params: TamboAI.Beta.Threads.ThreadAdvanceParams = {
        messageToAppend: { content: messageContent as any, role: "user", additionalContext: combinedContext } as any,
        contextKey,
        availableComponents,
        clientTools: unassociatedTools.map((t) => mapTamboToolToContextTool(t)),
        forceToolChoice,
        toolCallCounts,
      };
      if (streamResponse) {
        let advanceStreamResponse: AsyncIterable<TamboAI.Beta.Threads.ThreadAdvanceResponse>;
        try {
          advanceStreamResponse = await advanceStream(
            client.client as any,
            params,
            threadId === PLACEHOLDER_THREAD.id ? (undefined as any) : threadId,
          );
        } catch (error) {
          updateThreadStatus(threadId, GenerationStage.ERROR);
          throw error;
        }
        try {
          return await handleAdvanceStream(advanceStreamResponse, params, threadId);
        } catch (error) {
          updateThreadStatus(threadId, GenerationStage.ERROR);
          throw error;
        }
      }
      let advanceResponse: TamboAI.Beta.Threads.ThreadAdvanceResponse;
      try {
        advanceResponse = await (threadId === PLACEHOLDER_THREAD.id
          ? (client.client as TamboAI).beta.threads.advance(params)
          : (client.client as TamboAI).beta.threads.advanceById(threadId, params));
      } catch (error) {
        updateThreadStatus(threadId, GenerationStage.ERROR);
        throw error;
      }
      try {
        while (advanceResponse.responseMessageDto.toolCallRequest) {
          const toolName = advanceResponse.responseMessageDto.toolCallRequest.toolName;
          if (toolName) toolCallCounts[toolName] = (toolCallCounts[toolName] || 0) + 1;
          updateThreadStatus(threadId, GenerationStage.FETCHING_CONTEXT);
          const toolCallResponse = await handleToolCall(
            advanceResponse.responseMessageDto as any,
            registry.toolRegistry,
            registry.onCallUnregisteredTool as any,
          );
          const toolResponseString =
            typeof toolCallResponse.result === "string" ? toolCallResponse.result : JSON.stringify(toolCallResponse.result);
          const toolCallResponseParams: TamboAI.Beta.Threads.ThreadAdvanceParams = {
            ...params,
            messageToAppend: {
              ...(params.messageToAppend as any),
              content: [{ type: "text", text: toolResponseString }],
              role: "tool",
              actionType: "tool_response",
              component: advanceResponse.responseMessageDto.component as any,
              tool_call_id: advanceResponse.responseMessageDto.tool_call_id as any,
              error: toolCallResponse.error,
            } as any,
          };
          if (toolCallResponse.error) {
            const toolCallMessage = { ...advanceResponse.responseMessageDto, error: toolCallResponse.error } as any;
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
              tool_call_id: advanceResponse.responseMessageDto.tool_call_id as any,
              error: toolCallResponse.error,
            } as any,
            false,
          );
          advanceResponse = await (client.client as TamboAI).beta.threads.advanceById(
            advanceResponse.responseMessageDto.threadId,
            toolCallResponseParams,
          );
        }
      } catch (error) {
        updateThreadStatus(advanceResponse.responseMessageDto.threadId, GenerationStage.ERROR);
        throw error;
      }
      const finalMessage = advanceResponse.responseMessageDto.component?.componentName
        ? renderComponentIntoMessage(advanceResponse.responseMessageDto as any, registry.componentList)
        : (advanceResponse.responseMessageDto as any);
      await switchCurrentThread(advanceResponse.responseMessageDto.threadId);
      updateThreadStatus(advanceResponse.responseMessageDto.threadId, GenerationStage.COMPLETE);
      return finalMessage as any;
    };

    const threadCtx: TamboThreadContextProps = {
      thread: currentThread.value as any,
      switchCurrentThread,
      startNewThread,
      updateThreadName,
      generateThreadName: generateThreadName as any,
      addThreadMessage: addThreadMessage as any,
      updateThreadMessage: updateThreadMessage as any,
      streaming: props.streaming,
      cancel,
      sendThreadMessage,
    };

    provide(TAMBO_THREAD_CTX, threadCtx as any);

    const genStageCtx: TamboGenerationStageContextProps = {
      generationStage: currentGenerationStage.value,
      generationStatusMessage: currentStatusMessage.value,
      isIdle: isIdleStage(currentGenerationStage.value),
    } as any;
    provide(TAMBO_GEN_STAGE_CTX, genStageCtx);

    return () => (slots.default ? slots.default() : h("div"));
  },
});

export function useTamboThread() {
  const threadCtx = inject(TAMBO_THREAD_CTX);
  const genCtx = inject(TAMBO_GEN_STAGE_CTX);
  if (!threadCtx || !genCtx) throw new Error("useTamboThread must be used within a TamboThreadProvider");
  return { ...threadCtx, ...genCtx } as any;
}

export function useTamboGenerationStage() {
  const genCtx = inject(TAMBO_GEN_STAGE_CTX);
  if (!genCtx) throw new Error("useTamboGenerationStage must be used within a TamboThreadProvider");
  return genCtx;
}

