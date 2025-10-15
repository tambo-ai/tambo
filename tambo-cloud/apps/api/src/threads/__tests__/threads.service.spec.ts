import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { createTamboBackend } from "@tambo-ai-cloud/backend";
import {
  AgentProviderType,
  AiProviderType,
  AsyncQueue,
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
import { DATABASE } from "../../common/middleware/db-transaction-middleware";
import { AuthService } from "../../common/services/auth.service";
import { EmailService } from "../../common/services/email.service";
import { CorrelationLoggerService } from "../../common/services/logger.service";
import { ProjectsService } from "../../projects/projects.service";
import {
  AdvanceThreadDto,
  AdvanceThreadResponseDto,
} from "../dto/advance-thread.dto";
import { ThreadsService } from "../threads.service";

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
    addProjectLogEntry: jest.fn(),
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
      async (_db: any, input: typeof schema.messages.$inferInsert) => ({
        id: "u1",
        threadId: input.threadId,
        role: input.role,
        parentMessageId: input.parentMessageId ?? null,
        content: input.content,
        createdAt: new Date(),
        metadata: input.metadata ?? null,
        actionType: input.actionType ?? null,
        toolCallRequest: input.toolCallRequest ?? null,
        toolCallId: input.toolCallId ?? null,
        componentState: input.componentState ?? {},
        componentDecision: input.componentDecision ?? null,
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
            sendMessageLimitNotification: jest.fn(),
            sendFirstMessageEmail: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue("secret") },
        },
        {
          provide: AuthService,
          useValue: {
            generateMcpAccessToken: jest.fn().mockResolvedValue("mcp-token"),
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

    await expect(
      service.advanceThread(projectId, dto, undefined, true),
    ).rejects.toThrow("STOP_AFTER_INIT");

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
        true,
        {},
        undefined,
        undefined, // queue
        contextKey,
      ),
    ).rejects.toThrow("STOP_AFTER_INIT");

    const initArgs2 = mockedCreateTamboBackend.mock.calls[0];
    expect(initArgs2[2]).toBe(`${projectId}-${contextKey}`);
    expect(authService.generateMcpAccessToken).toHaveBeenCalledWith(
      projectId,
      threadId,
      contextKey,
    );
  });

  test("passes forceToolChoice parameter to decision loop", async () => {
    const dto = makeDto({
      withComponents: true,
      withClientTools: true,
      forceToolChoice: "someTool",
    });
    // Ensure backend instance is properly returned for this test
    jest
      .spyOn<any, any>(service as any, "createTamboBackendForThread")
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
      } as any);
    __testRunDecisionLoop__.mockImplementationOnce(() => {
      throw new Error("STOP_AFTER_INIT");
    });

    await expect(
      service.advanceThread(projectId, dto, undefined, false),
    ).rejects.toThrow("STOP_AFTER_INIT");

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
      const queue = new AsyncQueue<AdvanceThreadResponseDto>();

      // Mock generateStreamingResponse to push messages to the queue
      jest
        .spyOn<any, any>(service, "generateStreamingResponse")
        .mockImplementation(
          async (_p: any, _t: any, _db: any, _tb: any, providedQueue: any) => {
            // Simulate streaming multiple messages
            providedQueue.push({
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
            });
            providedQueue.push({
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
            });
          },
        );

      // Start the operation (don't await - it will run concurrently)
      // Pass undefined for threadId to avoid complex thread lookup mocking
      const advancePromise = service.advanceThread(
        projectId,
        dto,
        undefined, // let service create new thread
        true,
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
      expect(messages[0].responseMessageDto.content[0].text).toBe("Hello");
      expect(messages[0].generationStage).toBe(
        GenerationStage.STREAMING_RESPONSE,
      );
      expect(messages[1].responseMessageDto.content[0].text).toBe("World");
      expect(messages[1].generationStage).toBe(GenerationStage.COMPLETE);
    });

    test("properly finishes queue on successful completion", async () => {
      const dto = makeDto({ withComponents: false, withClientTools: false });
      const queue = new AsyncQueue<AdvanceThreadResponseDto>();

      jest
        .spyOn<any, any>(service, "generateStreamingResponse")
        .mockImplementation(
          async (_p: any, _t: any, _db: any, _tb: any, providedQueue: any) => {
            providedQueue.push({
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
            });
          },
        );

      const advancePromise = service.advanceThread(
        projectId,
        dto,
        undefined,
        true,
        {},
        undefined,
        queue,
      );

      const messages: any[] = [];
      for await (const msg of queue) {
        messages.push(msg);
      }

      await advancePromise;

      // Verify queue completed normally
      expect(messages).toHaveLength(1);

      // Try to iterate again - should complete immediately with no items
      const secondIteration: any[] = [];
      for await (const msg of queue) {
        secondIteration.push(msg);
      }
      expect(secondIteration).toHaveLength(0);
    });

    test("properly fails queue on error", async () => {
      const dto = makeDto({ withComponents: false, withClientTools: false });
      const queue = new AsyncQueue<AdvanceThreadResponseDto>();
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
        true,
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
      const queue = new AsyncQueue<AdvanceThreadResponseDto>();

      // Mock to push only one final message (similar to non-streaming behavior)
      jest
        .spyOn<any, any>(service, "generateStreamingResponse")
        .mockImplementation(
          async (_p: any, _t: any, _db: any, _tb: any, providedQueue: any) => {
            providedQueue.push({
              responseMessageDto: {
                id: "msg-final",
                role: MessageRole.Assistant,
                content: [{ type: ContentPartType.Text, text: "Final result" }],
                threadId,
                componentState: {},
                createdAt: new Date(),
              },
              generationStage: GenerationStage.COMPLETE,
              mcpAccessToken: "token-1",
            });
          },
        );

      const advancePromise = service.advanceThread(
        projectId,
        dto,
        undefined,
        true, // streaming enabled (but only one message pushed)
        {},
        undefined,
        queue,
      );

      // Consume from queue
      const messages: any[] = [];
      for await (const msg of queue) {
        messages.push(msg);
      }

      await advancePromise;

      // Should receive exactly one message
      expect(messages).toHaveLength(1);
      expect(messages[0].responseMessageDto.content[0].text).toBe(
        "Final result",
      );
      expect(messages[0].generationStage).toBe(GenerationStage.COMPLETE);
    });

    test("queue receives messages with correct structure", async () => {
      const dto = makeDto({ withComponents: true, withClientTools: true });
      const queue = new AsyncQueue<AdvanceThreadResponseDto>();

      jest
        .spyOn<any, any>(service, "generateStreamingResponse")
        .mockImplementation(
          async (_p: any, _t: any, _db: any, _tb: any, providedQueue: any) => {
            providedQueue.push({
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
            });
          },
        );

      const advancePromise = service.advanceThread(
        projectId,
        dto,
        undefined,
        true,
        {},
        undefined,
        queue,
      );

      const messages: any[] = [];
      for await (const msg of queue) {
        messages.push(msg);
      }

      await advancePromise;

      // Verify message structure
      expect(messages[0]).toMatchObject({
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
      });
    });
  });
});
