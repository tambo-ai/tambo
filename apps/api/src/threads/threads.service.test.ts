import { NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { createTamboBackend } from "@tambo-ai-cloud/backend";
import {
  AgentProviderType,
  AiProviderType,
  AsyncQueue,
  ChatCompletionContentPart,
  ContentPartType,
  GenerationStage,
  MessageRole,
  OAuthValidationMode,
} from "@tambo-ai-cloud/core";
import { schema, type operations as dbOperations } from "@tambo-ai-cloud/db";
import {
  createMockDBMessage,
  createMockDBProject,
  createMockDBThread,
} from "@tambo-ai-cloud/testing";
import { DATABASE } from "../common/middleware/db-transaction-middleware";
import { AnalyticsService } from "../common/services/analytics.service";
import { AuthService } from "../common/services/auth.service";
import { EmailService } from "../common/services/email.service";
import { CorrelationLoggerService } from "../common/services/logger.service";
import { StorageConfigService } from "../common/services/storage-config.service";
import { ProjectsService } from "../projects/projects.service";
import { AdvanceThreadDto } from "./dto/advance-thread.dto";
import { StreamQueueItem } from "./dto/stream-queue-item";
import { ThreadsService } from "./threads.service";
import {
  FreeLimitReachedError,
  InvalidSuggestionRequestError,
  SuggestionGenerationError,
  SuggestionNotFoundException,
} from "./types/errors";

// Mock backend pieces (TamboBackend and helpers)
jest.mock("@tambo-ai-cloud/backend", () => {
  const actual = jest.requireActual("@tambo-ai-cloud/backend");
  const makeStream = () => ({
    async *[Symbol.asyncIterator]() {
      yield {
        id: "dec1",
        role: MessageRole.Assistant,
        message: "hello",
        componentState: {},
      } as any;
    },
  });
  const __testRunDecisionLoop__ = jest.fn().mockReturnValue(makeStream());
  const createTamboBackend = jest.fn().mockResolvedValue({
    runDecisionLoop: __testRunDecisionLoop__,
    generateSuggestions: jest.fn(),
    generateThreadName: jest.fn(),
    modelOptions: {
      provider: "openai",
      model: "gpt-4.1-2025-04-14",
      baseURL: undefined,
      maxInputTokens: undefined,
    },
  });
  return {
    ...actual,
    createTamboBackend,
    generateChainId: jest.fn().mockResolvedValue("chain-1"),
    __testRunDecisionLoop__,
  };
});

const {
  createTamboBackend: mockedCreateTamboBackend,
}: {
  createTamboBackend: jest.MockedFunction<typeof createTamboBackend>;
} = jest.requireMock("@tambo-ai-cloud/backend");

const { __testRunDecisionLoop__ }: { __testRunDecisionLoop__: jest.Mock } =
  jest.requireMock("@tambo-ai-cloud/backend");

// Helper function to create a properly-typed DBMessageWithSuggestions
function createDBMessageWithSuggestions(
  id: string,
  threadId: string,
  role: MessageRole,
  content: ChatCompletionContentPart[],
  suggestions: schema.DBSuggestion[] = [],
): schema.DBMessage & { suggestions: schema.DBSuggestion[] } {
  return {
    ...createMockDBMessage(id, threadId, role, content),
    suggestions,
  };
}

// Helper function to create a properly-typed DBThreadWithMessages
function createDBThreadWithMessages(
  threadId: string,
  projectId: string,
  generationStage: GenerationStage,
  messages: (schema.DBMessage & { suggestions: schema.DBSuggestion[] })[] = [],
): schema.DBThread & {
  messages: (schema.DBMessage & { suggestions: schema.DBSuggestion[] })[];
} {
  return {
    ...createMockDBThread(threadId, projectId, generationStage),
    messages,
  };
}

// Helper function to create a properly-typed DBSuggestion
function createDBSuggestion(
  id: string,
  messageId: string,
  title: string,
  detailedSuggestion: string,
): schema.DBSuggestion {
  return {
    id,
    messageId,
    title,
    detailedSuggestion,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Helper function to create a properly-typed DBMessageWithThread
function createDBMessageWithThread(
  id: string,
  threadId: string,
  role: MessageRole,
  content: ChatCompletionContentPart[],
  thread: schema.DBThread,
): schema.DBMessage & { thread: schema.DBThread } {
  return {
    ...createMockDBMessage(id, threadId, role, content),
    thread,
  };
}

// Mock DB operations used by the service
jest.mock("@tambo-ai-cloud/db", () => {
  const actual = jest.requireActual("@tambo-ai-cloud/db");
  const mockedOperations = {
    // threads
    createThread: jest.fn(),
    getThreadsByProject: jest.fn(),
    countThreadsByProject: jest.fn(),
    getThreadForProjectId: jest.fn(),
    updateThread: jest.fn(),
    deleteThread: jest.fn(),
    ensureThreadByProjectId: jest.fn(),
    getLatestMessage: jest.fn(),
    updateMessage: jest.fn(),
    updateThreadGenerationStatus: jest.fn(),
    getThreadGenerationStage: jest.fn(),

    // messages
    addMessage: jest.fn(),
    getMessages: jest.fn(),
    deleteMessage: jest.fn(),
    findPreviousToolCallMessage: jest.fn(),

    // suggestions
    getSuggestions: jest.fn(),
    createSuggestions: jest.fn(),
    getMessageWithAccess: jest.fn(),

    // usage / limits
    getProjectMessageUsage: jest.fn(),
    updateProjectMessageUsage: jest.fn(),
    incrementMessageCount: jest.fn(),
    hasUserReceivedFirstMessageEmail: jest.fn(),
    getProjectMembers: jest.fn(),

    // projects
    getProject: jest.fn(),

    // mcp/system tools
    getProjectMcpServers: jest.fn(),
    projectHasMcpServers: jest.fn(),
    addProjectLogEntry: jest.fn(),

    // component state
    updateMessageComponentState: jest.fn(),
  } satisfies Partial<typeof dbOperations>;
  return {
    ...actual,
    operations: mockedOperations,
    schema: actual.schema,
  };
});

// Access the mocked operations for configuring behavior in tests
const { operations }: { operations: jest.Mocked<typeof dbOperations> } =
  jest.requireMock("@tambo-ai-cloud/db");

// Intentionally do NOT mock systemTools or thread/message utils.

describe("ThreadsService.advanceThread initialization", () => {
  let module: TestingModule;
  let service: ThreadsService;
  let authService: AuthService;
  let _projectsService: ProjectsService;

  const projectId = "proj_1";
  const threadId = "thread_1";

  const baseMessage: AdvanceThreadDto["messageToAppend"] = {
    role: MessageRole.User,
    content: [{ type: ContentPartType.Text, text: "hi" }],
    componentState: {},
  };

  const makeDto = (opts?: {
    withComponents?: boolean;
    withClientTools?: boolean;
    forceToolChoice?: string;
  }): AdvanceThreadDto => ({
    messageToAppend: baseMessage,
    availableComponents: opts?.withComponents
      ? [
          {
            name: "CompA",
            description: "desc",
            contextTools: [],
            props: {},
          },
        ]
      : [],
    clientTools: opts?.withClientTools
      ? [
          {
            name: "client.tool",
            description: "c tool",
            parameters: [],
          },
        ]
      : [],
    forceToolChoice: opts?.forceToolChoice,
  });

  const fakeDb = {
    transaction: async (fn: any) => fn(fakeDb),
    query: {
      threads: {
        findFirst: jest.fn().mockResolvedValue({
          id: threadId,
          projectId,
          generationStage: GenerationStage.COMPLETE,
        }),
      },
      projectMembers: {
        findFirst: jest.fn(),
      },
    },
  };

  const prevFallbackOpenaiApiKey = process.env.FALLBACK_OPENAI_API_KEY;
  beforeAll(() => {
    process.env.FALLBACK_OPENAI_API_KEY = "sk-fallback";
  });
  afterAll(() => {
    process.env.FALLBACK_OPENAI_API_KEY = prevFallbackOpenaiApiKey;
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    // Re-seed DB thread lookup after clearing mocks
    jest.mocked(fakeDb.query.threads.findFirst).mockResolvedValue({
      id: threadId,
      projectId,
      generationStage: GenerationStage.COMPLETE,
    });

    // Default operations behavior
    operations.createThread.mockResolvedValue(
      createMockDBThread(threadId, projectId, GenerationStage.COMPLETE),
    );
    operations.getProjectMessageUsage.mockResolvedValue({
      messageCount: 2,
      hasApiKey: true,
      firstMessageSentAt: new Date(),
      createdAt: new Date(),
      notificationSentAt: null,
      updatedAt: new Date(),
      projectId,
    });
    operations.getProject.mockResolvedValue(
      createMockDBProject(projectId, {
        name: "My Project",
        agentProviderType: AgentProviderType.MASTRA,
        defaultLlmProviderName: "openai",
        defaultLlmModelName: "gpt-4.1-2025-04-14",
        oauthValidationMode: OAuthValidationMode.NONE,
        providerType: AiProviderType.LLM,
        maxToolCallLimit: 7,
        creatorId: "user_1",
      }),
    );
    operations.getProjectMcpServers.mockResolvedValue([]);
    operations.projectHasMcpServers.mockResolvedValue(false);
    operations.getThreadForProjectId.mockResolvedValue({
      ...createMockDBThread(threadId, projectId, GenerationStage.COMPLETE),
      messages: [],
    });
    operations.getMessages.mockResolvedValue([
      createMockDBMessage("m1", threadId, MessageRole.User, [
        { type: "text", text: "hi" },
      ]),
    ]);

    operations.addMessage.mockImplementation(
      async (_db: any, threadIdInput: string, input: any) => ({
        id: "u1",
        threadId: threadIdInput,
        role: input.role,
        parentMessageId: input.parentMessageId ?? null,
        content: input.content,
        createdAt: new Date(),
        metadata: input.metadata ?? null,
        actionType: input.actionType ?? null,
        toolCallRequest: input.toolCallRequest ?? null,
        toolCallId: input.tool_call_id ?? null,
        componentState: input.componentState ?? {},
        componentDecision: input.component ?? null,
        error: input.error ?? null,
        isCancelled: input.isCancelled ?? false,
        additionalContext: input.additionalContext ?? {},
        reasoning: input.reasoning ?? null,
        reasoningDurationMS: input.reasoningDurationMS ?? null,
      }),
    );

    module = await Test.createTestingModule({
      providers: [
        ThreadsService,
        { provide: DATABASE, useValue: fakeDb },
        {
          provide: CorrelationLoggerService,
          useValue: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
        },
        {
          provide: EmailService,
          useValue: {
            sendMessageLimitNotification: jest
              .fn()
              .mockResolvedValue({ success: true }),
            sendFirstMessageEmail: jest
              .fn()
              .mockResolvedValue({ success: true }),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue("secret") },
        },
        {
          provide: AuthService,
          useValue: {
            generateMcpAccessToken: jest
              .fn()
              .mockImplementation(async (projectId, options) => {
                const hasSession = "threadId" in options;
                return await Promise.resolve({
                  token: "mcp-token",
                  expiresAt: Date.now() + 15 * 60 * 1000,
                  hasSession,
                });
              }),
          },
        },
        {
          provide: ProjectsService,
          useValue: {
            findOneWithKeys: jest
              .fn()
              .mockResolvedValue({ getProviderKeys: () => [] }),
            findOne: jest.fn().mockResolvedValue({
              id: projectId,
              defaultLlmProviderName: "openai",
              defaultLlmModelName: "gpt-4.1-2025-04-14",
              customLlmModelName: null,
              customLlmBaseURL: null,
              maxInputTokens: undefined,
              maxToolCallLimit: 7,
              customInstructions: undefined,
              getProviderKeys: () => [],
            }),
          },
        },
        {
          provide: StorageConfigService,
          useValue: {
            s3Client: undefined,
            bucket: "test-bucket",
            signingSecret: "",
            hasStorageConfig: () => false,
          },
        },
        {
          provide: AnalyticsService,
          useValue: {
            capture: jest.fn(),
            identify: jest.fn(),
            isEnabled: jest.fn().mockReturnValue(false),
          },
        },
      ],
    }).compile();

    service = module.get(ThreadsService);
    authService = module.get(AuthService);
    _projectsService = module.get(ProjectsService);
  });

  afterEach(async () => {
    await module.close();
  });

  test("retrieves MCP system tools from database", async () => {
    const dto = makeDto({ withComponents: false, withClientTools: false });

    // Stop execution before hitting complex streaming logic
    jest
      .spyOn<any, any>(service, "generateStreamingResponse")
      .mockImplementation(async () => {
        throw new Error("STOP_AFTER_INIT");
      });

    await expect(service.advanceThread(projectId, dto)).rejects.toThrow(
      "STOP_AFTER_INIT",
    );

    // Verify system tools were retrieved from database
    expect(operations.getProjectMcpServers).toHaveBeenCalledWith(
      fakeDb,
      projectId,
      null,
    );
  });

  test("uses contextKey in backend user id and MCP token generation", async () => {
    const dto = makeDto();
    const contextKey = "ctx_123";

    // Mock that MCP servers exist so token generation is called
    operations.projectHasMcpServers.mockResolvedValue(true);

    jest
      .spyOn<any, any>(service, "generateStreamingResponse")
      .mockImplementation(async () => {
        throw new Error("STOP_AFTER_INIT");
      });

    await expect(
      service.advanceThread(
        projectId,
        dto,
        undefined,
        {},
        undefined,
        undefined, // queue
        contextKey,
      ),
    ).rejects.toThrow("STOP_AFTER_INIT");

    const initArgs2 = mockedCreateTamboBackend.mock.calls[0];
    expect(initArgs2[2]).toBe(`${projectId}-${contextKey}`);
    expect(authService.generateMcpAccessToken).toHaveBeenCalledWith(projectId, {
      threadId,
    });
  });

  test("passes forceToolChoice parameter to decision loop", async () => {
    const dto = makeDto({
      withComponents: true,
      withClientTools: true,
      forceToolChoice: "someTool",
    });
    // Ensure backend instance is properly returned for this test
    jest
      .spyOn<any, any>(service, "createTamboBackendForThread")
      .mockResolvedValue({
        runDecisionLoop: __testRunDecisionLoop__,
        generateSuggestions: jest.fn(),
        generateThreadName: jest.fn(),
        modelOptions: {
          provider: "openai",
          model: "gpt-4.1-2025-04-14",
          baseURL: undefined,
          maxInputTokens: undefined,
        },
      });
    __testRunDecisionLoop__.mockImplementationOnce(() => {
      throw new Error("STOP_AFTER_INIT");
    });

    await expect(service.advanceThread(projectId, dto)).rejects.toThrow(
      "STOP_AFTER_INIT",
    );

    expect(__testRunDecisionLoop__).toHaveBeenCalledTimes(1);
    const callArg = __testRunDecisionLoop__.mock.calls[0][0];
    expect(callArg).toEqual(
      expect.objectContaining({
        messages: expect.any(Array),
        strictTools: expect.any(Array),
        forceToolChoice: "someTool",
      }),
    );
  });

  describe("Queue-based streaming behavior", () => {
    test("pushes messages to queue during streaming execution", async () => {
      const dto = makeDto({ withComponents: false, withClientTools: false });
      const queue = new AsyncQueue<StreamQueueItem>();

      // Mock generateStreamingResponse to push messages to the queue
      jest
        .spyOn<any, any>(service, "generateStreamingResponse")
        .mockImplementation(
          async (_p: any, _t: any, _db: any, _tb: any, providedQueue: any) => {
            // Simulate streaming multiple messages
            providedQueue.push({
              response: {
                responseMessageDto: {
                  id: "msg-1",
                  role: MessageRole.Assistant,
                  content: [{ type: ContentPartType.Text, text: "Hello" }],
                  threadId,
                  componentState: {},
                  createdAt: new Date(),
                },
                generationStage: GenerationStage.STREAMING_RESPONSE,
                mcpAccessToken: "token-1",
              },
              aguiEvents: [],
            });
            providedQueue.push({
              response: {
                responseMessageDto: {
                  id: "msg-2",
                  role: MessageRole.Assistant,
                  content: [{ type: ContentPartType.Text, text: "World" }],
                  threadId,
                  componentState: {},
                  createdAt: new Date(),
                },
                generationStage: GenerationStage.COMPLETE,
                mcpAccessToken: "token-1",
              },
              aguiEvents: [],
            });
          },
        );

      // Start the operation (don't await - it will run concurrently)
      // Pass undefined for threadId to avoid complex thread lookup mocking
      const advancePromise = service.advanceThread(
        projectId,
        dto,
        undefined, // let service create new thread
        {},
        undefined,
        queue,
      );

      // Consume from the queue
      const messages: any[] = [];
      for await (const msg of queue) {
        messages.push(msg);
      }

      // Wait for the advance operation to complete
      await advancePromise;

      // Verify we received both messages in order
      expect(messages).toHaveLength(2);
      expect(messages[0].response.responseMessageDto.content[0].text).toBe(
        "Hello",
      );
      expect(messages[0].response.generationStage).toBe(
        GenerationStage.STREAMING_RESPONSE,
      );
      expect(messages[1].response.responseMessageDto.content[0].text).toBe(
        "World",
      );
      expect(messages[1].response.generationStage).toBe(
        GenerationStage.COMPLETE,
      );
    });

    test("properly finishes queue on successful completion", async () => {
      const dto = makeDto({ withComponents: false, withClientTools: false });
      const queue = new AsyncQueue<StreamQueueItem>();

      jest
        .spyOn<any, any>(service, "generateStreamingResponse")
        .mockImplementation(
          async (_p: any, _t: any, _db: any, _tb: any, providedQueue: any) => {
            providedQueue.push({
              response: {
                responseMessageDto: {
                  id: "msg-1",
                  role: MessageRole.Assistant,
                  content: [{ type: ContentPartType.Text, text: "Done" }],
                  threadId,
                  componentState: {},
                  createdAt: new Date(),
                },
                generationStage: GenerationStage.COMPLETE,
                mcpAccessToken: "token-1",
              },
              aguiEvents: [],
            });
          },
        );

      const advancePromise = service.advanceThread(
        projectId,
        dto,
        undefined,
        {},
        undefined,
        queue,
      );

      const messages: StreamQueueItem[] = [];
      for await (const msg of queue) {
        messages.push(msg);
      }

      await advancePromise;

      // Verify queue completed normally
      expect(messages).toHaveLength(1);

      // Try to iterate again - should complete immediately with no items
      const secondIteration: StreamQueueItem[] = [];
      for await (const msg of queue) {
        secondIteration.push(msg);
      }
      expect(secondIteration).toHaveLength(0);
    });

    test("properly fails queue on error", async () => {
      const dto = makeDto({ withComponents: false, withClientTools: false });
      const queue = new AsyncQueue<StreamQueueItem>();
      const testError = new Error("Test error during generation");

      jest
        .spyOn<any, any>(service, "generateStreamingResponse")
        .mockImplementation(async () => {
          throw testError;
        });

      // Start the operation
      const advancePromise = service.advanceThread(
        projectId,
        dto,
        undefined,
        {},
        undefined,
        queue,
      );

      // Try to consume from queue - should receive the error
      await expect(async () => {
        for await (const _msg of queue) {
          // Should not receive any messages
        }
      }).rejects.toThrow("Test error during generation");

      // The advance operation itself should also complete (not hang)
      await expect(advancePromise).rejects.toThrow(
        "Test error during generation",
      );
    });

    test("queue works with single final message", async () => {
      const dto = makeDto({ withComponents: false, withClientTools: false });
      const queue = new AsyncQueue<StreamQueueItem>();

      // Mock to push only one final message (similar to non-streaming behavior)
      jest
        .spyOn<any, any>(service, "generateStreamingResponse")
        .mockImplementation(
          async (_p: any, _t: any, _db: any, _tb: any, providedQueue: any) => {
            providedQueue.push({
              response: {
                responseMessageDto: {
                  id: "msg-final",
                  role: MessageRole.Assistant,
                  content: [
                    { type: ContentPartType.Text, text: "Final result" },
                  ],
                  threadId,
                  componentState: {},
                  createdAt: new Date(),
                },
                generationStage: GenerationStage.COMPLETE,
                mcpAccessToken: "token-1",
              },
              aguiEvents: [],
            });
          },
        );

      const advancePromise = service.advanceThread(
        projectId,
        dto,
        undefined,
        {},
        undefined,
        queue,
      );

      // Consume from queue
      const messages: StreamQueueItem[] = [];
      for await (const msg of queue) {
        messages.push(msg);
      }

      await advancePromise;

      // Should receive exactly one message
      expect(messages).toHaveLength(1);
      expect(messages[0].response.responseMessageDto.content[0].text).toBe(
        "Final result",
      );
      expect(messages[0].response.generationStage).toBe(
        GenerationStage.COMPLETE,
      );
    });

    test("queue receives messages with correct structure", async () => {
      const dto = makeDto({ withComponents: true, withClientTools: true });
      const queue = new AsyncQueue<StreamQueueItem>();

      jest
        .spyOn<any, any>(service, "generateStreamingResponse")
        .mockImplementation(
          async (_p: any, _t: any, _db: any, _tb: any, providedQueue: any) => {
            providedQueue.push({
              response: {
                responseMessageDto: {
                  id: "msg-test",
                  role: MessageRole.Assistant,
                  content: [{ type: ContentPartType.Text, text: "Response" }],
                  threadId,
                  componentState: { someState: "value" },
                  createdAt: new Date(),
                },
                generationStage: GenerationStage.COMPLETE,
                statusMessage: "Complete",
                mcpAccessToken: "test-token",
              },
              aguiEvents: [],
            });
          },
        );

      const advancePromise = service.advanceThread(
        projectId,
        dto,
        undefined,
        {},
        undefined,
        queue,
      );

      const messages: StreamQueueItem[] = [];
      for await (const msg of queue) {
        messages.push(msg);
      }

      await advancePromise;

      // Verify message structure
      expect(messages[0]).toMatchObject({
        response: expect.objectContaining({
          responseMessageDto: expect.objectContaining({
            id: expect.any(String),
            role: MessageRole.Assistant,
            content: expect.any(Array),
            threadId: expect.any(String),
            componentState: expect.any(Object),
            createdAt: expect.any(Date),
          }),
          generationStage: expect.any(String),
          mcpAccessToken: expect.any(String),
        }),
      });
    });

    test("includes mcpAccessToken when MCP servers are configured", async () => {
      const dto = makeDto();
      const queue = new AsyncQueue<StreamQueueItem>();

      // Mock that MCP servers exist for this project
      operations.projectHasMcpServers.mockResolvedValue(true);

      // Mock generateStreamingResponse to push a message with mcpAccessToken
      jest
        .spyOn<any, any>(service, "generateStreamingResponse")
        .mockImplementation(
          async (_p: any, _t: any, _db: any, _tb: any, providedQueue: any) => {
            providedQueue.push({
              response: {
                responseMessageDto: {
                  id: "msg-test",
                  role: MessageRole.Assistant,
                  content: [{ type: ContentPartType.Text, text: "Response" }],
                  threadId,
                  componentState: {},
                  createdAt: new Date(),
                },
                generationStage: GenerationStage.COMPLETE,
                statusMessage: "Complete",
                mcpAccessToken: "test-mcp-token",
              },
              aguiEvents: [],
            });
          },
        );

      const advancePromise = service.advanceThread(
        projectId,
        dto,
        undefined,
        {},
        undefined,
        queue,
      );

      const messages: StreamQueueItem[] = [];
      for await (const msg of queue) {
        messages.push(msg);
      }

      await advancePromise;

      // Verify that mcpAccessToken is included
      expect(messages[0].response).toHaveProperty("mcpAccessToken");
      expect(messages[0].response.mcpAccessToken).toBeDefined();
      expect(typeof messages[0].response.mcpAccessToken).toBe("string");
    });

    test("does not include mcpAccessToken when no MCP servers are configured", async () => {
      const dto = makeDto();
      const queue = new AsyncQueue<StreamQueueItem>();

      // Mock that NO MCP servers exist for this project
      operations.projectHasMcpServers.mockResolvedValue(false);

      // Mock generateStreamingResponse to push a message WITHOUT mcpAccessToken
      jest
        .spyOn<any, any>(service, "generateStreamingResponse")
        .mockImplementation(
          async (_p: any, _t: any, _db: any, _tb: any, providedQueue: any) => {
            providedQueue.push({
              response: {
                responseMessageDto: {
                  id: "msg-test",
                  role: MessageRole.Assistant,
                  content: [{ type: ContentPartType.Text, text: "Response" }],
                  threadId,
                  componentState: {},
                  createdAt: new Date(),
                },
                generationStage: GenerationStage.COMPLETE,
                statusMessage: "Complete",
                // No mcpAccessToken here
              },
              aguiEvents: [],
            });
          },
        );

      const advancePromise = service.advanceThread(
        projectId,
        dto,
        undefined,
        {},
        undefined,
        queue,
      );

      const messages: StreamQueueItem[] = [];
      for await (const msg of queue) {
        messages.push(msg);
      }

      await advancePromise;

      // Verify that mcpAccessToken is NOT included
      expect(messages[0].response).not.toHaveProperty("mcpAccessToken");
    });

    test("excludes attachment fetcher from resourceFetchers when storage is not configured", async () => {
      const dto = makeDto();

      const storageConfig = module.get(StorageConfigService);
      const hasStorageConfigSpy = jest
        .spyOn(storageConfig, "hasStorageConfig")
        .mockReturnValue(false);

      const runDecisionLoopMock = jest.fn().mockImplementation(() => {
        throw new Error("STOP_ATTACHMENT_CHECK");
      });

      const backendMock = {
        runDecisionLoop: runDecisionLoopMock,
        modelOptions: { provider: "openai", model: "gpt-4o" },
        llmClient: {
          complete: jest.fn().mockResolvedValue({
            message: { content: "" },
          }),
        },
        generateSuggestions: jest.fn(),
        generateThreadName: jest.fn(),
      } as const;

      const backendSpy = jest
        .spyOn<any, any>(service, "createTamboBackendForThread")
        .mockResolvedValue(backendMock);

      try {
        await expect(service.advanceThread(projectId, dto)).rejects.toThrow(
          "STOP_ATTACHMENT_CHECK",
        );

        expect(hasStorageConfigSpy).toHaveBeenCalled();
        expect(runDecisionLoopMock).toHaveBeenCalledTimes(1);
        const [{ resourceFetchers }] = runDecisionLoopMock.mock.calls[0];
        expect(resourceFetchers).not.toHaveProperty("attachment");
      } finally {
        backendSpy.mockRestore();
        hasStorageConfigSpy.mockRestore();
      }
    });

    test("includes attachment fetcher in resourceFetchers when storage is configured", async () => {
      const dto = makeDto();

      const storageConfig = module.get(StorageConfigService);
      const mutableStorageConfig = storageConfig as StorageConfigService & {
        s3Client: unknown;
        bucket: string;
        signingSecret: string;
      };
      const originalState = {
        s3Client: mutableStorageConfig.s3Client,
        bucket: mutableStorageConfig.bucket,
        signingSecret: mutableStorageConfig.signingSecret,
      };
      mutableStorageConfig.s3Client = {
        send: jest.fn(),
        config: {} as any,
        destroy: jest.fn(),
        middlewareStack: {} as any,
      };
      mutableStorageConfig.bucket = "test-bucket";
      mutableStorageConfig.signingSecret = "test-secret";

      const hasStorageConfigSpy = jest
        .spyOn(storageConfig, "hasStorageConfig")
        .mockReturnValue(true);

      const runDecisionLoopMock = jest.fn().mockImplementation(() => {
        throw new Error("STOP_ATTACHMENT_CHECK_TRUE");
      });

      const backendMock = {
        runDecisionLoop: runDecisionLoopMock,
        modelOptions: { provider: "openai", model: "gpt-4o" },
        llmClient: {
          complete: jest.fn().mockResolvedValue({
            message: { content: "" },
          }),
        },
        generateSuggestions: jest.fn(),
        generateThreadName: jest.fn(),
      } as const;

      const backendSpy = jest
        .spyOn<any, any>(service, "createTamboBackendForThread")
        .mockResolvedValue(backendMock);

      try {
        await expect(service.advanceThread(projectId, dto)).rejects.toThrow(
          "STOP_ATTACHMENT_CHECK_TRUE",
        );

        expect(hasStorageConfigSpy).toHaveBeenCalled();
        expect(runDecisionLoopMock).toHaveBeenCalledTimes(1);
        const [{ resourceFetchers }] = runDecisionLoopMock.mock.calls[0];
        expect(resourceFetchers).toHaveProperty("attachment");
        expect(typeof resourceFetchers.attachment).toBe("function");
      } finally {
        backendSpy.mockRestore();
        hasStorageConfigSpy.mockRestore();
        mutableStorageConfig.s3Client = originalState.s3Client;
        mutableStorageConfig.bucket = originalState.bucket;
        mutableStorageConfig.signingSecret = originalState.signingSecret;
      }
    });
  });

  describe("CRUD Operations", () => {
    describe("findAllForProject", () => {
      it("should return all threads for a project", async () => {
        const mockThreads = [
          createMockDBThread(threadId, projectId, GenerationStage.COMPLETE),
          createMockDBThread("thread_2", projectId, GenerationStage.IDLE),
        ];

        operations.getThreadsByProject.mockResolvedValue(mockThreads);

        const result = await service.findAllForProject(projectId);

        expect(result).toHaveLength(2);
        expect(result[0].id).toBe(threadId);
        expect(result[1].id).toBe("thread_2");
        expect(operations.getThreadsByProject).toHaveBeenCalledWith(
          fakeDb,
          projectId,
          {},
        );
      });

      it("should support pagination parameters", async () => {
        operations.getThreadsByProject.mockResolvedValue([]);

        await service.findAllForProject(projectId, {
          offset: 10,
          limit: 20,
          contextKey: "ctx_123",
        });

        expect(operations.getThreadsByProject).toHaveBeenCalledWith(
          fakeDb,
          projectId,
          {
            offset: 10,
            limit: 20,
            contextKey: "ctx_123",
          },
        );
      });

      it("should map thread fields correctly", async () => {
        const mockThread = {
          ...createMockDBThread(threadId, projectId, GenerationStage.COMPLETE),
          name: "My Thread",
          metadata: { key: "value" },
          contextKey: "ctx_test",
        };

        operations.getThreadsByProject.mockResolvedValue([mockThread]);

        const result = await service.findAllForProject(projectId);

        expect(result[0]).toMatchObject({
          id: threadId,
          name: "My Thread",
          metadata: { key: "value" },
          contextKey: "ctx_test",
          projectId,
        });
      });
    });

    describe("countThreadsByProject", () => {
      it("should return thread count for a project", async () => {
        operations.countThreadsByProject.mockResolvedValue(5);

        const count = await service.countThreadsByProject(projectId);

        expect(count).toBe(5);
        expect(operations.countThreadsByProject).toHaveBeenCalledWith(
          fakeDb,
          projectId,
          {},
        );
      });

      it("should support contextKey filter", async () => {
        operations.countThreadsByProject.mockResolvedValue(3);

        await service.countThreadsByProject(projectId, {
          contextKey: "ctx_user",
        });

        expect(operations.countThreadsByProject).toHaveBeenCalledWith(
          fakeDb,
          projectId,
          { contextKey: "ctx_user" },
        );
      });
    });

    describe("findOne", () => {
      it("should return thread with messages", async () => {
        const mockThread = createDBThreadWithMessages(
          threadId,
          projectId,
          GenerationStage.COMPLETE,
          [
            createDBMessageWithSuggestions("m1", threadId, MessageRole.User, [
              { type: "text", text: "Hello" },
            ]),
            createDBMessageWithSuggestions(
              "m2",
              threadId,
              MessageRole.Assistant,
              [{ type: "text", text: "Hi there" }],
            ),
          ],
        );

        operations.getThreadForProjectId.mockResolvedValue(mockThread);

        const result = await service.findOne(threadId, projectId);

        expect(result.id).toBe(threadId);
        expect(result.messages).toHaveLength(2);
        expect(result.messages[0].content[0]).toMatchObject({
          type: ContentPartType.Text,
          text: "Hello",
        });
      });

      it("should throw NotFoundException when thread not found", async () => {
        operations.getThreadForProjectId.mockResolvedValue(undefined);

        await expect(service.findOne(threadId, projectId)).rejects.toThrow(
          NotFoundException,
        );
      });

      it("should filter out system messages by default", async () => {
        // Mock the DB operation to return only non-system messages
        // (filtering happens at DB level now)
        const mockThread = createDBThreadWithMessages(
          threadId,
          projectId,
          GenerationStage.COMPLETE,
          [
            createDBMessageWithSuggestions("m2", threadId, MessageRole.User, [
              { type: "text", text: "User message" },
            ]),
          ],
        );

        operations.getThreadForProjectId.mockResolvedValue(mockThread);

        const result = await service.findOne(threadId, projectId);

        // Verify that getThreadForProjectId was called with includeSystem: false
        expect(operations.getThreadForProjectId).toHaveBeenCalledWith(
          fakeDb,
          threadId,
          projectId,
          undefined,
          false,
        );

        // Should only return the user message, not the system message
        expect(result.messages).toHaveLength(1);
        expect(result.messages[0].role).toBe(MessageRole.User);
      });

      it("should support contextKey parameter", async () => {
        const mockThread = createDBThreadWithMessages(
          threadId,
          projectId,
          GenerationStage.COMPLETE,
          [],
        );

        operations.getThreadForProjectId.mockResolvedValue(mockThread);

        await service.findOne(threadId, projectId, "ctx_test");

        expect(operations.getThreadForProjectId).toHaveBeenCalledWith(
          fakeDb,
          threadId,
          projectId,
          "ctx_test",
          false,
        );
      });
    });

    describe("update", () => {
      it("should update thread metadata", async () => {
        const updateData = {
          metadata: { updated: true },
          name: "Updated Thread",
        };

        const updatedThread = createDBThreadWithMessages(
          threadId,
          projectId,
          GenerationStage.COMPLETE,
        );
        updatedThread.metadata = updateData.metadata;
        updatedThread.name = updateData.name;

        operations.updateThread.mockResolvedValue(updatedThread);

        const result = await service.update(threadId, {
          projectId,
          ...updateData,
        });

        expect(result.name).toBe("Updated Thread");
        expect(result.metadata).toEqual({ updated: true });
        expect(operations.updateThread).toHaveBeenCalledWith(
          fakeDb,
          threadId,
          expect.objectContaining(updateData),
        );
      });
    });

    describe("updateGenerationStage", () => {
      it("should update generation stage and status message", async () => {
        const updatedThread = createDBThreadWithMessages(
          threadId,
          projectId,
          GenerationStage.STREAMING_RESPONSE,
        );
        updatedThread.statusMessage = "Processing...";

        operations.updateThread.mockResolvedValue(updatedThread);

        await service.updateGenerationStage(
          threadId,
          GenerationStage.STREAMING_RESPONSE,
          "Processing...",
        );

        expect(operations.updateThread).toHaveBeenCalledWith(
          fakeDb,
          threadId,
          expect.objectContaining({
            generationStage: GenerationStage.STREAMING_RESPONSE,
            statusMessage: "Processing...",
          }),
        );
      });
    });

    describe("cancelThread", () => {
      it("should cancel thread and add empty assistant response for user message", async () => {
        const mockMessage = createMockDBMessage(
          "m1",
          threadId,
          MessageRole.User,
          [{ type: "text", text: "Question?" }],
        );

        const cancelledThread = createDBThreadWithMessages(
          threadId,
          projectId,
          GenerationStage.CANCELLED,
        );
        cancelledThread.statusMessage = "Thread advancement cancelled";

        operations.updateThread.mockResolvedValue(cancelledThread);
        operations.getLatestMessage.mockResolvedValue(mockMessage);
        operations.updateMessage.mockResolvedValue(mockMessage);
        operations.addMessage.mockResolvedValue(
          createMockDBMessage("m2", threadId, MessageRole.Assistant, [
            { type: "text", text: "" },
          ]),
        );

        const result = await service.cancelThread(threadId);

        expect(result.generationStage).toBe(GenerationStage.CANCELLED);
        expect(operations.updateMessage).toHaveBeenCalledWith(
          fakeDb,
          mockMessage.id,
          { isCancelled: true },
        );
        expect(operations.addMessage).toHaveBeenCalledWith(
          fakeDb,
          threadId,
          expect.objectContaining({
            role: MessageRole.Assistant,
            content: [{ type: ContentPartType.Text, text: "" }],
          }),
        );
      });

      it("should add empty tool response when cancelling during tool call", async () => {
        const mockToolCallMessage: schema.DBMessage = {
          ...createMockDBMessage("m1", threadId, MessageRole.Assistant, [
            { type: "text", text: "Calling tool..." },
          ]),
          toolCallRequest: {
            toolName: "test_tool",
            parameters: [],
          },
          toolCallId: "tc_123",
        };

        const cancelledThread = createDBThreadWithMessages(
          threadId,
          projectId,
          GenerationStage.CANCELLED,
        );

        operations.updateThread.mockResolvedValue(cancelledThread);
        operations.getLatestMessage.mockResolvedValue(mockToolCallMessage);
        operations.updateMessage.mockResolvedValue(mockToolCallMessage);
        operations.addMessage.mockResolvedValue(
          createMockDBMessage(
            "m2",
            threadId,
            MessageRole.Tool,
            [{ type: "text", text: "" }],
            { toolCallId: "tc_123" },
          ),
        );

        await service.cancelThread(threadId);

        // Check that operations.addMessage was called with the right structure
        expect(operations.addMessage).toHaveBeenCalledWith(
          fakeDb,
          threadId,
          expect.objectContaining({
            role: MessageRole.Tool,
            actionType: "tool_response",
            tool_call_id: "tc_123",
            content: [{ type: ContentPartType.Text, text: "" }],
          }),
        );
      });
    });

    describe("remove", () => {
      it("should delete thread", async () => {
        const deletedThread = createMockDBThread(
          threadId,
          projectId,
          GenerationStage.COMPLETE,
        );
        operations.deleteThread.mockResolvedValue(deletedThread);

        await service.remove(threadId);

        expect(operations.deleteThread).toHaveBeenCalledWith(fakeDb, threadId);
      });
    });
  });

  describe("Message Operations", () => {
    describe("getMessages", () => {
      it("should return messages for a thread", async () => {
        const mockMessages = [
          createMockDBMessage("m1", threadId, MessageRole.User, [
            { type: "text", text: "Hello" },
          ]),
          createMockDBMessage("m2", threadId, MessageRole.Assistant, [
            { type: "text", text: "Hi" },
          ]),
        ];

        operations.getMessages.mockResolvedValue(mockMessages);

        const result = await service.getMessages({ threadId });

        expect(result).toHaveLength(2);
        expect(result[0].content[0]).toMatchObject({
          type: ContentPartType.Text,
          text: "Hello",
        });
      });

      it("should filter out system messages by default", async () => {
        // Mock the DB operation to return only non-system messages
        // (filtering happens at DB level now)
        const mockMessages = [
          createMockDBMessage("m2", threadId, MessageRole.User, [
            { type: "text", text: "User" },
          ]),
        ];

        operations.getMessages.mockResolvedValue(mockMessages);

        const result = await service.getMessages({ threadId });

        // Verify that getMessages was called with includeSystem: false
        expect(operations.getMessages).toHaveBeenCalledWith(
          fakeDb,
          threadId,
          false,
          false,
        );

        expect(result).toHaveLength(1);
        expect(result[0].role).toBe(MessageRole.User);
      });

      it("should include system messages when requested", async () => {
        const mockMessages = [
          createMockDBMessage("m1", threadId, MessageRole.System, [
            { type: "text", text: "System" },
          ]),
          createMockDBMessage("m2", threadId, MessageRole.User, [
            { type: "text", text: "User" },
          ]),
        ];

        operations.getMessages.mockResolvedValue(mockMessages);

        const result = await service.getMessages({
          threadId,
          includeSystem: true,
        });

        // Verify that getMessages was called with includeSystem: true
        expect(operations.getMessages).toHaveBeenCalledWith(
          fakeDb,
          threadId,
          false,
          true,
        );

        expect(result).toHaveLength(2);
        expect(result[0].role).toBe(MessageRole.System);
      });
    });

    describe("deleteMessage", () => {
      it("should delete message by ID", async () => {
        const deletedMessage = createMockDBMessage(
          "msg_1",
          threadId,
          MessageRole.User,
          [{ type: "text", text: "test" }],
        );
        operations.deleteMessage.mockResolvedValue(deletedMessage);

        await service.deleteMessage("msg_1");

        expect(operations.deleteMessage).toHaveBeenCalledWith(fakeDb, "msg_1");
      });
    });

    describe("updateComponentState", () => {
      it("should update message component state", async () => {
        const messageId = "msg_1";
        const newState = { counter: 5, expanded: true };

        const updatedMessage = createMockDBMessage(
          messageId,
          threadId,
          MessageRole.Assistant,
          [{ type: "text", text: "Response" }],
        );
        updatedMessage.componentState = newState;

        operations.updateMessageComponentState.mockResolvedValue(
          updatedMessage,
        );

        const result = await service.updateComponentState(messageId, newState);

        expect(result.componentState).toEqual(newState);
        expect(operations.updateMessageComponentState).toHaveBeenCalledWith(
          fakeDb,
          messageId,
          newState,
        );
      });
    });
  });

  describe("Message Limits & Rate Limiting", () => {
    let emailService: EmailService;
    let projectsService: ProjectsService;

    beforeEach(() => {
      emailService = module.get(EmailService);
      projectsService = module.get(ProjectsService);

      // Set up default mocks for findOne and findOneWithKeys
      jest.mocked(projectsService.findOne).mockResolvedValue({
        id: projectId,
        name: "Test Project",
        defaultLlmProviderName: "openai",
        defaultLlmModelName: "gpt-4.1-2025-04-14",
        userId: "user_1",
        isTokenRequired: false,
        providerType: AiProviderType.LLM,
      });

      jest.mocked(projectsService.findOneWithKeys).mockResolvedValue({
        getProviderKeys: () => [],
      } as any);
    });

    it("should throw FreeLimitReachedError when limit exceeded without API key", async () => {
      operations.getProjectMessageUsage.mockResolvedValue({
        projectId,
        messageCount: 500, // Exactly at FREE_MESSAGE_LIMIT
        hasApiKey: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        firstMessageSentAt: new Date(),
        notificationSentAt: null,
      });

      const checkLimit = (service as any).checkMessageLimit_.bind(service);

      await expect(checkLimit(projectId)).rejects.toThrow(
        FreeLimitReachedError,
      );
    });

    it("should send notification email when limit reached for first time", async () => {
      jest.mocked(fakeDb.query.projectMembers.findFirst).mockResolvedValue({
        user: { id: "user_1", email: "user@test.com" },
      } as any);

      operations.getProjectMessageUsage.mockResolvedValue({
        projectId,
        messageCount: 500, // At FREE_MESSAGE_LIMIT
        hasApiKey: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        firstMessageSentAt: new Date(),
        notificationSentAt: null, // Not sent yet
      });

      jest.mocked(projectsService.findOne).mockResolvedValue({
        id: projectId,
        name: "Test Project",
        defaultLlmProviderName: "openai",
        defaultLlmModelName: "gpt-4.1-2025-04-14",
        userId: "user_1",
        isTokenRequired: false,
        providerType: AiProviderType.LLM,
      });

      const checkLimit = (service as any).checkMessageLimit_.bind(service);

      await expect(checkLimit(projectId)).rejects.toThrow(
        FreeLimitReachedError,
      );

      expect(emailService.sendMessageLimitNotification).toHaveBeenCalledWith(
        projectId,
        "user@test.com",
        "Test Project",
      );

      expect(operations.updateProjectMessageUsage).toHaveBeenCalledWith(
        fakeDb,
        projectId,
        expect.objectContaining({
          notificationSentAt: expect.any(Date),
        }),
      );
    });

    it("should not send duplicate notification emails", async () => {
      operations.getProjectMessageUsage.mockResolvedValue({
        projectId,
        messageCount: 500, // At FREE_MESSAGE_LIMIT
        hasApiKey: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        firstMessageSentAt: new Date(),
        notificationSentAt: new Date(), // Already sent
      });

      const checkLimit = (service as any).checkMessageLimit_.bind(service);

      await expect(checkLimit(projectId)).rejects.toThrow(
        FreeLimitReachedError,
      );

      expect(emailService.sendMessageLimitNotification).not.toHaveBeenCalled();
    });

    it("should send first message email for new projects", async () => {
      operations.getProject.mockResolvedValue(
        createMockDBProject(projectId, { name: "New Project" }),
      );

      // First call returns undefined (no usage)
      operations.getProjectMessageUsage.mockResolvedValue(undefined);

      // Mock the updateProjectMessageUsage calls
      operations.updateProjectMessageUsage
        .mockResolvedValueOnce({
          projectId,
          messageCount: 1,
          hasApiKey: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          firstMessageSentAt: null,
          notificationSentAt: null,
        })
        .mockResolvedValueOnce({
          projectId,
          messageCount: 1,
          hasApiKey: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          firstMessageSentAt: new Date(),
          notificationSentAt: null,
        });

      operations.getProjectMembers.mockResolvedValue({
        name: "New Project",
        members: [{ user: { id: "user_1", email: "user@test.com" } }],
      } as any);

      operations.hasUserReceivedFirstMessageEmail.mockResolvedValue(false);

      const checkLimit = (service as any).checkMessageLimit_.bind(service);
      await checkLimit(projectId);

      expect(emailService.sendFirstMessageEmail).toHaveBeenCalledWith(
        "user@test.com",
        null,
        "New Project",
      );

      // Check that updateProjectMessageUsage was called twice - once to create, once to update firstMessageSentAt
      expect(operations.updateProjectMessageUsage).toHaveBeenCalledTimes(2);
      expect(operations.updateProjectMessageUsage).toHaveBeenLastCalledWith(
        fakeDb,
        projectId,
        expect.objectContaining({
          firstMessageSentAt: expect.any(Date),
        }),
      );
    });

    it("should not send first message email if user already received it", async () => {
      operations.getProjectMessageUsage.mockResolvedValue({
        projectId,
        messageCount: 1,
        hasApiKey: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        firstMessageSentAt: null,
        notificationSentAt: null,
      });

      operations.getProjectMembers.mockResolvedValue({
        name: "Project",
        members: [{ user: { id: "user_1", email: "user@test.com" } }],
      } as any);

      operations.hasUserReceivedFirstMessageEmail.mockResolvedValue(true);

      const checkLimit = (service as any).checkMessageLimit_.bind(service);
      await checkLimit(projectId);

      expect(emailService.sendFirstMessageEmail).not.toHaveBeenCalled();
    });
  });

  describe("Suggestions", () => {
    const messageId = "msg_1";

    describe("getSuggestions", () => {
      it("should return suggestions for a message", async () => {
        const mockSuggestions = [
          createDBSuggestion(
            "s1",
            messageId,
            "Follow up question",
            "Ask about details",
          ),
          createDBSuggestion(
            "s2",
            messageId,
            "Different approach",
            "Try another way",
          ),
        ];

        const mockMessageWithThread = createDBMessageWithThread(
          messageId,
          threadId,
          MessageRole.Assistant,
          [{ type: "text", text: "Response" }],
          createMockDBThread(threadId, projectId, GenerationStage.COMPLETE),
        );

        operations.getMessageWithAccess.mockResolvedValue(
          mockMessageWithThread,
        );
        operations.getSuggestions.mockResolvedValue(mockSuggestions);

        const result = await service.getSuggestions(messageId);

        expect(result).toHaveLength(2);
        expect(result[0].title).toBe("Follow up question");
        expect(operations.getSuggestions).toHaveBeenCalledWith(
          fakeDb,
          messageId,
        );
      });

      it("should throw SuggestionNotFoundException when no suggestions exist", async () => {
        const mockMessageWithThread = createDBMessageWithThread(
          messageId,
          threadId,
          MessageRole.Assistant,
          [{ type: "text", text: "Response" }],
          createMockDBThread(threadId, projectId, GenerationStage.COMPLETE),
        );

        operations.getMessageWithAccess.mockResolvedValue(
          mockMessageWithThread,
        );
        operations.getSuggestions.mockResolvedValue([]);

        await expect(service.getSuggestions(messageId)).rejects.toThrow(
          SuggestionNotFoundException,
        );
      });

      it("should throw InvalidSuggestionRequestError when message not found", async () => {
        operations.getMessageWithAccess.mockResolvedValue(undefined);

        await expect(service.getSuggestions(messageId)).rejects.toThrow(
          InvalidSuggestionRequestError,
        );
      });

      it("should wrap database errors in SuggestionGenerationError", async () => {
        const mockMessageWithThread = createDBMessageWithThread(
          messageId,
          threadId,
          MessageRole.Assistant,
          [{ type: "text", text: "Response" }],
          createMockDBThread(threadId, projectId, GenerationStage.COMPLETE),
        );

        operations.getMessageWithAccess.mockResolvedValue(
          mockMessageWithThread,
        );
        operations.getSuggestions.mockRejectedValue(
          new Error("Database connection error"),
        );

        await expect(service.getSuggestions(messageId)).rejects.toThrow(
          SuggestionGenerationError,
        );
      });
    });

    describe("generateSuggestions", () => {
      it("should generate and save suggestions", async () => {
        const mockMessage = createMockDBMessage(
          messageId,
          threadId,
          MessageRole.Assistant,
          [{ type: "text", text: "Response" }],
        );

        const mockBackend = {
          generateSuggestions: jest.fn().mockResolvedValue({
            suggestions: [
              {
                title: "Generated suggestion 1",
                detailedSuggestion: "Details 1",
              },
              {
                title: "Generated suggestion 2",
                detailedSuggestion: "Details 2",
              },
            ],
          }),
          runDecisionLoop: jest.fn(),
          generateThreadName: jest.fn(),
          modelOptions: {
            provider: "openai",
            model: "gpt-4o",
          },
          llmClient: {} as any,
        };

        mockedCreateTamboBackend.mockResolvedValue(mockBackend as any);

        const threadWithContext = createMockDBThread(
          threadId,
          projectId,
          GenerationStage.COMPLETE,
        );
        threadWithContext.contextKey = "ctx_test";

        const mockMessageWithThread = createDBMessageWithThread(
          messageId,
          threadId,
          MessageRole.Assistant,
          [{ type: "text", text: "Response" }],
          threadWithContext,
        );

        operations.getMessageWithAccess.mockResolvedValue(
          mockMessageWithThread,
        );
        operations.getMessages.mockResolvedValue([mockMessage]);

        const mockSuggestions = [
          createDBSuggestion(
            "s1",
            messageId,
            "Generated suggestion 1",
            "Details 1",
          ),
          createDBSuggestion(
            "s2",
            messageId,
            "Generated suggestion 2",
            "Details 2",
          ),
        ];

        operations.createSuggestions.mockResolvedValue(mockSuggestions);

        jest.mocked(fakeDb.query.threads.findFirst).mockResolvedValue({
          id: threadId,
          projectId,
        });

        const result = await service.generateSuggestions(messageId, {
          maxSuggestions: 2,
        });

        expect(result).toHaveLength(2);
        expect(result[0].title).toBe("Generated suggestion 1");
        expect(mockBackend.generateSuggestions).toHaveBeenCalled();
        expect(operations.createSuggestions).toHaveBeenCalledWith(
          fakeDb,
          expect.arrayContaining([
            expect.objectContaining({
              messageId,
              title: "Generated suggestion 1",
            }),
          ]),
        );
      });

      it("should throw SuggestionGenerationError when no suggestions generated", async () => {
        const mockMessage = createMockDBMessage(
          messageId,
          threadId,
          MessageRole.Assistant,
          [{ type: "text", text: "Response" }],
        );

        const mockBackend = {
          generateSuggestions: jest.fn().mockResolvedValue({
            suggestions: [],
          }),
          runDecisionLoop: jest.fn(),
          generateThreadName: jest.fn(),
          modelOptions: {
            provider: "openai",
            model: "gpt-4o",
          },
          llmClient: {} as any,
        };

        mockedCreateTamboBackend.mockResolvedValue(mockBackend as any);

        const mockMessageWithThread = createDBMessageWithThread(
          messageId,
          threadId,
          MessageRole.Assistant,
          [{ type: "text", text: "Response" }],
          createMockDBThread(threadId, projectId, GenerationStage.COMPLETE),
        );

        operations.getMessageWithAccess.mockResolvedValue(
          mockMessageWithThread,
        );
        operations.getMessages.mockResolvedValue([mockMessage]);

        jest.mocked(fakeDb.query.threads.findFirst).mockResolvedValue({
          id: threadId,
          projectId,
        });

        await expect(
          service.generateSuggestions(messageId, { maxSuggestions: 3 }),
        ).rejects.toThrow(SuggestionGenerationError);
      });
    });
  });

  describe("generateThreadName", () => {
    it("should generate and update thread name", async () => {
      const mockMessages = [
        createDBMessageWithSuggestions("m1", threadId, MessageRole.User, [
          { type: "text", text: "How do I build a web app?" },
        ]),
        createDBMessageWithSuggestions("m2", threadId, MessageRole.Assistant, [
          { type: "text", text: "Here's how to build a web app..." },
        ]),
      ];

      const mockBackend = {
        generateThreadName: jest.fn().mockResolvedValue("Web App Development"),
        runDecisionLoop: jest.fn(),
        generateSuggestions: jest.fn(),
        modelOptions: {
          provider: "openai",
          model: "gpt-4o",
        },
        llmClient: {} as any,
      };

      mockedCreateTamboBackend.mockResolvedValue(mockBackend as any);

      const threadWithMessages = createDBThreadWithMessages(
        threadId,
        projectId,
        GenerationStage.COMPLETE,
        mockMessages,
      );

      operations.getThreadForProjectId.mockResolvedValue(threadWithMessages);
      operations.getMessages.mockResolvedValue(
        mockMessages.map((m) =>
          createMockDBMessage(m.id, threadId, m.role, m.content),
        ),
      );

      const updatedThread = createDBThreadWithMessages(
        threadId,
        projectId,
        GenerationStage.COMPLETE,
      );
      updatedThread.name = "Web App Development";

      operations.updateThread.mockResolvedValue(updatedThread);

      jest.mocked(fakeDb.query.threads.findFirst).mockResolvedValue({
        id: threadId,
        projectId,
      });

      const result = await service.generateThreadName(threadId, projectId);

      expect(result.name).toBe("Web App Development");
      expect(mockBackend.generateThreadName).toHaveBeenCalled();
      expect(operations.updateThread).toHaveBeenCalledWith(
        fakeDb,
        threadId,
        expect.objectContaining({
          name: "Web App Development",
        }),
      );
    });

    it("should throw NotFoundException when thread not found", async () => {
      operations.getThreadForProjectId.mockResolvedValue(undefined);

      await expect(
        service.generateThreadName(threadId, projectId),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException when no messages exist", async () => {
      const emptyThread = createDBThreadWithMessages(
        threadId,
        projectId,
        GenerationStage.COMPLETE,
        [],
      );

      operations.getThreadForProjectId.mockResolvedValue(emptyThread);
      operations.getMessages.mockResolvedValue([]);

      await expect(
        service.generateThreadName(threadId, projectId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
