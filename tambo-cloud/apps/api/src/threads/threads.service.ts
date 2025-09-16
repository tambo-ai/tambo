import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as Sentry from "@sentry/nestjs";
import {
  convertMetadataToTools,
  createTamboBackend,
  generateChainId,
  getToolsFromSources,
  ITamboBackend,
  McpToolRegistry,
  ModelOptions,
  Provider,
  ToolRegistry,
} from "@tambo-ai-cloud/backend";
import {
  ActionType,
  ComponentDecisionV2,
  ContentPartType,
  decryptProviderKey,
  DEFAULT_OPENAI_MODEL,
  GenerationStage,
  getToolName,
  LegacyComponentDecision,
  MessageRole,
  ThreadMessage,
  throttle,
  ToolCallRequest,
  unstrictifyToolCallRequest,
} from "@tambo-ai-cloud/core";
import type { HydraDatabase, HydraDb } from "@tambo-ai-cloud/db";
import { operations, schema } from "@tambo-ai-cloud/db";
import { eq } from "drizzle-orm";
import OpenAI from "openai";
import { DATABASE } from "../common/middleware/db-transaction-middleware";
import { AuthService } from "../common/services/auth.service";
import { EmailService } from "../common/services/email.service";
import { CorrelationLoggerService } from "../common/services/logger.service";
import { getSystemTools } from "../common/systemTools";
import { ProjectsService } from "../projects/projects.service";
import {
  AdvanceThreadDto,
  AdvanceThreadResponseDto,
} from "./dto/advance-thread.dto";
import { MessageRequest, ThreadMessageDto } from "./dto/message.dto";
import { SuggestionDto } from "./dto/suggestion.dto";
import { SuggestionsGenerateDto } from "./dto/suggestions-generate.dto";
import { Thread, ThreadRequest, ThreadWithMessagesDto } from "./dto/thread.dto";
import {
  FREE_MESSAGE_LIMIT,
  FreeLimitReachedError,
  InvalidSuggestionRequestError,
  SuggestionGenerationError,
  SuggestionNotFoundException,
} from "./types/errors";
import { convertContentPartToDto } from "./util/content";
import {
  addMessage,
  threadMessageDtoToThreadMessage,
  updateMessage,
} from "./util/messages";
import { mapSuggestionToDto } from "./util/suggestions";
import {
  addAssistantResponse,
  addUserMessage,
  appendNewMessageToThread,
  finishInProgressMessage,
  fixStreamedToolCalls,
  processThreadMessage,
  updateGenerationStage,
  updateThreadMessageFromLegacyDecision,
} from "./util/thread-state";
import {
  callSystemTool,
  extractToolResponse,
  isSystemToolCall,
} from "./util/tool";
import {
  checkToolCallLimitViolation,
  DEFAULT_MAX_TOTAL_TOOL_CALLS,
  updateToolCallCounts,
} from "./util/tool-call-tracking";

const TAMBO_ANON_CONTEXT_KEY = "tambo:anon-user";
@Injectable()
export class ThreadsService {
  constructor(
    // @Inject(TRANSACTION)
    // private readonly tx: HydraDatabase,
    @Inject(DATABASE)
    private readonly db: HydraDatabase,
    private projectsService: ProjectsService,
    private readonly logger: CorrelationLoggerService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  getDb() {
    // return this.tx ?? this.db;
    return this.db;
  }

  private async createTamboBackendForThread(
    threadId: string,
    userId: string,
  ): Promise<ITamboBackend> {
    const chainId = await generateChainId(threadId);

    const threadData = await this.getDb().query.threads.findFirst({
      where: eq(schema.threads.id, threadId),
      columns: { projectId: true },
    });

    if (!threadData?.projectId) {
      throw new NotFoundException(
        `Thread with ID ${threadId} not found or has no project associated.`,
      );
    }

    const projectId = threadData.projectId;

    // 1. Fetch project-specific LLM settings
    const project = await this.projectsService.findOne(projectId);
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found.`);
    }

    // Determine the provider, model, and baseURL from project settings
    // Provider defaults to 'openai' if not set on the project, model to 'gpt-4o'
    const providerName = project.defaultLlmProviderName ?? "openai";
    let modelName = project.defaultLlmModelName;
    let customModelOverride = project.customLlmModelName;
    const baseURL = project.customLlmBaseURL;
    const maxInputTokens = project.maxInputTokens;

    if (providerName === "openai-compatible") {
      // For openai-compatible, the customLlmModelName is the actual model name
      modelName = project.customLlmModelName ?? DEFAULT_OPENAI_MODEL; // Fallback if customLlmModelName is null
      customModelOverride = undefined; // No separate override for openai-compatible
    } else if (customModelOverride) {
      // For other providers, if customLlmModelName is set, it overrides defaultLlmModelName
      modelName = customModelOverride;
    } else {
      modelName = modelName ?? DEFAULT_OPENAI_MODEL; // Fallback if no default model and no override
    }

    // 2. Get the API key for the determined provider
    const apiKey = await this.validateProjectAndProviderKeys(
      projectId,
      providerName as Provider,
      modelName,
    );
    if (!apiKey && providerName !== "openai-compatible") {
      throw new Error(
        `Provider key required but not found for project ${projectId} and provider ${providerName}`,
      );
    }

    return await createTamboBackend(apiKey, chainId, userId, {
      provider: providerName as Provider,
      model: modelName,
      baseURL: baseURL ?? undefined,
      maxInputTokens,
      aiProviderType: project.providerType,
      agentType: project.agentProviderType,
      agentName: project.agentName,
      agentUrl: project.agentUrl,
      customLlmParameters: project.customLlmParameters,
    });
  }

  async createThread(
    createThreadDto: Omit<ThreadRequest, "contextKey">,
    contextKey?: string,
  ): Promise<Thread> {
    return await Sentry.startSpan(
      {
        name: "threads.create",
        op: "threads",
        attributes: {
          projectId: createThreadDto.projectId,
          hasContextKey: !!contextKey,
        },
      },
      async () => await this.createThread_(createThreadDto, contextKey),
    );
  }

  private async createThread_(
    createThreadDto: Omit<ThreadRequest, "contextKey">,
    contextKey?: string,
  ): Promise<Thread> {
    const thread = await operations.createThread(this.getDb(), {
      projectId: createThreadDto.projectId,
      contextKey: contextKey,
      metadata: createThreadDto.metadata,
      name: createThreadDto.name,
    });

    // Add breadcrumb for thread creation
    Sentry.addBreadcrumb({
      message: "Thread created",
      category: "threads",
      level: "info",
      data: { threadId: thread.id, projectId: thread.projectId },
    });

    return {
      id: thread.id,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      name: thread.name ?? undefined,
      metadata: thread.metadata ?? undefined,
      generationStage: thread.generationStage,
      statusMessage: thread.statusMessage ?? undefined,
      projectId: thread.projectId,
    };
  }

  async findAllForProject(
    projectId: string,
    params: { contextKey?: string; offset?: number; limit?: number } = {},
  ): Promise<Thread[]> {
    const threads = await operations.getThreadsByProject(
      this.getDb(),
      projectId,
      params,
    );
    return threads.map((thread) => ({
      id: thread.id,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      contextKey: thread.contextKey ?? undefined,
      metadata: thread.metadata ?? undefined,
      generationStage: thread.generationStage,
      statusMessage: thread.statusMessage ?? undefined,
      projectId: thread.projectId,
      name: thread.name ?? undefined,
    }));
  }

  async countThreadsByProject(
    projectId: string,
    params: { contextKey?: string } = {},
  ): Promise<number> {
    return await operations.countThreadsByProject(
      this.getDb(),
      projectId,
      params,
    );
  }

  async findOne(
    id: string,
    projectId: string,
    contextKey?: string,
    includeInternal: boolean = false,
  ): Promise<ThreadWithMessagesDto> {
    const thread = await operations.getThreadForProjectId(
      this.getDb(),
      id,
      projectId,
      includeInternal,
      contextKey,
    );
    if (!thread) {
      throw new NotFoundException("Thread not found");
    }
    return {
      id: thread.id,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      metadata: thread.metadata ?? undefined,
      generationStage: thread.generationStage,
      statusMessage: thread.statusMessage ?? undefined,
      projectId: thread.projectId,
      name: thread.name ?? undefined,
      messages: thread.messages.map((message) => ({
        id: message.id,
        threadId: message.threadId,
        role: message.role,
        createdAt: message.createdAt,
        component: message.componentDecision ?? undefined,
        content: convertContentPartToDto(message.content),
        metadata: message.metadata ?? undefined,
        componentState: message.componentState ?? {},
        toolCallRequest: message.toolCallRequest ?? undefined,
        actionType: message.actionType ?? undefined,
        tool_call_id: message.toolCallId ?? undefined,
        error: message.error ?? undefined,
        isCancelled: message.isCancelled,
      })),
    };
  }

  async update(id: string, updateThreadDto: ThreadRequest) {
    const thread = await operations.updateThread(this.getDb(), id, {
      metadata: updateThreadDto.metadata,
      generationStage: updateThreadDto.generationStage,
      statusMessage: updateThreadDto.statusMessage,
      name: updateThreadDto.name,
    });
    return thread;
  }

  async updateGenerationStage(
    id: string,
    generationStage: GenerationStage,
    statusMessage?: string,
  ) {
    return await updateGenerationStage(
      this.getDb(),
      id,
      generationStage,
      statusMessage,
    );
  }

  /**
   * Sets a thread's generation stage to CANCELLED, and adds a blank response to the thread depending on the last message type.
   * @param threadId - The thread ID to cancel
   * @returns The updated thread with CANCELLED generation stage
   */
  async cancelThread(threadId: string): Promise<Thread> {
    const db = this.getDb();
    const updatedThread = await operations.updateThread(db, threadId, {
      generationStage: GenerationStage.CANCELLED,
      statusMessage: "Thread advancement cancelled",
    });

    const updatedThreadResponse = {
      id: updatedThread.id,
      createdAt: updatedThread.createdAt,
      updatedAt: updatedThread.updatedAt,
      name: updatedThread.name ?? undefined,
      contextKey: updatedThread.contextKey ?? undefined,
      metadata: updatedThread.metadata ?? undefined,
      generationStage: updatedThread.generationStage,
      statusMessage: updatedThread.statusMessage ?? undefined,
      projectId: updatedThread.projectId,
    };

    const latestMessage = await operations.getLatestMessage(db, threadId);

    await operations.updateMessage(db, latestMessage.id, {
      isCancelled: true,
    });

    if (latestMessage.toolCallRequest && latestMessage.toolCallId) {
      await addMessage(db, threadId, {
        role: MessageRole.Tool,
        content: [
          {
            type: ContentPartType.Text,
            text: "",
          },
        ],
        actionType: ActionType.ToolResponse,
        tool_call_id: latestMessage.toolCallId,
        componentState: {},
      });
    } else if (latestMessage.role == MessageRole.User) {
      await addMessage(db, threadId, {
        role: MessageRole.Assistant,
        content: [{ type: ContentPartType.Text, text: "" }],
      });
    }

    return updatedThreadResponse;
  }

  async remove(id: string) {
    return await operations.deleteThread(this.getDb(), id);
  }

  private async checkAndSendFirstMessageEmail(
    projectId: string,
    usage: typeof schema.projectMessageUsage.$inferSelect | undefined,
  ): Promise<void> {
    // Check if this is the first message and email hasn't been sent
    if (usage && usage.messageCount <= 1 && !usage.firstMessageSentAt) {
      try {
        // Get project and user details using operations
        const project = await operations.getProjectMembers(
          this.getDb(),
          projectId,
        );

        if (project && project.members.length > 0) {
          const user = project.members[0].user;

          // Check if user has received first message email in ANY of their projects
          const hasReceivedFirstMessageEmail =
            await operations.hasUserReceivedFirstMessageEmail(
              this.getDb(),
              user.id,
            );

          if (!hasReceivedFirstMessageEmail) {
            // Send first message email
            const result = await this.emailService.sendFirstMessageEmail(
              user.email ?? "",
              null,
              project.name,
            );

            if (result.success) {
              // Update the tracking
              await operations.updateProjectMessageUsage(
                this.getDb(),
                projectId,
                {
                  firstMessageSentAt: new Date(),
                },
              );
            }
          }
        }
      } catch (error) {
        this.logger.error(`Error sending first message email: ${error}`);
      }
    }
  }

  private async checkMessageLimit(projectId: string): Promise<void> {
    return await Sentry.startSpan(
      {
        name: "threads.checkMessageLimit",
        op: "validation",
        attributes: { projectId },
      },
      async () => await this.checkMessageLimit_(projectId),
    );
  }

  private async checkMessageLimit_(projectId: string): Promise<void> {
    try {
      const usage = await operations.getProjectMessageUsage(
        this.getDb(),
        projectId,
      );

      // Check if we're using the fallback key
      const projectWithKeys =
        await this.projectsService.findOneWithKeys(projectId);
      const project = await this.projectsService.findOne(projectId);
      if (!project) {
        throw new NotFoundException("Project not found");
      }
      const providerKeys = projectWithKeys?.getProviderKeys() ?? [];
      // Check specifically if we have a key for the provider being used
      const openaiKey = providerKeys.find(
        (key) => key.providerName === "openai",
      );
      // Using fallback key if we're using openai with default model but no openai key
      const usingFallbackKey =
        !openaiKey &&
        (project.defaultLlmProviderName === "openai" ||
          !project.defaultLlmProviderName) &&
        (project.defaultLlmModelName === DEFAULT_OPENAI_MODEL ||
          !project.defaultLlmModelName);

      if (!usage) {
        // Create initial usage record
        const newUsage = await operations.updateProjectMessageUsage(
          this.getDb(),
          projectId,
          {
            messageCount: usingFallbackKey ? 1 : 0,
          },
        );

        // Check for first message email with the newly created usage
        await Sentry.startSpan(
          {
            name: "threads.checkAndSendFirstMessageEmail",
            attributes: { projectId },
          },
          async () =>
            await this.checkAndSendFirstMessageEmail(projectId, newUsage),
        );
        return;
      }

      if (!usage.hasApiKey && usage.messageCount >= FREE_MESSAGE_LIMIT) {
        // Only send email if we haven't sent one before
        if (!usage.notificationSentAt) {
          // Get project owner's email from auth.users
          const projectOwner =
            await this.getDb().query.projectMembers.findFirst({
              where: eq(schema.projectMembers.projectId, projectId),
              with: {
                user: true,
              },
            });

          const ownerEmail = projectOwner?.user.email;

          if (ownerEmail) {
            await this.emailService.sendMessageLimitNotification(
              projectId,
              ownerEmail,
              project.name,
            );

            // Update the notification sent timestamp
            await operations.updateProjectMessageUsage(
              this.getDb(),
              projectId,
              {
                notificationSentAt: new Date(),
              },
            );
          }
        }

        // Track rate limit hit
        Sentry.captureMessage("Free message limit reached", "warning");

        throw new FreeLimitReachedError();
      }

      // Only increment message count if using fallback key
      if (usingFallbackKey) {
        await operations.incrementMessageCount(this.getDb(), projectId);
      }

      // Check for first message email
      await this.checkAndSendFirstMessageEmail(projectId, usage);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { projectId, operation: "checkMessageLimit" },
      });
      throw error;
    }
  }

  async addMessage(
    threadId: string,
    messageDto: MessageRequest,
  ): Promise<ThreadMessage> {
    return await addMessage(this.getDb(), threadId, messageDto);
  }

  async getMessages(
    threadId: string,
    includeInternal: boolean = false,
  ): Promise<ThreadMessageDto[]> {
    const messages = await operations.getMessages(
      this.getDb(),
      threadId,
      includeInternal,
    );
    return messages.map((message) => ({
      ...message,
      content: convertContentPartToDto(message.content),
      metadata: message.metadata ?? undefined,
      toolCallRequest: message.toolCallRequest ?? undefined,
      tool_call_id: message.toolCallId ?? undefined,
      actionType: message.actionType ?? undefined,
      componentState: message.componentState ?? {},
      component: message.componentDecision as ComponentDecisionV2 | undefined,
      error: message.error ?? undefined,
      isCancelled: message.isCancelled,
      additionalContext: message.additionalContext ?? {},
    }));
  }

  async deleteMessage(messageId: string) {
    await operations.deleteMessage(this.getDb(), messageId);
  }

  private async getMessage(
    messageId: string,
  ): Promise<schema.DBMessageWithThread> {
    try {
      const message = await operations.getMessageWithAccess(
        this.getDb(),
        messageId,
      );
      if (!message) {
        this.logger.warn(`Message not found: ${messageId}`);
        throw new InvalidSuggestionRequestError("Message not found");
      }
      return message;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error getting message: ${errorMessage}`, errorStack);
      throw new InvalidSuggestionRequestError("Failed to retrieve message");
    }
  }

  async getSuggestions(messageId: string): Promise<SuggestionDto[]> {
    this.logger.log(`Getting suggestions for message: ${messageId}`);

    await this.getMessage(messageId);

    try {
      const suggestions = await operations.getSuggestions(
        this.getDb(),
        messageId,
      );
      if (suggestions.length === 0) {
        throw new SuggestionNotFoundException(messageId);
      }

      this.logger.log(
        `Found ${suggestions.length} suggestions for message: ${messageId}`,
      );
      return suggestions.map(mapSuggestionToDto);
    } catch (error: unknown) {
      if (error instanceof SuggestionNotFoundException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error getting suggestions: ${errorMessage}`,
        errorStack,
      );
      throw new SuggestionGenerationError(messageId);
    }
  }

  async generateSuggestions(
    messageId: string,
    generateSuggestionsDto: SuggestionsGenerateDto,
  ): Promise<SuggestionDto[]> {
    return await Sentry.startSpan(
      {
        name: "threads.generateSuggestions",
        op: "ai.suggestions",
        attributes: {
          messageId,
          maxSuggestions: generateSuggestionsDto.maxSuggestions,
        },
      },
      async () =>
        await this.generateSuggestions_(messageId, generateSuggestionsDto),
    );
  }

  private async generateSuggestions_(
    messageId: string,
    generateSuggestionsDto: SuggestionsGenerateDto,
  ): Promise<SuggestionDto[]> {
    try {
      const message = await this.getMessage(messageId);
      const contextKey = message.thread.contextKey ?? TAMBO_ANON_CONTEXT_KEY;

      // Add breadcrumb
      Sentry.addBreadcrumb({
        message: "Generating suggestions",
        category: "ai",
        level: "info",
        data: { messageId, threadId: message.threadId },
      });

      const threadMessages = await this.getMessages(message.threadId);
      const tamboBackend = await this.createTamboBackendForThread(
        message.threadId,
        contextKey,
      );

      const suggestions = await tamboBackend.generateSuggestions(
        threadMessages as ThreadMessage[],
        generateSuggestionsDto.maxSuggestions ?? 3,
        generateSuggestionsDto.availableComponents ?? [],
        message.threadId,
        false,
      );

      if (!suggestions.suggestions.length) {
        throw new SuggestionGenerationError(messageId);
      }

      const savedSuggestions = await operations.createSuggestions(
        this.getDb(),
        suggestions.suggestions.map((suggestion) => ({
          messageId,
          title: suggestion.title,
          detailedSuggestion: suggestion.detailedSuggestion,
        })),
      );

      // Track successful suggestion generation
      Sentry.addBreadcrumb({
        message: "Suggestions generated successfully",
        category: "ai",
        level: "info",
        data: {
          messageId,
          count: savedSuggestions.length,
        },
      });

      return savedSuggestions.map(mapSuggestionToDto);
    } catch (error) {
      // Capture suggestion generation errors with context
      Sentry.withScope((scope) => {
        scope.setTag("operation", "generateSuggestions");
        scope.setTag("messageId", messageId);
        scope.setContext(
          "suggestionParams",
          generateSuggestionsDto as unknown as Record<string, unknown>,
        );
        Sentry.captureException(error);
      });

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error generating suggestions: ${errorMessage}`,
        errorStack,
      );
      throw new SuggestionGenerationError(messageId, {
        maxSuggestions: generateSuggestionsDto.maxSuggestions,
        availableComponents: generateSuggestionsDto.availableComponents,
      });
    }
  }

  // generateThreadName overloads
  async generateThreadName(
    threadId: string,
    projectId: string,
  ): Promise<Thread>;
  async generateThreadName(
    threadId: string,
    projectId: string,
    contextKey?: string,
  ): Promise<Thread>;

  async generateThreadName(
    threadId: string,
    projectId: string,
    contextKey?: string,
  ): Promise<Thread> {
    return await Sentry.startSpan(
      {
        name: "threads.generateThreadName",
        op: "ai.generation",
        attributes: {
          threadId,
          projectId,
          hasContextKey: !!contextKey,
        },
      },
      async () =>
        await this.generateThreadName_(threadId, projectId, contextKey),
    );
  }

  private async generateThreadName_(
    threadId: string,
    projectId: string,
    contextKey?: string,
  ): Promise<Thread> {
    const thread = await operations.getThreadForProjectId(
      this.getDb(),
      threadId,
      projectId,
      false,
      contextKey,
    );
    if (!thread) {
      throw new NotFoundException("Thread not found");
    }

    const messages = await this.getMessages(threadId, false);
    if (messages.length === 0) {
      throw new NotFoundException("No messages found for thread");
    }

    const tamboBackend = await this.createTamboBackendForThread(
      threadId,
      `${projectId}-${contextKey ?? TAMBO_ANON_CONTEXT_KEY}`,
    );
    const generatedName = await tamboBackend.generateThreadName(
      threadMessageDtoToThreadMessage(messages),
    );

    const updatedThread = await operations.updateThread(
      this.getDb(),
      threadId,
      {
        name: generatedName,
      },
    );

    return {
      id: updatedThread.id,
      createdAt: updatedThread.createdAt,
      updatedAt: updatedThread.updatedAt,
      name: updatedThread.name ?? undefined,
      metadata: updatedThread.metadata ?? undefined,
      generationStage: updatedThread.generationStage,
      statusMessage: updatedThread.statusMessage ?? undefined,
      projectId: updatedThread.projectId,
    };
  }

  async updateComponentState(
    messageId: string,
    newState: Record<string, unknown>,
  ): Promise<ThreadMessageDto> {
    const message = await operations.updateMessageComponentState(
      this.getDb(),
      messageId,
      newState,
    );
    return {
      ...message,
      content: convertContentPartToDto(message.content),
      metadata: message.metadata ?? undefined,
      componentState: message.componentState ?? {},
      toolCallRequest: message.toolCallRequest ?? undefined,
      tool_call_id: message.toolCallId ?? undefined,
      actionType: message.actionType ?? undefined,
      error: message.error ?? undefined,
      additionalContext: message.additionalContext ?? {},
    };
  }

  /**
   * Advance the thread by one step.
   * @param projectId - The project ID.
   * @param advanceRequestDto - The advance request DTO, including optional message to append, context key, and available components.
   * @param unresolvedThreadId - The thread ID, if any
   * @param stream - Whether to stream the response.
   * @param toolCallCounts - Dictionary mapping tool call signatures to their counts for loop prevention.
   * @param cachedSystemTools - The system tools loaded from MCP - if included, it is a cache to avoid re-fetching them.
   * @param contextKey - The context key, if any
   * @returns The the generated response thread message, generation stage, and status message.
   */
  async advanceThread(
    projectId: string,
    advanceRequestDto: Omit<AdvanceThreadDto, "contextKey">,
    unresolvedThreadId?: string,
    stream?: true,
    toolCallCounts?: Record<string, number>,
    cachedSystemTools?: McpToolRegistry,
    contextKey?: string,
  ): Promise<AsyncIterableIterator<AdvanceThreadResponseDto>>;
  async advanceThread(
    projectId: string,
    advanceRequestDto: Omit<AdvanceThreadDto, "contextKey">,
    unresolvedThreadId?: string,
    stream?: false,
    toolCallCounts?: Record<string, number>,
    cachedSystemTools?: McpToolRegistry,
  ): Promise<AdvanceThreadResponseDto>;
  async advanceThread(
    projectId: string,
    advanceRequestDto: Omit<AdvanceThreadDto, "contextKey">,
    unresolvedThreadId?: string,
    stream?: boolean,
    toolCallCounts?: Record<string, number>,
    cachedSystemTools?: McpToolRegistry,
    contextKey?: string,
  ): Promise<
    AdvanceThreadResponseDto | AsyncIterableIterator<AdvanceThreadResponseDto>
  >;
  async advanceThread(
    projectId: string,
    advanceRequestDto: Omit<AdvanceThreadDto, "contextKey">,
    unresolvedThreadId?: string,
    stream?: boolean,
    toolCallCounts: Record<string, number> = {},
    cachedSystemTools?: McpToolRegistry,
    contextKey?: string,
  ): Promise<
    AdvanceThreadResponseDto | AsyncIterableIterator<AdvanceThreadResponseDto>
  > {
    return await Sentry.startSpan(
      {
        name: "threads.advance",
        op: "threads.process",
        attributes: {
          projectId,
          threadId: unresolvedThreadId,
          stream: !!stream,
          hasMessage: !!advanceRequestDto.messageToAppend,
          toolCallCount: Object.keys(toolCallCounts).length,
        },
      },
      async () =>
        await this.advanceThread_(
          projectId,
          advanceRequestDto,
          unresolvedThreadId,
          stream,
          toolCallCounts,
          cachedSystemTools,
          contextKey,
        ),
    );
  }

  private async advanceThread_(
    projectId: string,
    advanceRequestDto: Omit<AdvanceThreadDto, "contextKey">,
    unresolvedThreadId?: string,
    stream?: boolean,
    toolCallCounts: Record<string, number> = {},
    cachedSystemTools?: McpToolRegistry,
    contextKey?: string,
  ): Promise<
    AdvanceThreadResponseDto | AsyncIterableIterator<AdvanceThreadResponseDto>
  > {
    const db = this.getDb();

    try {
      // Add breadcrumb for thread advancement
      Sentry.addBreadcrumb({
        message: "Starting thread advancement",
        category: "threads",
        level: "info",
        data: {
          projectId,
          threadId: unresolvedThreadId,
          messageRole: advanceRequestDto.messageToAppend.role,
        },
      });

      // Rate limiting check
      await this.checkMessageLimit(projectId);

      const thread = await this.ensureThread(
        projectId,
        unresolvedThreadId,
        contextKey,
      );

      // Set user context for better error tracking
      Sentry.setContext("thread", {
        id: thread.id,
        projectId: thread.projectId,
        generationStage: thread.generationStage,
      });

      // Check if we should ignore this request due to cancellation
      const shouldIgnore = await this.shouldIgnoreCancelledToolResponse(
        advanceRequestDto.messageToAppend,
        thread,
      );
      if (shouldIgnore) {
        this.logger.log(
          `Ignoring tool response due to cancellation for thread ${thread.id}`,
        );
        return {
          responseMessageDto: {
            id: "",
            role: MessageRole.Assistant,
            content: [],
            threadId: thread.id,
            componentState: {},
            createdAt: new Date(),
          },
          generationStage: GenerationStage.COMPLETE,
          statusMessage: "",
          mcpAccessToken: "",
        };
      }

      // Ensure only one request per thread adds its user message and continues
      const userMessage = await addUserMessage(
        db,
        thread.id,
        advanceRequestDto.messageToAppend,
        this.logger,
      );

      // Use the shared method to create the TamboBackend instance
      const tamboBackend = await this.createTamboBackendForThread(
        thread.id,
        `${projectId}-${contextKey ?? TAMBO_ANON_CONTEXT_KEY}`,
      );

      const messages = await this.getMessages(thread.id, true);
      const project = await operations.getProject(db, projectId);
      const customInstructions = project?.customInstructions ?? undefined;

      if (messages.length === 0) {
        throw new Error("No messages found");
      }
      const systemToolsStart = Date.now();

      const systemTools =
        cachedSystemTools ?? (await getSystemTools(db, projectId));
      const systemToolsEnd = Date.now();
      const systemToolsDuration = systemToolsEnd - systemToolsStart;
      if (!cachedSystemTools) {
        this.logger.log(`System tools took ${systemToolsDuration}ms to fetch`);
      }
      const allTools: ToolRegistry = {
        ...systemTools,
        clientToolsSchema: [
          ...(advanceRequestDto.availableComponents?.flatMap((component) =>
            convertMetadataToTools(component.contextTools),
          ) ?? []),
          ...convertMetadataToTools(advanceRequestDto.clientTools ?? []),
        ],
      };
      const mcpAccessToken = await this.authService.generateMcpAccessToken(
        projectId,
        thread.id,
        contextKey,
      );

      if (stream) {
        return await this.generateStreamingResponse(
          projectId,
          thread.id,
          db,
          tamboBackend,
          threadMessageDtoToThreadMessage(messages),
          userMessage,
          advanceRequestDto,
          customInstructions,
          toolCallCounts,
          allTools,
          mcpAccessToken,
          project?.maxToolCallLimit ?? DEFAULT_MAX_TOTAL_TOOL_CALLS,
        );
      }

      const responseMessage = await processThreadMessage(
        db,
        thread.id,
        threadMessageDtoToThreadMessage(messages),
        userMessage,
        advanceRequestDto,
        tamboBackend,
        allTools,
        customInstructions,
      );

      const {
        responseMessageDto,
        resultingGenerationStage,
        resultingStatusMessage,
      } = await addAssistantResponse(
        db,
        thread.id,
        userMessage.id,
        responseMessage,
        this.logger,
      );

      const toolCallRequest = responseMessage.toolCallRequest;

      // Check tool call limits if we have a tool call request
      const toolLimitErrorMessage = await checkToolCallLimitViolation(
        this.getDb(),
        thread.id,
        responseMessageDto.id,
        responseMessageDto,
        threadMessageDtoToThreadMessage(messages),
        toolCallCounts,
        toolCallRequest,
        project?.maxToolCallLimit ?? DEFAULT_MAX_TOTAL_TOOL_CALLS,
        mcpAccessToken,
      );
      if (toolLimitErrorMessage) {
        return toolLimitErrorMessage;
      }

      if (isSystemToolCall(toolCallRequest, allTools)) {
        if (!responseMessage.toolCallId) {
          console.warn(
            `While handling tool call request ${toolCallRequest.toolName}, no tool call id in response message ${responseMessage}, returning assistant message`,
          );
          Sentry.captureMessage(
            "Missing tool call ID from system tool call in stream",
            "warning",
          );
        }
        return await this.handleSystemToolCall(
          toolCallRequest,
          responseMessage.toolCallId ?? "",
          allTools,
          responseMessage,
          advanceRequestDto,
          projectId,
          thread.id,
          false,
          toolCallCounts,
        );
      }

      return {
        responseMessageDto: {
          ...responseMessageDto,
          content: convertContentPartToDto(responseMessageDto.content),
          componentState: responseMessageDto.componentState ?? {},
        },
        generationStage: resultingGenerationStage,
        statusMessage: resultingStatusMessage,
        mcpAccessToken,
      };
    } catch (error) {
      // Capture any errors with full context
      Sentry.withScope((scope) => {
        scope.setTag("operation", "advanceThread");
        scope.setTag("projectId", projectId);
        scope.setTag("threadId", unresolvedThreadId);
        scope.setContext("request", {
          stream,
          hasMessage: !!advanceRequestDto.messageToAppend,
          availableComponents: advanceRequestDto.availableComponents?.length,
        });
        Sentry.captureException(error);
      });
      throw error;
    }
  }

  private async handleSystemToolCall(
    toolCallRequest: ToolCallRequest,
    toolCallId: string,
    allTools: McpToolRegistry,
    componentDecision: LegacyComponentDecision,
    advanceRequestDto: AdvanceThreadDto,
    projectId: string,
    threadId: string,
    stream: boolean,
    toolCallCounts: Record<string, number>,
  ): Promise<AdvanceThreadResponseDto>;
  private async handleSystemToolCall(
    toolCallRequest: ToolCallRequest,
    toolCallId: string,
    allTools: McpToolRegistry,
    componentDecision: LegacyComponentDecision,
    advanceRequestDto: AdvanceThreadDto,
    projectId: string,
    threadId: string,
    stream: true,
    toolCallCounts: Record<string, number>,
  ): Promise<AsyncIterableIterator<AdvanceThreadResponseDto>>;
  private async handleSystemToolCall(
    toolCallRequest: ToolCallRequest,
    toolCallId: string,
    allTools: McpToolRegistry,
    componentDecision: LegacyComponentDecision,
    advanceRequestDto: AdvanceThreadDto,
    projectId: string,
    threadId: string,
    stream: boolean,
    toolCallCounts: Record<string, number>,
  ): Promise<
    AdvanceThreadResponseDto | AsyncIterableIterator<AdvanceThreadResponseDto>
  > {
    return await Sentry.startSpan(
      {
        name: "threads.handleSystemToolCall",
        op: "tools.system",
        attributes: {
          toolName: toolCallRequest.toolName,
          toolCallId,
          projectId,
          threadId,
          stream,
        },
      },
      async () =>
        await this.handleSystemToolCall_(
          toolCallRequest,
          toolCallId,
          allTools,
          componentDecision,
          advanceRequestDto,
          projectId,
          threadId,
          stream,
          toolCallCounts,
        ),
    );
  }

  private async handleSystemToolCall_(
    toolCallRequest: ToolCallRequest,
    toolCallId: string,
    allTools: McpToolRegistry,
    componentDecision: LegacyComponentDecision,
    advanceRequestDto: AdvanceThreadDto,
    projectId: string,
    threadId: string,
    stream: boolean,
    toolCallCounts: Record<string, number>,
  ): Promise<
    AdvanceThreadResponseDto | AsyncIterableIterator<AdvanceThreadResponseDto>
  > {
    try {
      // Add breadcrumb for tool call
      Sentry.addBreadcrumb({
        message: `Executing system tool: ${toolCallRequest.toolName}`,
        category: "tools",
        level: "info",
        data: { toolCallId, threadId },
      });

      const messageWithToolResponse: AdvanceThreadDto = await callSystemTool(
        allTools,
        toolCallRequest,
        toolCallId,
        componentDecision,
        advanceRequestDto,
      );

      if (messageWithToolResponse === advanceRequestDto) {
        throw new Error("No tool call response, returning assistant message");
      }

      // Update tool call counts with the current tool call
      const updatedToolCallCounts = updateToolCallCounts(
        toolCallCounts,
        toolCallRequest,
      );

      // This effectively recurses back into the decision loop with the tool response
      return await this.advanceThread(
        projectId,
        messageWithToolResponse,
        threadId,
        stream,
        updatedToolCallCounts,
        allTools,
      );
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          toolName: toolCallRequest.toolName,
          projectId,
          threadId,
        },
      });
      throw error;
    }
  }

  private async generateStreamingResponse(
    projectId: string,
    threadId: string,
    db: HydraDatabase,
    tamboBackend: ITamboBackend,
    messages: ThreadMessage[],
    userMessage: ThreadMessage,
    advanceRequestDto: AdvanceThreadDto,
    customInstructions: string | undefined,
    toolCallCounts: Record<string, number>,
    allTools: ToolRegistry,
    mcpAccessToken: string,
    maxToolCallLimit: number,
  ): Promise<AsyncIterableIterator<AdvanceThreadResponseDto>> {
    return await Sentry.startSpan(
      {
        name: "threads.generateStreamingResponse",
        op: "stream.generate",
        attributes: {
          projectId,
          threadId,
          messageCount: messages.length,
          hasCustomInstructions: !!customInstructions,
          toolCallCount: Object.keys(toolCallCounts).length,
        },
      },
      async () =>
        await this.generateStreamingResponse_(
          projectId,
          threadId,
          db,
          tamboBackend,
          messages,
          userMessage,
          advanceRequestDto,
          customInstructions,
          toolCallCounts,
          allTools,
          mcpAccessToken,
          maxToolCallLimit,
        ),
    );
  }

  private async generateStreamingResponse_(
    projectId: string,
    threadId: string,
    db: HydraDatabase,
    tamboBackend: ITamboBackend,
    messages: ThreadMessage[],
    userMessage: ThreadMessage,
    advanceRequestDto: AdvanceThreadDto,
    customInstructions: string | undefined,
    toolCallCounts: Record<string, number>,
    allTools: ToolRegistry,
    mcpAccessToken: string,
    maxToolCallLimit: number,
  ): Promise<AsyncIterableIterator<AdvanceThreadResponseDto>> {
    try {
      const latestMessage = messages[messages.length - 1];

      // Add breadcrumb for stream generation start
      Sentry.addBreadcrumb({
        message: "Starting streaming response generation",
        category: "stream",
        level: "info",
        data: {
          threadId,
          projectId,
          latestMessageRole: latestMessage.role,
          hasToolResponse: latestMessage.role === MessageRole.Tool,
        },
      });

      if (latestMessage.role === MessageRole.Tool) {
        await updateGenerationStage(
          db,
          threadId,
          GenerationStage.HYDRATING_COMPONENT,
          `Hydrating ${latestMessage.component?.componentName}...`,
        );

        // Track tool response processing
        Sentry.addBreadcrumb({
          message: `Processing tool response for ${latestMessage.component?.componentName}`,
          category: "tools",
          level: "info",
          data: {
            threadId,
            componentName: latestMessage.component?.componentName,
          },
        });

        // Since we don't store tool responses in the db, assumes that the tool response is the messageToAppend
        const toolResponse = extractToolResponse(userMessage);
        if (!toolResponse) {
          const error = new Error("No tool response found");
          Sentry.captureException(error, {
            tags: { threadId, projectId },
            extra: { latestMessageRole: latestMessage.role },
          });
          throw error;
        }

        const { originalTools, strictTools } = getToolsFromSources(
          allTools,
          advanceRequestDto.availableComponents ?? [],
        );

        // Track decision loop execution
        const decisionLoopSpan = Sentry.startInactiveSpan({
          name: "tambo.runDecisionLoop",
          op: "ai.decision",
          attributes: {
            threadId,
            toolCount: strictTools.length,
            messageCount: messages.length,
          },
        });

        const messageStream = await tamboBackend.runDecisionLoop({
          messages,
          strictTools,
          customInstructions,
        });

        decisionLoopSpan.end();

        return this.handleAdvanceThreadStream(
          projectId,
          threadId,
          messageStream,
          messages,
          userMessage,
          allTools,
          advanceRequestDto,
          originalTools,
          toolCallCounts,
          mcpAccessToken,
          maxToolCallLimit,
          tamboBackend.modelOptions,
        );
      }

      // From this point forward, we are not handling tool calls
      // so we can update the generation stage to fetching context
      await updateGenerationStage(
        db,
        threadId,
        GenerationStage.FETCHING_CONTEXT,
        `Fetching data...`,
      );

      Sentry.addBreadcrumb({
        message: "Fetching context for response generation",
        category: "stream",
        level: "info",
        data: {
          threadId,
          forceToolChoice: !!advanceRequestDto.forceToolChoice,
        },
      });

      const { originalTools, strictTools } = getToolsFromSources(
        allTools,
        advanceRequestDto.availableComponents ?? [],
      );

      // Track available tools
      Sentry.setContext("availableTools", {
        componentCount: advanceRequestDto.availableComponents?.length ?? 0,
        clientToolCount: advanceRequestDto.clientTools?.length ?? 0,
        systemToolCount: Object.keys(allTools).length,
        totalStrictTools: strictTools.length,
      });

      // Track decision loop execution with performance monitoring
      const decisionLoopSpan = Sentry.startInactiveSpan({
        name: "tambo.runDecisionLoop",
        op: "ai.decision",
        attributes: {
          threadId,
          toolCount: strictTools.length,
          messageCount: messages.length,
          forceToolChoice: !!advanceRequestDto.forceToolChoice,
        },
      });

      const streamedResponseMessages = await tamboBackend.runDecisionLoop({
        messages,
        strictTools,
        customInstructions,
        forceToolChoice: advanceRequestDto.forceToolChoice,
      });

      decisionLoopSpan.end();

      // Track successful stream generation
      Sentry.addBreadcrumb({
        message: "Stream generation initiated successfully",
        category: "stream",
        level: "info",
        data: {
          threadId,
          projectId,
        },
      });

      return this.handleAdvanceThreadStream(
        projectId,
        threadId,
        streamedResponseMessages,
        messages,
        userMessage,
        allTools,
        advanceRequestDto,
        originalTools,
        toolCallCounts,
        mcpAccessToken,
        maxToolCallLimit,
        tamboBackend.modelOptions,
      );
    } catch (error) {
      // Capture streaming generation errors with context
      Sentry.withScope((scope) => {
        scope.setTag("operation", "generateStreamingResponse");
        scope.setTag("projectId", projectId);
        scope.setTag("threadId", threadId);
        scope.setContext("streamGenerationContext", {
          messageCount: messages.length,
          hasCustomInstructions: !!customInstructions,
          toolCallCount: Object.keys(toolCallCounts).length,
          maxToolCallLimit,
          userMessageRole: userMessage.role,
          latestMessageRole: messages[messages.length - 1]?.role,
        });
        Sentry.captureException(error);
      });
      throw error;
    }
  }

  private async *handleAdvanceThreadStream(
    projectId: string,
    threadId: string,
    stream: AsyncIterableIterator<LegacyComponentDecision>,
    threadMessages: ThreadMessage[],
    userMessage: ThreadMessage,
    allTools: McpToolRegistry,
    originalRequest: AdvanceThreadDto,
    originalTools: OpenAI.Chat.Completions.ChatCompletionTool[],
    toolCallCounts: Record<string, number>,
    mcpAccessToken: string,
    maxToolCallLimit: number,
    modelOptions: ModelOptions,
  ): AsyncIterableIterator<AdvanceThreadResponseDto> {
    const db = this.getDb();
    const logger = this.logger;

    // Start a span for the entire streaming operation
    const span = Sentry.startInactiveSpan({
      name: "threads.handleAdvanceStream",
      op: "stream.process",
      attributes: {
        projectId,
        threadId,
        messageCount: threadMessages.length,
        toolCallCount: Object.keys(toolCallCounts).length,
      },
    });
    // ttfb: time to first byte span is used to track the time it takes for the first token to be generated
    const ttfbSpan = Sentry.startInactiveSpan({
      name: "tambo.time_to_first_token",
      op: "stream.ttfb",
      attributes: {
        projectId,
        threadId,
        "llm.model": modelOptions.model,
        "llm.provider": modelOptions.provider,
      },
    });
    let ttfbEnded = false;
    let previousMessageId: string = userMessage.id;

    try {
      // Add breadcrumb for stream start
      Sentry.addBreadcrumb({
        message: "Starting stream processing",
        category: "stream",
        level: "info",
        data: { threadId, projectId },
      });

      const thread = await this.findOne(threadId, projectId);
      if (thread.generationStage === GenerationStage.CANCELLED) {
        Sentry.addBreadcrumb({
          message: "Stream cancelled before processing",
          category: "stream",
          level: "warning",
          data: { threadId },
        });

        yield {
          responseMessageDto: {
            id: "",
            role: MessageRole.Assistant,
            content: [{ type: ContentPartType.Text, text: "" }],
            componentState: {},
            threadId: threadId,
            createdAt: new Date(),
          },
          generationStage: GenerationStage.CANCELLED,
          statusMessage: "Thread cancelled",
          mcpAccessToken,
        };
        ttfbSpan.end();
        ttfbEnded = true;
        return;
      }

      await updateGenerationStage(
        db,
        threadId,
        GenerationStage.STREAMING_RESPONSE,
        `Streaming response...`,
      );
      let currentThreadMessage: ThreadMessage | undefined = undefined;

      // Track streaming metrics
      let chunkCount = 0;
      const streamStartTime = Date.now();
      // we hold on to the final thread message, in case we have to switch to a tool call
      let finalThreadMessage: ThreadMessage | undefined;

      const updateIntervalMs = 500;
      const throttledSyncThreadStatus = throttle(
        syncThreadStatus,
        updateIntervalMs,
      );

      let currentLegacyDecisionId: string | undefined = undefined;
      for await (const legacyDecision of fixStreamedToolCalls(stream)) {
        if (
          !currentThreadMessage ||
          currentLegacyDecisionId !== legacyDecision.id
        ) {
          // Make sure the final version of the previous message is written to the db
          if (currentThreadMessage) {
            await updateMessage(db, currentThreadMessage.id, {
              ...currentThreadMessage,
              content: convertContentPartToDto(currentThreadMessage.content),
              toolCallRequest: currentThreadMessage.toolCallRequest,
              tool_call_id: currentThreadMessage.tool_call_id,
              actionType: currentThreadMessage.toolCallRequest
                ? ActionType.ToolCall
                : undefined,
            });
          }
          previousMessageId = currentThreadMessage?.id ?? userMessage.id;
          // time to insert a new message into the db
          currentThreadMessage = await appendNewMessageToThread(
            db,
            threadId,
            currentThreadMessage?.id ?? userMessage.id,
            legacyDecision.role,
            legacyDecision.message,
            logger,
          );

          currentLegacyDecisionId = legacyDecision.id;
        }
        // update in memory - we'll write to the db periodically
        currentThreadMessage = updateThreadMessageFromLegacyDecision(
          currentThreadMessage,
          legacyDecision,
        );
        chunkCount++;
        if (!ttfbEnded) {
          ttfbSpan.end();
          ttfbEnded = true;
        }

        const cancelledMessage = await throttledSyncThreadStatus(
          db,
          threadId,
          currentThreadMessage.id,
          projectId,
          chunkCount,
          currentThreadMessage,
          mcpAccessToken,
          logger,
        );
        if (cancelledMessage) {
          yield cancelledMessage;
          return;
        }

        // This is kind of a hack: when we have a tool call, but we might not want to
        // emit it all the way to the frontend, because that is how the frontend
        // knows to actually call a tool.. but the tool here might be an
        // internal (MCP or agent) tool call. So we emit the message without the
        // toplevel tool call request and tool call id, but both are still set
        // inside `currentThreadMessage.component`.
        const {
          toolCallRequest: _toolCallRequest, // may be undefined
          tool_call_id: _tool_call_id, // may be undefined
          ...messageWithoutToolCall
        } = currentThreadMessage;
        yield {
          responseMessageDto: {
            ...messageWithoutToolCall,
            content: convertContentPartToDto(messageWithoutToolCall.content),
            componentState: messageWithoutToolCall.componentState ?? {},
          },
          generationStage: GenerationStage.STREAMING_RESPONSE,
          statusMessage: `Streaming response...`,
          mcpAccessToken,
        };

        finalThreadMessage = currentThreadMessage;
      }

      if (!finalThreadMessage) {
        const error = new Error("No message found in stream");
        Sentry.captureException(error, {
          tags: { threadId, projectId },
          extra: { chunkCount },
        });
        throw error;
      }

      // Track streaming performance
      const streamDuration = Date.now() - streamStartTime;
      Sentry.addBreadcrumb({
        message: "Stream processing completed",
        category: "stream",
        level: "info",
        data: {
          threadId,
          chunkCount,
          durationMs: streamDuration,
          chunksPerSecond: (chunkCount / streamDuration) * 1000,
        },
      });

      // Initially, the call was made with a strict schema, so we need to remove non-required parameters
      const strictToolCallRequest = finalThreadMessage.toolCallRequest;
      const originalTool = originalTools.find(
        (tool) => getToolName(tool) === strictToolCallRequest?.toolName,
      );

      const toolCallRequest = unstrictifyToolCallRequest(
        originalTool,
        strictToolCallRequest,
      );

      // Update the tool call to be the non-strict call
      finalThreadMessage = {
        ...finalThreadMessage,
        toolCallRequest,
      };

      // Check tool call limits if we have a tool call request
      if (currentThreadMessage) {
        const toolLimitErrorMessage = await checkToolCallLimitViolation(
          this.getDb(),
          threadId,
          currentThreadMessage.id,
          finalThreadMessage,
          threadMessages,
          toolCallCounts,
          toolCallRequest,
          maxToolCallLimit,
          mcpAccessToken,
        );

        if (toolLimitErrorMessage) {
          yield toolLimitErrorMessage;
          return;
        }
      }
      let resultingGenerationStage: GenerationStage =
        GenerationStage.STREAMING_RESPONSE;
      let resultingStatusMessage: string = `Streaming response...`;
      if (currentThreadMessage) {
        ({ resultingGenerationStage, resultingStatusMessage } =
          await finishInProgressMessage(
            db,
            threadId,
            previousMessageId,
            currentThreadMessage.id,
            finalThreadMessage,
            logger,
          ));
      }
      const componentDecision = finalThreadMessage.component;
      if (componentDecision && isSystemToolCall(toolCallRequest, allTools)) {
        // Track system tool call within stream
        Sentry.addBreadcrumb({
          message: `Handling system tool call in stream: ${toolCallRequest.toolName}`,
          category: "tools.system",
          level: "info",
          data: { threadId, toolName: toolCallRequest.toolName },
        });

        // Yield a "final" version of the tool call request, because we need
        // actionType to be set, but hide the toplevel tool call request because
        // we are handling it server side
        const finalThreadMessageDto: AdvanceThreadResponseDto = {
          responseMessageDto: {
            ...finalThreadMessage,
            content: convertContentPartToDto(finalThreadMessage.content),
            componentState: finalThreadMessage.componentState ?? {},
            toolCallRequest: undefined,
            tool_call_id: undefined,
          },
          generationStage: resultingGenerationStage,
          statusMessage: resultingStatusMessage,
          mcpAccessToken,
        };
        yield finalThreadMessageDto;

        const toolCallId = finalThreadMessage.tool_call_id;

        if (!toolCallId) {
          console.warn(
            `While handling tool call request ${toolCallRequest.toolName}, no tool call id in response message ${finalThreadMessage}, returning assistant message`,
          );
          Sentry.captureMessage("Missing tool call ID in stream", "warning");
        }

        // Note that this effectively consumes nonStrictToolCallRequest and finalToolCallId
        const toolResponseMessageStream = await this.handleSystemToolCall(
          toolCallRequest,
          toolCallId ?? "",
          allTools,
          componentDecision,
          originalRequest,
          projectId,
          threadId,
          true,
          toolCallCounts,
        );

        for await (const chunk of toolResponseMessageStream) {
          yield chunk;
        }
        return;
      }

      // We only yield the final response with the tool call request and tool call id set if we did not call a system tool
      yield {
        responseMessageDto: {
          ...finalThreadMessage,
          content: convertContentPartToDto(finalThreadMessage.content),
          componentState: finalThreadMessage.componentState ?? {},
        },
        generationStage: resultingGenerationStage,
        statusMessage: resultingStatusMessage,
        mcpAccessToken,
      };
    } catch (error) {
      // Capture streaming errors with full context
      Sentry.withScope((scope) => {
        scope.setTag("operation", "handleAdvanceThreadStream");
        scope.setTag("projectId", projectId);
        scope.setTag("threadId", threadId);
        scope.setContext("streamContext", {
          messageCount: threadMessages.length,
          toolCallCount: Object.keys(toolCallCounts).length,
          userMessageRole: userMessage.role,
        });
        Sentry.captureException(error);
      });
      throw error;
    } finally {
      if (!ttfbEnded) {
        ttfbSpan.end();
        ttfbEnded = true;
      }
      // End the span
      span.end();
    }
  }

  private async ensureThread(
    projectId: string,
    threadId: string | undefined,
    contextKey: string | undefined,
    preventCreate: boolean = false,
  ): Promise<Thread> {
    // If the threadId is provided, ensure that the thread belongs to the project
    if (threadId) {
      await operations.ensureThreadByProjectId(
        this.getDb(),
        threadId,
        projectId,
        contextKey,
      );
      // TODO: should we update contextKey?
      const thread = await this.findOne(threadId, projectId);
      return thread;
    }

    if (preventCreate) {
      throw new Error("Thread ID is required, and cannot be created");
    }

    // If the threadId is not provided, create a new thread
    const newThread = await this.createThread(
      {
        projectId,
      },
      contextKey,
    );
    return newThread;
  }

  private async validateProjectAndProviderKeys(
    projectId: string,
    providerName: Provider,
    modelName?: string,
  ): Promise<string | undefined> {
    const projectWithKeys =
      await this.projectsService.findOneWithKeys(projectId);
    if (!projectWithKeys) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const providerKeys = projectWithKeys.getProviderKeys();

    if (!providerKeys.length) {
      if (providerName === "openai") {
        // Only allow fallback key for default model
        if (modelName !== DEFAULT_OPENAI_MODEL) {
          throw new NotFoundException(
            `No API key found for project ${projectId}. Free messages are only available for the default model (${DEFAULT_OPENAI_MODEL}). Please add your OpenAI API key to use other models.`,
          );
        }
        const fallbackKey = process.env.FALLBACK_OPENAI_API_KEY;
        if (!fallbackKey) {
          throw new NotFoundException(
            "No provider keys found for project and no fallback key configured",
          );
        }
        return fallbackKey;
      }
      this.logger.error(
        `No provider keys configured for project ${projectId}. An API key is required to proceed.`,
      );
      throw new NotFoundException(
        `No provider keys found for project ${projectId}. Please configure an API key.`,
      );
    }

    const chosenKey = providerKeys.find(
      (key) => key.providerName === providerName,
    );
    if (!chosenKey) {
      // Check for fallback key if OpenAI is requested
      if (providerName === "openai") {
        // Only allow fallback key for default model
        if (modelName !== DEFAULT_OPENAI_MODEL) {
          throw new NotFoundException(
            `No OpenAI API key found for project ${projectId}. Free messages are only available for the default model (${DEFAULT_OPENAI_MODEL}). Please add your OpenAI API key to use other models.`,
          );
        }
        const fallbackKey = process.env.FALLBACK_OPENAI_API_KEY;
        if (!fallbackKey) {
          throw new NotFoundException(
            `No OpenAI key found for project ${projectId} and no fallback key configured`,
          );
        }
        return fallbackKey;
      }

      throw new Error(
        `No key found for provider ${providerName} in project ${projectId}`,
      );
    }

    if (!chosenKey.providerKeyEncrypted) {
      this.logger.error(
        `Stored key for provider ${chosenKey.providerName} in project ${projectId} is empty or invalid.`,
      );
      throw new Error(
        `API key for provider ${chosenKey.providerName} in project ${projectId} is missing or empty.`,
      );
    }

    try {
      const providerKeySecret = this.configService.get<string>(
        "PROVIDER_KEY_SECRET",
      );
      if (!providerKeySecret) {
        throw new Error("PROVIDER_KEY_SECRET is not configured");
      }

      const { providerKey: decryptedKey } = decryptProviderKey(
        chosenKey.providerKeyEncrypted,
        providerKeySecret,
      );
      return decryptedKey;
    } catch (error) {
      this.logger.error(
        `Failed to decrypt API key for provider ${chosenKey.providerName} in project ${projectId}: ${error}`,
      );
      throw new Error(
        `API key decryption failed for project ${projectId}, provider ${chosenKey.providerName}. Ensure the key is correctly encrypted and the decryption key is available.`,
      );
    }
  }

  private async shouldIgnoreCancelledToolResponse(
    userMessage: MessageRequest,
    thread: Thread,
  ): Promise<boolean> {
    if (
      userMessage.role === MessageRole.Tool &&
      thread.generationStage === GenerationStage.CANCELLED
    ) {
      return true;
    }
    return false;
  }
}

const checkCancellationStatus = async (
  db: HydraDb,
  threadId: string,
  projectId: string,
  chunkCount: number,
  logger?: Logger,
) => {
  try {
    const generationStage = await operations.getThreadGenerationStage(
      db,
      threadId,
      projectId,
    );
    const isCancelled = generationStage === GenerationStage.CANCELLED;

    if (!isCancelled) {
      return null;
    }
    Sentry.addBreadcrumb({
      message: "Stream cancelled during processing",
      category: "stream",
      level: "warning",
      data: { threadId, chunksProcessed: chunkCount },
    });
    return isCancelled;
  } catch (error) {
    logger?.error(`Error checking thread cancellation status: ${error}`);
    Sentry.captureException(error, {
      tags: { operation: "checkCancellation", threadId },
    });
    // we assume that the thread is not cancelled if we cannot check the status
    return false;
  }
};

async function syncThreadStatus(
  db: HydraDatabase,
  threadId: string,
  messageId: string,
  projectId: string,
  chunkCount: number,
  currentThreadMessage: ThreadMessage,
  mcpAccessToken: string,
  logger?: Logger,
): Promise<AdvanceThreadResponseDto | undefined> {
  return await Sentry.startSpan(
    {
      name: "syncThreadStatus",
      op: "stream.syncThreadStatus",
      attributes: {
        threadId,
      },
    },
    async () => {
      // Update db message on interval
      const isCancelled = await checkCancellationStatus(
        db,
        threadId,
        projectId,
        chunkCount,
        logger,
      );

      if (isCancelled) {
        return {
          responseMessageDto: {
            ...currentThreadMessage,
            content: convertContentPartToDto(currentThreadMessage.content),
            componentState: currentThreadMessage.componentState ?? {},
          },
          generationStage: GenerationStage.CANCELLED,
          statusMessage: "cancelled",
          mcpAccessToken,
        };
      }

      await updateMessage(db, messageId, {
        ...currentThreadMessage,
        content: convertContentPartToDto(currentThreadMessage.content),
      });
    },
  );
}
