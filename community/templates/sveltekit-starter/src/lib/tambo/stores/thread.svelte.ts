import TamboAI, { advanceStream } from "@tambo-ai/typescript-sdk";
import { z } from "zod";
import { getTamboClient } from "../client.js";
import type {
  TamboThread,
  TamboThreadMessage,
  GenerationStage,
  TamboComponent,
  TamboTool,
  ContentPart,
  StagedImage,
} from "../types.js";

export interface ThreadStoreOptions {
  apiKey?: string;
  contextKey?: string;
  components?: TamboComponent[];
  tools?: TamboTool[];
}

/**
 * Convert a JSON Schema object into ToolParameters array for the SDK
 */
function jsonSchemaToToolParameters(
  jsonSchema: Record<string, unknown>,
): TamboAI.ToolParameters[] {
  const properties = jsonSchema.properties as
    | Record<string, Record<string, unknown>>
    | undefined;
  const required = (jsonSchema.required as string[]) || [];

  if (!properties) return [];

  return Object.entries(properties).map(([name, prop]) => ({
    name,
    description: (prop.description as string) || "",
    type: (prop.type as string) || "string",
    isRequired: required.includes(name),
    ...(prop.enum ? { enumValues: prop.enum as string[] } : {}),
    ...(prop.items
      ? {
          items: {
            type:
              ((prop.items as Record<string, unknown>).type as string) ||
              "string",
          },
        }
      : {}),
  }));
}

/**
 * Create a thread store with Svelte 5 runes
 */
export function createThreadStore(options: ThreadStoreOptions = {}) {
  const client = getTamboClient({ apiKey: options.apiKey || "" });

  // State
  let thread = $state<TamboThread | null>(null);
  let threads = $state<TamboThread[]>([]);
  let generationStage = $state<GenerationStage>("idle");
  let error = $state<Error | null>(null);
  let isLoading = $state(false);

  // Registered components and tools
  let components = $state<TamboComponent[]>(options.components || []);
  let tools = $state<TamboTool[]>(options.tools || []);

  // Derived state
  const isIdle = $derived(
    generationStage === "idle" || generationStage === "completed",
  );
  const messages = $derived(thread?.messages || []);
  const currentThreadId = $derived(thread?.id);

  /**
   * Convert components to SDK AvailableComponent format
   */
  function getComponentsForApi(): TamboAI.AvailableComponent[] {
    return components.map((c) => ({
      name: c.name,
      description: c.description,
      props: z.toJSONSchema(c.propsSchema) as Record<string, unknown>,
      contextTools: [],
    }));
  }

  /**
   * Convert tools to SDK ComponentContextToolMetadata format
   */
  function getToolsForApi(): TamboAI.ComponentContextToolMetadata[] {
    return tools.map((t) => {
      const jsonSchema = z.toJSONSchema(t.toolSchema) as Record<
        string,
        unknown
      >;
      return {
        name: t.name,
        description: t.description,
        parameters: jsonSchemaToToolParameters(jsonSchema),
      };
    });
  }

  /**
   * Execute a tool call
   */
  async function executeToolCall(
    toolCallRequest: TamboAI.ToolCallRequest,
  ): Promise<{ result: unknown; error?: string }> {
    const tool = tools.find((t) => t.name === toolCallRequest.toolName);
    if (!tool) {
      return {
        result: null,
        error: `Tool not found: ${toolCallRequest.toolName}`,
      };
    }

    const args: Record<string, unknown> = {};
    for (const p of toolCallRequest.parameters) {
      args[p.parameterName] = p.parameterValue;
    }

    try {
      const result = await tool.tool(args);
      return { result };
    } catch (err) {
      return {
        result: null,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * Extract text from SDK content array
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
   * Convert SDK ThreadMessage to our TamboThreadMessage
   */
  function convertMessage(
    msg: TamboAI.Beta.Threads.ThreadMessage,
  ): TamboThreadMessage {
    return {
      id: msg.id,
      role: msg.role as TamboThreadMessage["role"],
      content: extractText(msg.content as unknown[]) || null,
      createdAt: msg.createdAt,
      reasoning: msg.reasoning,
      reasoningDurationMS: msg.reasoningDurationMS,
      isCancelled: msg.isCancelled,
      error: msg.error,
      parentMessageId: msg.parentMessageId,
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
          }
        : undefined,
    };
  }

  /**
   * Create or update a message in the current thread
   */
  function upsertMessage(message: TamboThreadMessage) {
    if (!thread) return;
    const idx = thread.messages.findIndex((m) => m.id === message.id);
    if (idx >= 0) {
      thread.messages[idx] = message;
    } else {
      thread.messages = [...thread.messages, message];
    }
  }

  /**
   * Handle the advance stream, including recursive tool calls.
   * When the server creates a new thread, the threadId comes from
   * responseMessageDto.threadId in the first chunk.
   */
  async function handleAdvanceStream(
    stream: AsyncIterable<TamboAI.Beta.Threads.ThreadAdvanceResponse>,
    params: TamboAI.Beta.Threads.ThreadAdvanceByIDParams,
    abortController: AbortController,
  ): Promise<void> {
    let finalMessage: TamboThreadMessage | null = null;
    let resolvedThreadId: string | undefined;

    for await (const chunk of stream) {
      if (abortController.signal.aborted) {
        if (finalMessage) {
          finalMessage.isCancelled = true;
          upsertMessage(finalMessage);
        }
        break;
      }

      // Update generation stage
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

      const responseMsg = chunk.responseMessageDto;
      if (!responseMsg) continue;

      // If this is the first chunk and we don't have a thread yet,
      // create the local thread from the server-assigned threadId
      if (!resolvedThreadId && responseMsg.threadId) {
        resolvedThreadId = responseMsg.threadId;
        if (!thread || thread.id !== resolvedThreadId) {
          const existingMessages = thread?.messages || [];
          thread = {
            id: resolvedThreadId,
            name: undefined,
            createdAt: new Date().toISOString(),
            contextKey: options.contextKey,
            messages: existingMessages,
          };
        }
      }

      // Check for tool call
      if (responseMsg.toolCallRequest) {
        generationStage = "tool_calling";

        // Update the assistant message showing the tool call
        const toolCallMessage = convertMessage(responseMsg);
        upsertMessage(toolCallMessage);
        finalMessage = toolCallMessage;

        // Execute the tool
        const toolResult = await executeToolCall(responseMsg.toolCallRequest);

        // Convert result to content parts
        const resultText =
          typeof toolResult.result === "string"
            ? toolResult.result
            : JSON.stringify(toolResult.result);
        const contentParts: TamboAI.Beta.Threads.ChatCompletionContentPart[] = [
          { type: "text", text: resultText },
        ];

        // Add tool response message locally
        const toolResponseMessage: TamboThreadMessage = {
          id: crypto.randomUUID(),
          role: "tool",
          content: resultText,
          createdAt: new Date().toISOString(),
        };
        upsertMessage(toolResponseMessage);

        // Build params for tool response advance (use message's tool_call_id, not toolCallRequest's)
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
        const toolResponseStream = await advanceStream(
          client,
          toolResponseParams,
          resolvedThreadId || responseMsg.threadId,
        );

        generationStage = "generating";
        await handleAdvanceStream(
          toolResponseStream,
          toolResponseParams,
          abortController,
        );
        return;
      }

      // Regular message update (text / component)
      const converted = convertMessage(responseMsg);

      if (!finalMessage) {
        finalMessage = converted;
        upsertMessage(finalMessage);
      } else {
        finalMessage = converted;
        upsertMessage(finalMessage);
      }
    }
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
    get components() {
      return components;
    },
    get tools() {
      return tools;
    },

    registerComponents(newComponents: TamboComponent[]) {
      components = [...components, ...newComponents];
    },

    registerTools(newTools: TamboTool[]) {
      tools = [...tools, ...newTools];
    },

    getComponent(name: string) {
      return components.find((c) => c.name === name);
    },

    /**
     * Start a new thread locally (no API call).
     * The server creates the real thread when the first message is sent via advanceStream.
     */
    startNewThread(contextKey?: string): TamboThread {
      const resolvedContextKey = contextKey || options.contextKey;
      thread = {
        id: `placeholder-${crypto.randomUUID()}`,
        name: undefined,
        createdAt: new Date().toISOString(),
        contextKey: resolvedContextKey,
        messages: [],
      };
      generationStage = "idle";
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
          messages: (response.messages || []).map(convertMessage),
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
          contextKey: contextKey || options.contextKey,
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
      const id = threadId || thread?.id;
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
      const id = threadId || thread?.id;
      if (!id) throw new Error("No thread ID provided");

      const response = await client.beta.threads.generateName(id);

      if (thread && thread.id === id && response.name) {
        thread.name = response.name;
      }

      const idx = threads.findIndex((t) => t.id === id);
      if (idx >= 0 && response.name) {
        threads[idx] = { ...threads[idx], name: response.name };
      }
    },

    async sendMessage(
      content: string,
      images?: StagedImage[],
      _streamResponse = true,
    ): Promise<void> {
      // Ensure we have a local thread (placeholder if new)
      if (!thread) {
        this.startNewThread();
      }

      if (!thread) {
        throw new Error("Failed to create thread");
      }

      const abortController = new AbortController();
      const isPlaceholder = thread.id.startsWith("placeholder-");

      try {
        generationStage = "starting";
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
          role: "user",
          content: displayContent,
          createdAt: new Date().toISOString(),
        };
        upsertMessage(userMessage);

        // Build SDK content
        const sdkContent: TamboAI.Beta.Threads.ChatCompletionContentPart[] = [
          { type: "text", text: content },
        ];

        // Build advance params
        const params: TamboAI.Beta.Threads.ThreadAdvanceByIDParams = {
          messageToAppend: {
            content: sdkContent,
            role: "user",
          },
          contextKey: thread.contextKey || options.contextKey,
          availableComponents: getComponentsForApi(),
          clientTools: getToolsForApi(),
        };

        generationStage = "generating";

        // Start streaming - pass undefined for placeholder threads so server creates the thread
        const stream = await advanceStream(
          client,
          params,
          isPlaceholder ? undefined : thread.id,
        );

        await handleAdvanceStream(stream, params, abortController);

        if ((generationStage as GenerationStage) !== "error") {
          generationStage = "completed";
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          error = err instanceof Error ? err : new Error(String(err));
          generationStage = "error";
        }
      } finally {
        setTimeout(() => {
          if (generationStage === "completed") {
            generationStage = "idle";
          }
        }, 100);
      }
    },

    async cancel(): Promise<void> {
      if (thread?.id) {
        try {
          await client.beta.threads.cancel(thread.id);
        } catch {
          // Ignore cancel errors
        }
      }
      generationStage = "idle";
    },

    clearThread() {
      thread = null;
      generationStage = "idle";
      error = null;
    },
  };
}

export type ThreadStore = ReturnType<typeof createThreadStore>;
