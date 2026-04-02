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
      "getActiveMemories" | "createMemory" | "evictExcessMemories"
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
  // Use a unique contextKey per test to avoid rate limiting collisions
  // from the module-level Map that persists across tests
  let contextKey: string;
  let testCounter = 0;

  beforeEach(async () => {
    jest.clearAllMocks();
    testCounter++;
    contextKey = `user_${testCounter}`;

    const module = await Test.createTestingModule({
      providers: [
        MemoryExtractionService,
        { provide: DATABASE, useValue: {} }, // Fake DB - operations are mocked at module level
      ],
    }).compile();

    service = module.get(MemoryExtractionService);
  });

  test("skips extraction when conversation is too short", async () => {
    await service.extractAndSaveMemories(
      projectId,
      contextKey,
      makeMessages(2), // Only 2 messages, below minimum of 4
      mockBackend,
    );

    expect(callMemoryExtractionLLM).not.toHaveBeenCalled();
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
    operations.createMemory.mockResolvedValue({
      id: "mem_new",
      projectId,
      contextKey,
      content: "test",
      category: "fact",
      importance: 3,
      supersededBy: null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    operations.evictExcessMemories.mockResolvedValue(0);

    await service.extractAndSaveMemories(
      projectId,
      contextKey,
      makeMessages(6),
      mockBackend,
    );

    expect(callMemoryExtractionLLM).toHaveBeenCalledTimes(1);
    expect(operations.createMemory).toHaveBeenCalledTimes(2);
    expect(operations.createMemory).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        projectId,
        contextKey,
        content: "The user prefers dark mode",
        category: "preference",
        importance: 4,
      }),
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
        supersededBy: null,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    operations.createMemory.mockResolvedValue({
      id: "mem_new",
      projectId,
      contextKey,
      content: "A new fact",
      category: "fact",
      importance: 3,
      supersededBy: null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    operations.evictExcessMemories.mockResolvedValue(0);

    await service.extractAndSaveMemories(
      projectId,
      contextKey,
      makeMessages(6),
      mockBackend,
    );

    // Only the non-duplicate should be created
    expect(operations.createMemory).toHaveBeenCalledTimes(1);
    expect(operations.createMemory).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ content: "A new fact" }),
    );
  });

  test("handles LLM returning nothing gracefully", async () => {
    callMemoryExtractionLLM.mockResolvedValue(undefined);

    await service.extractAndSaveMemories(
      projectId,
      contextKey,
      makeMessages(6),
      mockBackend,
    );

    expect(operations.createMemory).not.toHaveBeenCalled();
  });

  test("handles LLM returning invalid JSON gracefully", async () => {
    callMemoryExtractionLLM.mockResolvedValue("not json at all");

    await service.extractAndSaveMemories(
      projectId,
      contextKey,
      makeMessages(6),
      mockBackend,
    );

    expect(operations.createMemory).not.toHaveBeenCalled();
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

    expect(operations.createMemory).not.toHaveBeenCalled();
  });

  test("extracts JSON from markdown code blocks", async () => {
    const wrappedResponse =
      '```json\n{"memories": [{"content": "Likes TypeScript", "category": "preference", "importance": 3}]}\n```';
    callMemoryExtractionLLM.mockResolvedValue(wrappedResponse);
    operations.getActiveMemories.mockResolvedValue([]);
    operations.createMemory.mockResolvedValue({
      id: "mem_1",
      projectId,
      contextKey,
      content: "Likes TypeScript",
      category: "preference",
      importance: 3,
      supersededBy: null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    operations.evictExcessMemories.mockResolvedValue(0);

    await service.extractAndSaveMemories(
      projectId,
      contextKey,
      makeMessages(6),
      mockBackend,
    );

    expect(operations.createMemory).toHaveBeenCalledTimes(1);
    expect(operations.createMemory).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ content: "Likes TypeScript" }),
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

    expect(operations.createMemory).not.toHaveBeenCalled();
    expect(operations.evictExcessMemories).not.toHaveBeenCalled();
  });
});
