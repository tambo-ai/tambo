import TamboAI, { advanceStream } from "@tambo-ai/typescript-sdk";
import type {
  TamboThread,
  TamboThreadMessage,
  GenerationStage,
  TamboTool,
  ContentPart,
  StagedImage,
  ContextHelpers,
  AdditionalContext,
} from "../types.js";
import type { RegistryStore } from "./registry.svelte.js";

/**
 * Options for creating a thread store
 */
export interface ThreadStoreOptions {
  client: TamboAI;
  contextKey?: string;
  streaming?: boolean;
  autoGenerateThreadName?: boolean;
  autoGenerateNameThreshold?: number;
  contextHelpers?: ContextHelpers;
}

/**
 * Placeholder thread used before a real thread is created
 */
const PLACEHOLDER_THREAD_ID = "placeholder";

/**
 * Extract text content from SDK content array
 */
function extractText(content: unknown[] | undefined): string {
  if (!content || !Array.isArray(content)) return "";
  return content
    .filter(
      (c): c is { type: string; text: string } =>
        typeof c === "object" &&
        c !== null &&
        "type" in c &&
        (c as Record<string, unknown>).type === "text",
    )
    .map((c) => c.text || "")
    .join("");
}

/**
 * Convert SDK ThreadMessage to TamboThreadMessage
 */
function convertMessage(
  msg: TamboAI.Beta.Threads.ThreadMessage,
): TamboThreadMessage {
  return {
    id: msg.id,
    threadId: msg.threadId,
    role: msg.role as TamboThreadMessage["role"],
    content: extractText(msg.content as unknown[]) || null,
    createdAt: msg.createdAt,
    reasoning: msg.reasoning,
    reasoningDurationMS: msg.reasoningDurationMS,
    isCancelled: msg.isCancelled,
    error: msg.error,
    parentMessageId: msg.parentMessageId,
    componentState: msg.componentState ?? {},
    toolCallRequest: msg.toolCallRequest
      ? {
          toolName: msg.toolCallRequest.toolName,
          parameters: msg.toolCallRequest.parameters,
        }
      : undefined,
    component: msg.component
      ? {
          name: msg.component.componentName ?? undefined,
          props: (msg.component.props ?? {}) as Record<string, unknown>,
          statusMessage: msg.component.statusMessage,
          completionStatusMessage: msg.component.completionStatusMessage,
          toolCallRequest: msg.component.toolCallRequest
            ? {
                toolName: msg.component.toolCallRequest.toolName,
                parameters: msg.component.toolCallRequest.parameters,
              }
            : undefined,
        }
      : undefined,
  };
}

/**
 * Convert tool result to string for content
 */
function toText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return JSON.stringify(value);
}

/**
 * Thread store interface
 */
export interface ThreadStore {
  readonly thread: TamboThread | null;
  readonly threads: TamboThread[];
  readonly generationStage: GenerationStage;
  readonly statusMessage: string;
  readonly error: Error | null;
  readonly isLoading: boolean;
  readonly isIdle: boolean;
  readonly messages: TamboThreadMessage[];
  readonly currentThreadId: string | undefined;
  startNewThread(contextKey?: string): TamboThread;
  switchThread(threadId: string): Promise<void>;
  fetchThreads(contextKey?: string): Promise<TamboThread[]>;
  updateThreadName(newName: string, threadId?: string): Promise<void>;
  generateThreadName(threadId?: string): Promise<void>;
  sendMessage(
    content: string,
    images?: StagedImage[],
    options?: SendMessageOptions,
  ): Promise<TamboThreadMessage>;
  cancel(): Promise<void>;
  clearThread(): void;
  updateThreadMessage(
    messageId: string,
    update: Partial<TamboThreadMessage>,
    sendToServer?: boolean,
  ): void;
}

export interface SendMessageOptions {
  streamResponse?: boolean;
  forceToolChoice?: string;
  additionalContext?: Record<string, unknown>;
}

/**
 * Create a thread store with Svelte 5 runes
 *
 * IMPORTANT: This store requires a TamboAI client instance to be passed in.
 * The client should be created via createTamboClient() and passed through context.
 * Do NOT use a module-level singleton client - this breaks SSR.
 * @param options - Thread store options including the client
 * @param registryStore - Registry store for components and tools
 * @returns Thread store with reactive state and methods
 */
export function createThreadStore(
  options: ThreadStoreOptions,
  registryStore: RegistryStore,
): ThreadStore {
  const {
    client,
    contextKey: defaultContextKey,
    autoGenerateThreadName = true,
    autoGenerateNameThreshold = 3,
    contextHelpers = {},
  } = options;

  // State
  let thread = $state<TamboThread | null>(null);
  let threads = $state<TamboThread[]>([]);
  let generationStage = $state<GenerationStage>("idle");
  let statusMessage = $state("");
  let error = $state<Error | null>(null);
  let isLoading = $state(false);

  // Abort controller for current stream - critical for proper cancellation
  let currentAbortController = $state<AbortController | null>(null);

  // Derived state
  const isIdle = $derived(
    generationStage === "idle" || generationStage === "completed",
  );
  const messages = $derived(thread?.messages ?? []);
  const currentThreadId = $derived(thread?.id);

  /**
   * Upsert a message in the current thread
   */
  function upsertMessage(message: TamboThreadMessage): void {
    if (!thread) return;
    const idx = thread.messages.findIndex((m) => m.id === message.id);
    if (idx >= 0) {
      thread.messages[idx] = message;
    } else {
      thread.messages = [...thread.messages, message];
    }
  }

  /**
   * Get additional context from context helpers
   */
  async function getAdditionalContext(): Promise<AdditionalContext[]> {
    const contexts: AdditionalContext[] = [];
    for (const [name, helper] of Object.entries(contextHelpers)) {
      try {
        const context = await helper();
        if (context != null) {
          contexts.push({ name, context });
        }
      } catch (err) {
        console.warn(`Context helper "${name}" failed:`, err);
      }
    }
    return contexts;
  }

  /**
   * Execute a tool call
   */
  async function executeToolCall(
    toolCallRequest: TamboAI.ToolCallRequest,
  ): Promise<{ result: unknown; error?: string; tamboTool?: TamboTool }> {
    const tool = registryStore.getTool(toolCallRequest.toolName);
    if (!tool) {
      return {
        result: null,
        error: `Tool not found: ${toolCallRequest.toolName}`,
      };
    }

    const args: Record<string, unknown> = {};
    for (const p of toolCallRequest.parameters ?? []) {
      args[p.parameterName] = p.parameterValue;
    }

    try {
      const result = await tool.tool(args);
      return { result, tamboTool: tool };
    } catch (err) {
      return {
        result: null,
        error: err instanceof Error ? err.message : String(err),
        tamboTool: tool,
      };
    }
  }

  /**
   * Convert tool response to content parts
   */
  async function convertToolResponse(toolCallResponse: {
    result: unknown;
    error?: string;
    tamboTool?: TamboTool;
  }): Promise<TamboAI.Beta.Threads.ChatCompletionContentPart[]> {
    if (toolCallResponse.error) {
      return [{ type: "text", text: toText(toolCallResponse.result) }];
    }

    if (toolCallResponse.tamboTool?.transformToContent) {
      return await toolCallResponse.tamboTool.transformToContent(
        toolCallResponse.result,
      );
    }

    return [{ type: "text", text: toText(toolCallResponse.result) }];
  }

  /**
   * Generate thread name (internal implementation)
   */
  async function doGenerateThreadName(threadId?: string): Promise<void> {
    const id = threadId ?? thread?.id;
    if (!id) throw new Error("No thread ID provided");
    if (id.startsWith("placeholder")) {
      console.warn("Cannot generate name for placeholder thread");
      return;
    }

    const response = await client.beta.threads.generateName(id);

    if (thread && thread.id === id && response.name) {
      thread.name = response.name;
    }

    const idx = threads.findIndex((t) => t.id === id);
    if (idx >= 0 && response.name) {
      threads[idx] = { ...threads[idx], name: response.name };
    }
  }

  /**
   * Maybe auto-generate thread name based on threshold
   */
  function maybeAutoGenerateThreadName(threadId: string): void {
    if (!autoGenerateThreadName || !autoGenerateNameThreshold) return;
    if (
      threadId === PLACEHOLDER_THREAD_ID ||
      threadId.startsWith("placeholder")
    )
      return;

    const currentThread = thread;
    if (!currentThread || currentThread.id !== threadId) return;

    const messageCount = currentThread.messages.length;
    if (!currentThread.name && messageCount >= autoGenerateNameThreshold) {
      void doGenerateThreadName(threadId).catch((err: unknown) => {
        console.error("Failed to auto-generate thread name:", err);
      });
    }
  }

  /**
   * Handle the advance stream with proper abort handling
   */
  async function handleAdvanceStream(
    stream: AsyncIterable<TamboAI.Beta.Threads.ThreadAdvanceResponse>,
    params: TamboAI.Beta.Threads.ThreadAdvanceByIDParams,
    abortController: AbortController,
  ): Promise<TamboThreadMessage> {
    let finalMessage: TamboThreadMessage | null = null;
    let resolvedThreadId: string | undefined;

    try {
      for await (const chunk of stream) {
        // Check abort signal on each iteration
        if (abortController.signal.aborted) {
          if (finalMessage) {
            finalMessage.isCancelled = true;
            upsertMessage(finalMessage);
          }
          generationStage = "idle";
          return finalMessage ?? createEmptyMessage(resolvedThreadId ?? "");
        }

        // Update generation stage based on server response
        const stage = chunk.generationStage;
        if (stage === "STREAMING_RESPONSE") {
          generationStage = "generating";
        } else if (stage === "FETCHING_CONTEXT") {
          generationStage = "tool_calling";
        } else if (
          stage === "CHOOSING_COMPONENT" ||
          stage === "HYDRATING_COMPONENT"
        ) {
          generationStage = "thinking";
        } else if (stage === "COMPLETE") {
          generationStage = "completed";
        } else if (stage === "ERROR") {
          generationStage = "error";
        }

        // Update status message if provided
        if (chunk.statusMessage) {
          statusMessage = chunk.statusMessage;
        }

        const responseMsg = chunk.responseMessageDto;
        if (!responseMsg) continue;

        // Handle thread ID assignment on first response
        if (!resolvedThreadId && responseMsg.threadId) {
          resolvedThreadId = responseMsg.threadId;
          if (!thread || thread.id !== resolvedThreadId) {
            const existingMessages = thread?.messages ?? [];
            thread = {
              id: resolvedThreadId,
              name: undefined,
              createdAt: new Date().toISOString(),
              contextKey: defaultContextKey,
              messages: existingMessages,
            };
          }
        }

        // Handle tool call requests
        if (responseMsg.toolCallRequest) {
          generationStage = "tool_calling";

          // Update message showing tool call
          const toolCallMessage = convertMessage(responseMsg);
          upsertMessage(toolCallMessage);
          finalMessage = toolCallMessage;

          // Execute the tool
          const toolResult = await executeToolCall(responseMsg.toolCallRequest);

          // Check abort after tool execution
          if (abortController.signal.aborted) {
            generationStage = "idle";
            return finalMessage;
          }

          // Convert result to content parts
          const contentParts = await convertToolResponse(toolResult);

          // Add tool response message locally
          const toolResponseMessage: TamboThreadMessage = {
            id: crypto.randomUUID(),
            threadId: resolvedThreadId,
            role: "tool",
            content: toText(toolResult.result),
            createdAt: new Date().toISOString(),
          };
          upsertMessage(toolResponseMessage);

          // Build params for tool response advance
          const toolName = responseMsg.toolCallRequest.toolName;
          const toolResponseParams: TamboAI.Beta.Threads.ThreadAdvanceByIDParams =
            {
              ...params,
              toolCallCounts: {
                ...(params.toolCallCounts ?? {}),
                [toolName]: (params.toolCallCounts?.[toolName] ?? 0) + 1,
              },
              messageToAppend: {
                content: contentParts,
                role: "tool",
                tool_call_id: responseMsg.tool_call_id,
                error: toolResult.error,
                component: responseMsg.component,
              },
            };

          // Recursively advance with tool response
          generationStage = "generating";
          const toolResponseStream = await advanceStream(
            client,
            toolResponseParams,
            resolvedThreadId ?? responseMsg.threadId,
            { signal: abortController.signal },
          );

          return await handleAdvanceStream(
            toolResponseStream,
            toolResponseParams,
            abortController,
          );
        }

        // Regular message update (text/component)
        const converted = convertMessage(responseMsg);
        finalMessage = converted;
        upsertMessage(finalMessage);
      }
    } catch (err) {
      // Handle abort errors gracefully
      if (err instanceof Error && err.name === "AbortError") {
        if (finalMessage) {
          finalMessage.isCancelled = true;
          upsertMessage(finalMessage);
        }
        generationStage = "idle";
        return finalMessage ?? createEmptyMessage(resolvedThreadId ?? "");
      }
      throw err;
    }

    // Mark complete and maybe auto-generate name
    const completedThreadId = finalMessage?.threadId ?? resolvedThreadId ?? "";
    generationStage = "completed";
    maybeAutoGenerateThreadName(completedThreadId);

    return finalMessage ?? createEmptyMessage(completedThreadId);
  }

  /**
   * Create an empty placeholder message
   */
  function createEmptyMessage(threadId: string): TamboThreadMessage {
    return {
      id: crypto.randomUUID(),
      threadId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      componentState: {},
    };
  }

  return {
    get thread() {
      return thread;
    },
    get threads() {
      return threads;
    },
    get generationStage() {
      return generationStage;
    },
    get statusMessage() {
      return statusMessage;
    },
    get error() {
      return error;
    },
    get isLoading() {
      return isLoading;
    },
    get isIdle() {
      return isIdle;
    },
    get messages() {
      return messages;
    },
    get currentThreadId() {
      return currentThreadId;
    },

    startNewThread(contextKey?: string): TamboThread {
      const resolvedContextKey = contextKey ?? defaultContextKey;
      thread = {
        id: `placeholder-${crypto.randomUUID()}`,
        name: undefined,
        createdAt: new Date().toISOString(),
        contextKey: resolvedContextKey,
        messages: [],
      };
      generationStage = "idle";
      statusMessage = "";
      error = null;
      return thread;
    },

    async switchThread(threadId: string): Promise<void> {
      try {
        isLoading = true;
        error = null;

        const response = await client.beta.threads.retrieve(threadId);

        thread = {
          id: response.id,
          name: response.name,
          createdAt: response.createdAt,
          messages: (response.messages ?? []).map(convertMessage),
        };
      } catch (err) {
        error = err instanceof Error ? err : new Error(String(err));
        throw error;
      } finally {
        isLoading = false;
      }
    },

    async fetchThreads(contextKey?: string): Promise<TamboThread[]> {
      try {
        isLoading = true;
        error = null;

        const response = await client.beta.threads.list("", {
          contextKey: contextKey ?? defaultContextKey,
        });

        const items: TamboThread[] = [];
        for await (const t of response) {
          items.push({
            id: t.id,
            name: t.name,
            createdAt: t.createdAt,
            messages: [],
          });
        }
        threads = items;

        return threads;
      } catch (err) {
        error = err instanceof Error ? err : new Error(String(err));
        throw error;
      } finally {
        isLoading = false;
      }
    },

    async updateThreadName(newName: string, threadId?: string): Promise<void> {
      const id = threadId ?? thread?.id;
      if (!id) throw new Error("No thread ID provided");

      await client.beta.threads.update(id, { projectId: "", name: newName });

      if (thread && thread.id === id) {
        thread.name = newName;
      }

      const idx = threads.findIndex((t) => t.id === id);
      if (idx >= 0) {
        threads[idx] = { ...threads[idx], name: newName };
      }
    },

    async generateThreadName(threadId?: string): Promise<void> {
      return doGenerateThreadName(threadId);
    },

    async sendMessage(
      content: string,
      images?: StagedImage[],
      options: SendMessageOptions = {},
    ): Promise<TamboThreadMessage> {
      const { forceToolChoice, additionalContext } = options;

      // Ensure we have a local thread
      if (!thread) {
        this.startNewThread();
      }

      if (!thread) {
        throw new Error("Failed to create thread");
      }

      // Cancel any existing stream - this is critical!
      if (currentAbortController) {
        currentAbortController.abort();
      }
      currentAbortController = new AbortController();
      const abortController = currentAbortController;

      const isPlaceholder = thread.id.startsWith("placeholder");

      try {
        generationStage = "starting";
        statusMessage = "";
        error = null;

        // Build display content
        let displayContent: string | ContentPart[];
        if (images && images.length > 0) {
          const contentParts: ContentPart[] = [{ type: "text", text: content }];
          for (const img of images) {
            contentParts.push({
              type: "image_url",
              image_url: { url: img.dataUrl },
            });
          }
          displayContent = contentParts;
        } else {
          displayContent = content;
        }

        // Add user message locally
        const userMessage: TamboThreadMessage = {
          id: crypto.randomUUID(),
          threadId: thread.id,
          role: "user",
          content: displayContent,
          createdAt: new Date().toISOString(),
          componentState: {},
        };
        upsertMessage(userMessage);

        // Get additional context from helpers
        const helperContexts = await getAdditionalContext();
        const combinedContext: Record<string, unknown> = {
          ...(additionalContext ?? {}),
        };
        for (const ctx of helperContexts) {
          combinedContext[ctx.name] = ctx.context;
        }

        // Build SDK content
        const sdkContent: TamboAI.Beta.Threads.ChatCompletionContentPart[] = [
          { type: "text", text: content },
        ];
        if (images) {
          for (const img of images) {
            sdkContent.push({
              type: "image_url",
              image_url: { url: img.dataUrl },
            });
          }
        }

        // Build advance params
        const params: TamboAI.Beta.Threads.ThreadAdvanceByIDParams = {
          messageToAppend: {
            content: sdkContent,
            role: "user",
            additionalContext: combinedContext,
          },
          contextKey: thread.contextKey ?? defaultContextKey,
          availableComponents: registryStore.getAvailableComponents(),
          clientTools: registryStore.getClientTools(),
          forceToolChoice,
        };

        generationStage = "generating";

        // Start streaming with abort signal - this is the key fix!
        const stream = await advanceStream(
          client,
          params,
          isPlaceholder ? undefined : thread.id,
          { signal: abortController.signal },
        );

        const result = await handleAdvanceStream(
          stream,
          params,
          abortController,
        );

        // handleAdvanceStream may have set generationStage to "error"
        // We need to check the actual state, not the TypeScript-inferred type
        if ((generationStage as GenerationStage) !== "error") {
          generationStage = "completed";
        }

        // Reset to idle after a short delay
        setTimeout(() => {
          if (generationStage === "completed") {
            generationStage = "idle";
          }
        }, 100);

        return result;
      } catch (err) {
        // Handle abort errors gracefully
        if (err instanceof Error && err.name === "AbortError") {
          generationStage = "idle";
          return createEmptyMessage(thread.id);
        }

        if (!abortController.signal.aborted) {
          error = err instanceof Error ? err : new Error(String(err));
          generationStage = "error";
        }
        throw err;
      }
    },

    async cancel(): Promise<void> {
      // Abort the current stream - this is critical!
      if (currentAbortController) {
        currentAbortController.abort();
        currentAbortController = null;
      }

      // Also notify server
      if (thread?.id && !thread.id.startsWith("placeholder")) {
        try {
          await client.beta.threads.cancel(thread.id);
        } catch {
          // Ignore cancel errors
        }
      }

      generationStage = "idle";
      statusMessage = "";
    },

    clearThread(): void {
      thread = null;
      generationStage = "idle";
      statusMessage = "";
      error = null;
      currentAbortController?.abort();
      currentAbortController = null;
    },

    updateThreadMessage(
      messageId: string,
      update: Partial<TamboThreadMessage>,
      sendToServer = false,
    ): void {
      if (!thread) return;

      const idx = thread.messages.findIndex((m) => m.id === messageId);
      if (idx >= 0) {
        thread.messages[idx] = { ...thread.messages[idx], ...update };
      }

      if (sendToServer && thread.id && !thread.id.startsWith("placeholder")) {
        // Fire and forget server update
        void client.beta.threads.messages
          .updateComponentState(messageId, {
            id: thread.id,
            state: update.componentState ?? {},
          })
          .catch((err) => {
            console.error("Failed to update message on server:", err);
          });
      }
    },
  };
}

export type { ThreadStore as ThreadStoreType };
