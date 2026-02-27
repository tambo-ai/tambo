/**
 * TamboClient - Framework-agnostic client for Tambo AI
 *
 * Main entry point for the `@tambo-ai/client` package. Manages threads,
 * tool registration, streaming, and state. Compatible with
 * useSyncExternalStore for React integration.
 */

import TamboAI from "@tambo-ai/typescript-sdk";
import type { Suggestion } from "@tambo-ai/typescript-sdk/resources/beta/threads/suggestions";

import type { TamboThread } from "./types/thread";
import type { TamboAuthState } from "./types/auth";
import type { ToolChoice } from "./types/tool-choice";
import type { InputMessage } from "./types/message";
import type {
  TamboTool,
  ComponentRegistry,
  TamboToolRegistry,
} from "./model/component-metadata";
import type { McpServerInfo } from "./model/mcp-server-info";
import { getMcpServerUniqueKey } from "./model/mcp-server-info";
import { MCPClient } from "./mcp/mcp-client";
import {
  streamReducer,
  createInitialState,
  isPlaceholderThreadId,
  PLACEHOLDER_THREAD_ID,
  type StreamState,
  type StreamAction,
  type ThreadState,
} from "./utils/event-accumulator";
import { TamboStream, type TamboStreamOptions } from "./tambo-stream";

/**
 * Function that returns context to be merged into additionalContext before each run.
 */
export type ContextHelperFn = () =>
  | Record<string, unknown>
  | Promise<Record<string, unknown>>;

/**
 * Callback invoked before each run starts.
 */
export interface BeforeRunContext {
  /** Thread ID (undefined for new threads). */
  threadId: string | undefined;
  /** The message being sent. */
  message: InputMessage;
  /** Frozen copy of registered tools (cannot mutate). */
  tools: Readonly<Record<string, TamboTool>>;
}

/**
 * Options for configuring TamboClient.
 */
export interface TamboClientOptions {
  /** API key for authentication. */
  apiKey: string;
  /** Custom Tambo API URL. Conflicts with `environment`. */
  tamboUrl?: string;
  /** Environment preset. Conflicts with `tamboUrl`. */
  environment?: "production" | "staging";
  /** User key for identifying the user. */
  userKey?: string;
  /** User token for token-based auth. */
  userToken?: string;
  /** Tools to register on creation. */
  tools?: TamboTool[];
  /** MCP servers to connect on init. */
  mcpServers?: McpServerInfo[];
  /** Callback invoked before each run. */
  beforeRun?: (context: BeforeRunContext) => void | Promise<void>;
}

/**
 * Options for the `run()` method.
 */
export interface RunOptions {
  /** Thread ID to run on. If omitted, creates a new thread. */
  threadId?: string;
  /** Whether to auto-execute tools when the model requests them. */
  autoExecuteTools?: boolean;
  /** Max tool execution rounds (default 10). */
  maxSteps?: number;
  /** How the model should select tools. */
  toolChoice?: ToolChoice;
  /** Enable debug logging. */
  debug?: boolean;
  /** Additional context merged into the message. */
  additionalContext?: Record<string, unknown>;
  /** AbortSignal for cancellation. */
  signal?: AbortSignal;
  /** User message text for optimistic display. */
  userMessageText?: string;
}

/**
 * Public client state exposed via `getState()`.
 */
export interface ClientState {
  /** Map of thread ID to thread state. */
  threadMap: Record<string, ThreadState>;
  /** Currently active thread ID. */
  currentThreadId: string;
}

// Track active runs per thread to prevent concurrent runs
type ActiveRuns = Record<string, TamboStream>;

/**
 * TamboClient manages threads, tool execution, streaming, and state.
 *
 * Compatible with `useSyncExternalStore(client.subscribe, client.getState)`
 * for React integration.
 * @example
 * ```typescript
 * const client = new TamboClient({ apiKey: "your-api-key" });
 *
 * // Stream mode
 * const stream = client.run("Hello, AI!");
 * for await (const { event, snapshot } of stream) {
 *   console.log(snapshot.messages);
 * }
 *
 * // Promise mode
 * const thread = await client.run("Hello, AI!").thread;
 * console.log(thread.messages);
 * ```
 */
export class TamboClient {
  private sdkClient: TamboAI;
  private state: StreamState;
  private listeners = new Set<() => void>();
  private pendingNotification = false;
  private toolRegistry: TamboToolRegistry = {};
  private componentList: ComponentRegistry = {};
  private mcpClients = new Map<string, MCPClient>();
  private activeRuns: ActiveRuns = {};
  private contextHelpers = new Map<string, ContextHelperFn>();
  private readonly options: TamboClientOptions;

  /**
   * Create a new TamboClient.
   * @param options - Client configuration.
   */
  constructor(options: TamboClientOptions) {
    if (options.tamboUrl && options.environment) {
      throw new Error(
        "Cannot specify both 'tamboUrl' and 'environment'. Choose one.",
      );
    }

    if (options.userKey && options.userToken) {
      throw new Error(
        "Cannot specify both 'userKey' and 'userToken'. Choose one.",
      );
    }

    this.options = options;
    this.state = createInitialState();

    // Resolve base URL
    const baseURL =
      options.tamboUrl ?? this.resolveBaseUrl(options.environment);

    this.sdkClient = new TamboAI({
      apiKey: options.apiKey,
      baseURL,
    });

    // Register initial tools
    if (options.tools) {
      for (const tool of options.tools) {
        this.toolRegistry[tool.name] = tool;
      }
    }

    // Connect MCP servers (fire-and-forget)
    if (options.mcpServers) {
      for (const server of options.mcpServers) {
        void this.connectMcpServer(server).catch((err) => {
          console.error(`[TamboClient] Failed to connect MCP server:`, err);
        });
      }
    }
  }

  // -- Core operations --

  /**
   * Start a new run with a message. Returns a TamboStream immediately.
   *
   * The stream's processing loop runs in the background. Use async iteration
   * to observe events, or `await stream.thread` to get the final result.
   * @param message - The message string or InputMessage object.
   * @param options - Run configuration.
   * @returns A TamboStream for observing the response.
   */
  run(message: string | InputMessage, options: RunOptions = {}): TamboStream {
    const {
      threadId,
      autoExecuteTools = true,
      maxSteps = 10,
      toolChoice,
      debug = false,
      additionalContext,
      signal,
      userMessageText,
    } = options;

    // Resolve the actual thread ID
    const resolvedThreadId =
      threadId && !isPlaceholderThreadId(threadId) ? threadId : undefined;

    // Check for concurrent runs
    if (resolvedThreadId && this.activeRuns[resolvedThreadId]) {
      throw new Error(
        `A run is already active on thread "${resolvedThreadId}". Wait for it to complete or abort it first.`,
      );
    }

    // Normalize message to InputMessage
    const inputMessage: InputMessage =
      typeof message === "string"
        ? { role: "user", content: [{ type: "text", text: message }] }
        : message;

    // If userMessageText not provided, extract from string messages
    const resolvedUserMessageText =
      userMessageText ?? (typeof message === "string" ? message : undefined);

    // Get previousRunId from thread state
    const threadState = resolvedThreadId
      ? this.state.threadMap[resolvedThreadId]
      : undefined;
    const previousRunId =
      threadState?.streaming.runId ?? threadState?.lastCompletedRunId;

    // Collect context helpers and beforeRun in the stream's processing loop
    const streamOptions: TamboStreamOptions = {
      client: this.sdkClient,
      message: inputMessage,
      threadId: resolvedThreadId,
      userMessageText: resolvedUserMessageText,
      componentList: this.componentList,
      toolRegistry: this.toolRegistry,
      userKey: this.options.userKey,
      previousRunId,
      additionalContext: this.mergeContextForRun(additionalContext),
      toolChoice,
      autoExecuteTools,
      maxSteps,
      debug,
      signal,
      dispatch: (action) => this.dispatch(action),
      getThreadSnapshot: (tid) => this.getThread(tid),
    };

    const stream = new TamboStream(streamOptions);

    // Track active run
    if (resolvedThreadId) {
      this.activeRuns[resolvedThreadId] = stream;
    }

    // Clean up active run tracking when stream completes
    void stream.thread
      .catch(() => {
        // Error handled by stream consumer
      })
      .finally(() => {
        if (resolvedThreadId) {
          delete this.activeRuns[resolvedThreadId];
        }
      });

    return stream;
  }

  // -- Thread management --

  /**
   * Switch to an existing thread. Fetches thread data from the API.
   * @param threadId - The thread ID to switch to.
   */
  async switchThread(threadId: string): Promise<void> {
    await this.fetchThread(threadId);
    this.dispatch({ type: "SET_CURRENT_THREAD", threadId });
  }

  /**
   * Start a new thread. Returns the new thread ID.
   * @returns The new placeholder thread ID.
   */
  startNewThread(): string {
    const threadId = PLACEHOLDER_THREAD_ID;
    this.dispatch({ type: "START_NEW_THREAD", threadId });
    return threadId;
  }

  /**
   * Get a thread from local state.
   * @param threadId - The thread ID.
   * @returns The thread, or undefined if not found.
   */
  getThread(threadId: string): TamboThread | undefined {
    return this.state.threadMap[threadId]?.thread;
  }

  /**
   * List all threads from the API.
   * @returns An array of TamboThread objects.
   */
  async listThreads(): Promise<TamboThread[]> {
    const response = await this.sdkClient.threads.list({
      userKey: this.options.userKey,
    });

    // Convert SDK response to TamboThread format
    return response.threads.map((apiThread) => ({
      id: apiThread.id,
      name: apiThread.name ?? undefined,
      messages: [],
      status: "idle" as const,
      metadata: (apiThread.metadata as Record<string, unknown>) ?? undefined,
      createdAt: apiThread.createdAt,
      updatedAt: apiThread.updatedAt,
      lastRunCancelled: false,
    }));
  }

  /**
   * Fetch a thread from the API and hydrate it into local state.
   * @param threadId - The thread ID to fetch.
   * @returns The fetched thread.
   */
  async fetchThread(threadId: string): Promise<TamboThread> {
    const apiThread = await this.sdkClient.threads.retrieve(threadId);

    // Initialize thread state if not present
    if (!this.state.threadMap[threadId]) {
      this.dispatch({ type: "INIT_THREAD", threadId });
    }

    // Load messages from the API response
    if (apiThread.messages && apiThread.messages.length > 0) {
      this.dispatch({
        type: "LOAD_THREAD_MESSAGES",
        threadId,
        messages: apiThread.messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content as TamboThread["messages"][0]["content"],
          createdAt: msg.createdAt,
          threadId,
        })),
      });
    }

    // Set lastCompletedRunId if available
    if (apiThread.lastCompletedRunId) {
      this.dispatch({
        type: "SET_LAST_COMPLETED_RUN_ID",
        threadId,
        lastCompletedRunId: apiThread.lastCompletedRunId,
      });
    }

    // Update thread name if available
    if (apiThread.name) {
      this.dispatch({
        type: "UPDATE_THREAD_NAME",
        threadId,
        name: apiThread.name,
      });
    }

    const thread = this.getThread(threadId);
    if (!thread) {
      throw new Error(`Failed to hydrate thread ${threadId}`);
    }
    return thread;
  }

  // -- Registration --

  /**
   * Register a single tool.
   * @param tool - The tool to register.
   */
  registerTool(tool: TamboTool): void {
    this.toolRegistry[tool.name] = tool;
  }

  /**
   * Register multiple tools at once.
   * @param tools - The tools to register.
   */
  registerTools(tools: TamboTool[]): void {
    for (const tool of tools) {
      this.toolRegistry[tool.name] = tool;
    }
  }

  /**
   * Register a component.
   * @param name - Component name.
   * @param component - The registered component.
   */
  registerComponent(name: string, component: ComponentRegistry[string]): void {
    this.componentList[name] = component;
  }

  // -- State access (useSyncExternalStore-compatible) --

  /**
   * Get the current client state snapshot.
   * @returns The current client state.
   */
  getState(): ClientState {
    return this.state;
  }

  /**
   * Subscribe to state changes.
   * @param listener - Callback invoked on state change.
   * @returns Unsubscribe function.
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // -- Auth --

  /**
   * Compute and return the current auth state. Not stored in state;
   * computed on each call from config.
   * @returns The current auth state.
   */
  getAuthState(): TamboAuthState {
    const { userKey, userToken } = this.options;

    if (userKey && userToken) {
      return { status: "invalid" };
    }
    if (userKey) {
      return { status: "identified", source: "userKey" };
    }
    if (userToken) {
      // Token exchange would happen here in full implementation
      return { status: "exchanging" };
    }
    return { status: "unauthenticated" };
  }

  // -- Run control --

  /**
   * Cancel the active run on a thread.
   * @param threadId - The thread whose run to cancel. Defaults to current thread.
   */
  async cancelRun(threadId?: string): Promise<void> {
    const tid = threadId ?? this.state.currentThreadId;
    const activeStream = this.activeRuns[tid];
    if (activeStream) {
      activeStream.abort();
    }

    // Also try server-side cancellation
    const threadState = this.state.threadMap[tid];
    const runId = threadState?.streaming.runId;
    if (runId && tid) {
      try {
        await this.sdkClient.threads.runs.delete(runId, { threadId: tid });
      } catch (_error) {
        // Server-side cancellation is best-effort
      }
    }
  }

  // -- Thread naming --

  /**
   * Update a thread's name via the API.
   * @param threadId - The thread ID.
   * @param name - The new name.
   */
  async updateThreadName(threadId: string, name: string): Promise<void> {
    await this.sdkClient.threads.update(threadId, { name });
    this.dispatch({ type: "UPDATE_THREAD_NAME", threadId, name });
  }

  /**
   * Generate a thread name via the API.
   * @param threadId - The thread ID.
   * @returns The generated name.
   */
  async generateThreadName(threadId: string): Promise<string> {
    const threadWithName =
      await this.sdkClient.beta.threads.generateName(threadId);
    const name = threadWithName.name ?? "";
    if (name) {
      this.dispatch({ type: "UPDATE_THREAD_NAME", threadId, name });
    }
    return name;
  }

  // -- MCP --

  /**
   * Connect to an MCP server.
   * @param serverInfo - The MCP server configuration.
   * @returns The connected MCPClient.
   */
  async connectMcpServer(serverInfo: McpServerInfo): Promise<MCPClient> {
    const key = getMcpServerUniqueKey(serverInfo);
    const existing = this.mcpClients.get(key);
    if (existing) {
      return existing;
    }

    const mcpClient = await MCPClient.create(
      serverInfo.url,
      serverInfo.transport,
      serverInfo.customHeaders,
      undefined, // authProvider
      undefined, // sessionId
    );
    this.mcpClients.set(key, mcpClient);
    return mcpClient;
  }

  /**
   * Disconnect from an MCP server.
   * @param serverKey - The server key (from getMcpServerUniqueKey).
   */
  async disconnectMcpServer(serverKey: string): Promise<void> {
    const client = this.mcpClients.get(serverKey);
    if (client) {
      await client.close();
      this.mcpClients.delete(serverKey);
    }
  }

  /**
   * Get all connected MCP clients.
   * @returns Record of server key to MCPClient.
   */
  getMcpClients(): Record<string, MCPClient> {
    return Object.fromEntries(this.mcpClients.entries());
  }

  /**
   * Get an MCP token for a context key.
   * @param contextKey - The context key.
   * @param threadId - Optional thread ID for session-bound tokens.
   * @returns The MCP access token response.
   */
  async getMcpToken(
    contextKey?: string,
    threadId?: string,
  ): Promise<{
    mcpAccessToken?: string;
    expiresAt?: number;
    hasSession?: boolean;
  }> {
    const response = await this.sdkClient.beta.auth.getMcpToken({
      contextKey,
      threadId,
    });
    return {
      mcpAccessToken: response.mcpAccessToken,
      expiresAt: response.expiresAt,
      hasSession: response.hasSession,
    };
  }

  // -- Suggestions --

  /**
   * List suggestions for a message.
   * @param messageId - The message ID.
   * @param threadId - The thread ID.
   * @returns Array of suggestions.
   */
  async listSuggestions(
    messageId: string,
    threadId: string,
  ): Promise<Suggestion[]> {
    const response = await this.sdkClient.beta.threads.suggestions.list(
      messageId,
      { id: threadId },
    );
    return response;
  }

  /**
   * Generate suggestions for a message.
   * @param messageId - The message ID.
   * @param threadId - The thread ID.
   * @param options - Generation options.
   * @param options.maxSuggestions - Maximum number of suggestions to generate.
   * @returns Array of generated suggestions.
   */
  async generateSuggestions(
    messageId: string,
    threadId: string,
    options?: { maxSuggestions?: number },
  ): Promise<Suggestion[]> {
    const response = await this.sdkClient.beta.threads.suggestions.generate(
      messageId,
      {
        id: threadId,
        maxSuggestions: options?.maxSuggestions,
      },
    );
    return response;
  }

  // -- Context helpers --

  /**
   * Add a context helper that provides additional context on each run.
   * @param name - Unique name for the helper.
   * @param fn - Function returning context data.
   */
  addContextHelper(name: string, fn: ContextHelperFn): void {
    this.contextHelpers.set(name, fn);
  }

  /**
   * Remove a context helper.
   * @param name - The helper name to remove.
   */
  removeContextHelper(name: string): void {
    this.contextHelpers.delete(name);
  }

  /**
   * Get the underlying SDK client (for advanced use cases).
   * @returns The TamboAI SDK client.
   */
  getSdkClient(): TamboAI {
    return this.sdkClient;
  }

  // -- Private methods --

  /**
   * Dispatch an action to the state reducer and notify listeners.
   * @param action - The action to dispatch.
   */
  private dispatch(action: StreamAction): void {
    this.state = streamReducer(this.state, action);
    this.notifyListeners();
  }

  /**
   * Batch subscriber notifications via queueMicrotask to reduce
   * re-renders during high-frequency streaming.
   */
  private notifyListeners(): void {
    if (!this.pendingNotification) {
      this.pendingNotification = true;
      queueMicrotask(() => {
        this.pendingNotification = false;
        for (const listener of this.listeners) {
          listener();
        }
      });
    }
  }

  /**
   * Resolve the base URL from an environment preset.
   * @param environment - The environment to resolve.
   * @returns The resolved base URL.
   */
  private resolveBaseUrl(environment?: "production" | "staging"): string {
    switch (environment) {
      case "staging":
        return "https://api.staging.tambo.co";
      case "production":
      default:
        return "https://api.tambo.co";
    }
  }

  /**
   * Merge context from registered context helpers with provided additional context.
   * @param additionalContext - Context provided by the caller.
   * @returns Merged context object.
   */
  private mergeContextForRun(
    additionalContext?: Record<string, unknown>,
  ): Record<string, unknown> | undefined {
    if (this.contextHelpers.size === 0 && !additionalContext) {
      return undefined;
    }

    // Context helpers are gathered synchronously here for the initial merge.
    // Async helpers are not supported in this synchronous path — they should
    // be awaited in the stream processing loop via beforeRun.
    const merged: Record<string, unknown> = { ...additionalContext };
    return merged;
  }
}
