import { Test } from "@nestjs/testing";
import {
  ContentPartType,
  MessageRole,
  type ThreadMessage,
} from "@tambo-ai-cloud/core";
import type { operations as dbOperations } from "@tambo-ai-cloud/db";
import { DATABASE } from "../common/database-provider";
import { MemoryExtractionService } from "./memory-extraction.service";

// Mock the backend LLM call
jest.mock("@tambo-ai-cloud/backend", () => {
  const actual = jest.requireActual("@tambo-ai-cloud/backend");
  return {
    ...actual,
    callMemoryExtractionLLM: jest.fn(),
  };
});

const { callMemoryExtractionLLM }: { callMemoryExtractionLLM: jest.Mock } =
  jest.requireMock("@tambo-ai-cloud/backend");

// Mock DB operations
jest.mock("@tambo-ai-cloud/db", () => {
  const actual = jest.requireActual("@tambo-ai-cloud/db");
  return {
    ...actual,
    operations: {
      getActiveMemories: jest.fn(),
      createMemory: jest.fn(),
      createMemories: jest.fn(),
      evictExcessMemories: jest.fn(),
    } satisfies Partial<typeof dbOperations>,
  };
});

const {
  operations,
}: {
  operations: jest.Mocked<
    Pick<
      typeof dbOperations,
      | "getActiveMemories"
      | "createMemory"
      | "createMemories"
      | "evictExcessMemories"
    >
  >;
} = jest.requireMock("@tambo-ai-cloud/db");

function makeMessages(count: number): ThreadMessage[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `msg_${i}`,
    threadId: "thread_1",
    role: i % 2 === 0 ? MessageRole.User : MessageRole.Assistant,
    content: [{ type: ContentPartType.Text, text: `Message ${i}` }],
    createdAt: new Date(),
    componentState: {},
  }));
}

const mockBackend = {
  llmClient: { complete: jest.fn() },
  modelOptions: { provider: "openai", model: "gpt-4o" },
} as any;

describe("MemoryExtractionService", () => {
  let service: MemoryExtractionService;
  const projectId = "proj_1";
  const contextKey = "user_1";

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        MemoryExtractionService,
        {
          provide: DATABASE,
          useValue: {
            // Mock transaction to just execute the callback with the db itself
            transaction: jest.fn(
              async (cb: (tx: unknown) => Promise<unknown>) => await cb({}),
            ),
          },
        },
      ],
    }).compile();

    service = module.get(MemoryExtractionService);
  });

  test("calls LLM and creates memories from valid extraction", async () => {
    const extractedResponse = JSON.stringify({
      memories: [
        {
          content: "The user prefers dark mode",
          category: "preference",
          importance: 4,
        },
        {
          content: "The user works at Acme Corp",
          category: "fact",
          importance: 3,
        },
      ],
    });

    callMemoryExtractionLLM.mockResolvedValue(extractedResponse);
    operations.getActiveMemories.mockResolvedValue([]);
    operations.createMemories.mockResolvedValue([]);
    operations.evictExcessMemories.mockResolvedValue(0);

    await service.extractAndSaveMemories(
      projectId,
      contextKey,
      makeMessages(6),
      mockBackend,
    );

    expect(callMemoryExtractionLLM).toHaveBeenCalledTimes(1);
    expect(operations.createMemories).toHaveBeenCalledTimes(1);
    expect(operations.createMemories).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([
        expect.objectContaining({
          projectId,
          contextKey,
          content: "The user prefers dark mode",
          category: "preference",
          importance: 4,
        }),
        expect.objectContaining({
          projectId,
          contextKey,
          content: "The user works at Acme Corp",
          category: "fact",
          importance: 3,
        }),
      ]),
    );
    expect(operations.evictExcessMemories).toHaveBeenCalled();
  });

  test("deduplicates against existing memories (case-insensitive)", async () => {
    callMemoryExtractionLLM.mockResolvedValue(
      JSON.stringify({
        memories: [
          {
            content: "The user prefers dark mode",
            category: "preference",
            importance: 4,
          },
          { content: "A new fact", category: "fact", importance: 3 },
        ],
      }),
    );

    // Existing memory matches first extracted one (different case)
    operations.getActiveMemories.mockResolvedValue([
      {
        id: "mem_existing",
        projectId,
        contextKey,
        content: "THE USER PREFERS DARK MODE",
        category: "preference",
        importance: 4,

        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    operations.createMemories.mockResolvedValue([]);
    operations.evictExcessMemories.mockResolvedValue(0);

    await service.extractAndSaveMemories(
      projectId,
      contextKey,
      makeMessages(6),
      mockBackend,
    );

    // Only the non-duplicate should be created
    expect(operations.createMemories).toHaveBeenCalledTimes(1);
    expect(operations.createMemories).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([
        expect.objectContaining({ content: "A new fact" }),
      ]),
    );
    // Should NOT contain the duplicate
    const batchArg = operations.createMemories.mock.calls[0][1];
    expect(batchArg).toHaveLength(1);
  });

  test("handles LLM returning nothing gracefully", async () => {
    callMemoryExtractionLLM.mockResolvedValue(undefined);

    await service.extractAndSaveMemories(
      projectId,
      contextKey,
      makeMessages(6),
      mockBackend,
    );

    expect(operations.createMemories).not.toHaveBeenCalled();
  });

  test("handles LLM returning invalid JSON gracefully", async () => {
    callMemoryExtractionLLM.mockResolvedValue("not json at all");

    await service.extractAndSaveMemories(
      projectId,
      contextKey,
      makeMessages(6),
      mockBackend,
    );

    expect(operations.createMemories).not.toHaveBeenCalled();
  });

  test("handles LLM returning JSON that fails Zod validation", async () => {
    callMemoryExtractionLLM.mockResolvedValue(
      JSON.stringify({
        memories: [
          { content: "test", category: "instruction", importance: 3 }, // invalid category
        ],
      }),
    );

    await service.extractAndSaveMemories(
      projectId,
      contextKey,
      makeMessages(6),
      mockBackend,
    );

    expect(operations.createMemories).not.toHaveBeenCalled();
  });

  test("extracts JSON from markdown code blocks", async () => {
    const wrappedResponse =
      '```json\n{"memories": [{"content": "Likes TypeScript", "category": "preference", "importance": 3}]}\n```';
    callMemoryExtractionLLM.mockResolvedValue(wrappedResponse);
    operations.getActiveMemories.mockResolvedValue([]);
    operations.createMemories.mockResolvedValue([]);
    operations.evictExcessMemories.mockResolvedValue(0);

    await service.extractAndSaveMemories(
      projectId,
      contextKey,
      makeMessages(6),
      mockBackend,
    );

    expect(operations.createMemories).toHaveBeenCalledTimes(1);
    expect(operations.createMemories).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([
        expect.objectContaining({ content: "Likes TypeScript" }),
      ]),
    );
  });

  test("handles empty memories array from LLM", async () => {
    callMemoryExtractionLLM.mockResolvedValue(JSON.stringify({ memories: [] }));

    await service.extractAndSaveMemories(
      projectId,
      contextKey,
      makeMessages(6),
      mockBackend,
    );

    expect(operations.createMemories).not.toHaveBeenCalled();
    expect(operations.evictExcessMemories).not.toHaveBeenCalled();
  });
});
