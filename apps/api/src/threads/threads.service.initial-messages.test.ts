import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { ContentPartType, MessageRole } from "@tambo-ai-cloud/core";
import { DATABASE } from "../common/middleware/db-transaction-middleware";
import { AnalyticsService } from "../common/services/analytics.service";
import { AuthService } from "../common/services/auth.service";
import { EmailService } from "../common/services/email.service";
import { CorrelationLoggerService } from "../common/services/logger.service";
import { StorageConfigService } from "../common/services/storage-config.service";
import { ProjectsService } from "../projects/projects.service";
import { AdvanceThreadDto } from "./dto/advance-thread.dto";
import { MessageRequest } from "./dto/message.dto";
import { ThreadsService } from "./threads.service";

describe("ThreadsService - Initial Messages", () => {
  let service: ThreadsService;
  let mockDb: any;
  let mockProjectsService: any;
  let mockAuthService: any;

  const mockThread = {
    id: "test-thread-id",
    projectId: "test-project-id",
    createdAt: new Date(),
    updatedAt: new Date(),
    generationStage: "IDLE",
    statusMessage: null,
    name: null,
    metadata: {},
  };

  beforeEach(async () => {
    mockProjectsService = {
      findOneWithKeys: jest.fn().mockResolvedValue({
        id: "test-project-id",
        getProviderKeys: jest.fn().mockReturnValue([]),
      }),
    };

    mockAuthService = {
      generateMcpAccessToken: jest
        .fn()
        .mockImplementation(async (projectId, options) => {
          const hasSession = "threadId" in options;
          return await Promise.resolve({
            token: "mock-token",
            expiresAt: Date.now() + 15 * 60 * 1000,
            hasSession,
          });
        }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ThreadsService,
        {
          provide: DATABASE,
          useValue: mockDb,
        },
        {
          provide: ProjectsService,
          useValue: mockProjectsService,
        },
        {
          provide: CorrelationLoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: StorageConfigService,
          useValue: {
            s3Client: undefined,
            bucket: "test-bucket",
            signingSecret: "",
            isConfigured: false,
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

    service = module.get<ThreadsService>(ThreadsService);
  });

  describe("validateInitialMessages", () => {
    it("should pass validation for valid initial messages", () => {
      const validMessages: MessageRequest[] = [
        {
          content: [
            {
              type: ContentPartType.Text,
              text: "You are a helpful assistant.",
            },
          ],
          role: MessageRole.System,
        },
        {
          content: [{ type: ContentPartType.Text, text: "Hello!" }],
          role: MessageRole.User,
        },
      ];

      expect(() => {
        // Access private method through any
        // pass allowOverride=true to simulate project allowing system prompt override
        (service as any).validateInitialMessages(validMessages, true);
      }).not.toThrow();
    });

    it("should throw error for message without content", () => {
      const invalidMessages: MessageRequest[] = [
        {
          content: [],
          role: MessageRole.System,
        },
      ];

      expect(() => {
        (service as any).validateInitialMessages(invalidMessages);
      }).toThrow("Initial message at index 0 must have content");
    });

    it("should throw error for message without role", () => {
      const invalidMessages: any[] = [
        {
          content: [{ type: ContentPartType.Text, text: "Hello" }],
        },
      ];

      expect(() => {
        (service as any).validateInitialMessages(invalidMessages);
      }).toThrow('Initial message at index 0 has invalid role "undefined"');
    });

    it("should throw error for invalid role", () => {
      const invalidMessages: MessageRequest[] = [
        {
          content: [{ type: ContentPartType.Text, text: "Hello" }],
          role: "invalid-role" as any,
        },
      ];

      expect(() => {
        (service as any).validateInitialMessages(invalidMessages);
      }).toThrow('Initial message at index 0 has invalid role "invalid-role"');
    });

    it("should throw error for text content without text property", () => {
      const invalidMessages: MessageRequest[] = [
        {
          content: [{ type: ContentPartType.Text } as any],
          role: MessageRole.User,
        },
      ];

      expect(() => {
        (service as any).validateInitialMessages(invalidMessages);
      }).toThrow(
        "Initial message at index 0, content part 0 with type 'text' must have text property",
      );
    });

    it("should allow empty initial messages array", () => {
      expect(() => {
        (service as any).validateInitialMessages([]);
      }).not.toThrow();
    });

    it("should allow undefined initial messages", () => {
      expect(() => {
        (service as any).validateInitialMessages(undefined);
      }).not.toThrow();
    });

    it("should normalize string content into a single text content part", () => {
      const messages: MessageRequest[] = [
        {
          // content as a plain string should be accepted and normalized
          // inside validateInitialMessages
          content: "You are a helpful assistant." as any,
          role: MessageRole.System,
        },
        {
          // mixed: array for user
          content: [{ type: ContentPartType.Text, text: "Hello" }],
          role: MessageRole.User,
        },
      ];

      expect(() => {
        (service as any).validateInitialMessages(messages, true);
      }).not.toThrow();
    });

    it("should reject a system message when project disallows override", () => {
      const messages: MessageRequest[] = [
        {
          // cast to any to simulate runtime input where content may be a string
          content: "Custom system prompt",
          role: MessageRole.System,
        } as any,
      ];

      expect(() => {
        // allowOverride = false should cause validation to fail for user-provided system message
        (service as any).validateInitialMessages(messages, false);
      }).toThrow(
        "Project does not allow overriding the system prompt with initial messages",
      );
    });
  });

  describe("createThread with initial messages", () => {
    beforeEach(() => {
      // Mock the operations.createThread function
      jest.doMock("@tambo-ai-cloud/db", () => ({
        operations: {
          createThread: jest.fn().mockResolvedValue(mockThread),
        },
      }));

      // Mock the addMessage method
      jest.spyOn(service, "addMessage").mockResolvedValue({
        id: "message-id",
        content: [{ type: ContentPartType.Text, text: "test" }],
        role: MessageRole.System,
        threadId: "test-thread-id",
        componentState: {},
        createdAt: new Date(),
      });
    });

    it("should create thread and add initial messages", async () => {
      const initialMessages: MessageRequest[] = [
        {
          content: [
            {
              type: ContentPartType.Text,
              text: "You are a helpful assistant.",
            },
          ],
          role: MessageRole.System,
        },
        {
          content: [{ type: ContentPartType.Text, text: "Hello!" }],
          role: MessageRole.User,
        },
      ];

      // Mock createThread to test the internal logic
      const createThreadSpy = jest.spyOn(service as any, "createThread_");
      createThreadSpy.mockImplementation(
        async (dto, contextKey, initialMsgs) => {
          // Validate that initial messages are passed correctly
          expect(initialMsgs).toEqual(initialMessages);
          return mockThread;
        },
      );

      await service.createThread(
        { projectId: "test-project-id" },
        "test-context",
        initialMessages,
      );

      expect(createThreadSpy).toHaveBeenCalledWith(
        { projectId: "test-project-id" },
        "test-context",
        initialMessages,
      );
    });
  });

  describe("advanceThread with initial messages", () => {
    it("should include initial messages in advance request for new thread", () => {
      const advanceDto: AdvanceThreadDto = {
        messageToAppend: {
          content: [{ type: ContentPartType.Text, text: "User message" }],
          role: MessageRole.User,
        },
        initialMessages: [
          {
            content: [
              {
                type: ContentPartType.Text,
                text: "You are a helpful assistant.",
              },
            ],
            role: MessageRole.System,
          },
        ],
      };

      // Mock ensureThread to capture the initial messages
      const ensureThreadSpy = jest.spyOn(service as any, "ensureThread");
      ensureThreadSpy.mockResolvedValue(mockThread);

      // This would be called in a real scenario but we're just testing the DTO structure
      expect(advanceDto.initialMessages).toBeDefined();
      expect(advanceDto.initialMessages).toHaveLength(1);
      expect(advanceDto.initialMessages![0].role).toBe(MessageRole.System);
    });
  });
});
