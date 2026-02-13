/**
 * Tests for generatePlan orchestrator
 */

import { jest } from "@jest/globals";
import type { ProjectAnalysis } from "../project-analysis/types.js";

// Mock client-core module BEFORE importing index
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockCreateTamboClient = jest.fn() as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockExecuteRun = jest.fn() as any;

jest.unstable_mockModule("@tambo-ai/client-core", () => ({
  createTamboClient: mockCreateTamboClient,
  executeRun: mockExecuteRun,
}));

// Dynamic import after mocking
const { generatePlan } = await import("./index.js");

describe("generatePlan", () => {
  const mockProjectAnalysis: ProjectAnalysis = {
    framework: {
      name: "next",
      displayName: "Next.js",
      envPrefix: "NEXT_PUBLIC_",
    },
    typescript: {
      isTypeScript: true,
      configPath: "/tsconfig.json",
      strict: true,
    },
    packageManager: "npm",
    structure: {
      hasSrcDir: true,
      srcPath: "/src",
      appDirPath: "/src/app",
      pagesDirPath: null,
      componentsDirs: ["/src/components"],
      rootLayoutPath: "/src/app/layout.tsx",
    },
    providers: [],
    components: [],
    toolCandidates: [],
  };

  const mockThread = {
    id: "test-thread-123",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    runStatus: "idle" as const,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockThreadsCreate = jest.fn() as any;
  const mockClient = {
    sdk: {},
    threads: {
      create: mockThreadsCreate,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateTamboClient.mockReturnValue(mockClient);
    mockThreadsCreate.mockResolvedValue(mockThread);
  });

  it("creates TamboClient with provided apiKey and baseUrl", async () => {
    const validPlan = JSON.stringify({
      providerSetup: {
        filePath: "/app/layout.tsx",
        nestingLevel: 0,
        rationale: "Main layout file",
        confidence: 0.9,
      },
      componentRecommendations: [],
      toolRecommendations: [],
      interactableRecommendations: [],
      chatWidgetSetup: {
        filePath: "/app/layout.tsx",
        position: "bottom-right",
        rationale: "Standard placement",
        confidence: 0.8,
      },
    });

    mockExecuteRun.mockResolvedValue(validPlan);

    await generatePlan({
      projectAnalysis: mockProjectAnalysis,
      apiKey: "sk_test_123",
      baseUrl: "https://api.test.com",
    });

    expect(mockCreateTamboClient).toHaveBeenCalledWith({
      apiKey: "sk_test_123",
      baseUrl: "https://api.test.com",
    });
  });

  it("creates thread for plan generation", async () => {
    const validPlan = JSON.stringify({
      providerSetup: {
        filePath: "/app/layout.tsx",
        nestingLevel: 0,
        rationale: "Main layout file",
        confidence: 0.9,
      },
      componentRecommendations: [],
      toolRecommendations: [],
      interactableRecommendations: [],
      chatWidgetSetup: {
        filePath: "/app/layout.tsx",
        position: "bottom-right",
        rationale: "Standard placement",
        confidence: 0.8,
      },
    });

    mockExecuteRun.mockResolvedValue(validPlan);

    await generatePlan({
      projectAnalysis: mockProjectAnalysis,
      apiKey: "sk_test_123",
    });

    expect(mockThreadsCreate).toHaveBeenCalled();
  });

  it("passes buildPlanPrompt output to executeRun", async () => {
    const validPlan = JSON.stringify({
      providerSetup: {
        filePath: "/app/layout.tsx",
        nestingLevel: 0,
        rationale: "Main layout file",
        confidence: 0.9,
      },
      componentRecommendations: [],
      toolRecommendations: [],
      interactableRecommendations: [],
      chatWidgetSetup: {
        filePath: "/app/layout.tsx",
        position: "bottom-right",
        rationale: "Standard placement",
        confidence: 0.8,
      },
    });

    mockExecuteRun.mockResolvedValue(validPlan);

    await generatePlan({
      projectAnalysis: mockProjectAnalysis,
      apiKey: "sk_test_123",
    });

    expect(mockExecuteRun).toHaveBeenCalledWith(
      mockClient,
      "test-thread-123",
      expect.stringContaining("Next.js"),
      expect.any(Object),
    );
  });

  it("calls onProgress callback with text deltas from streaming events", async () => {
    const validPlan = JSON.stringify({
      providerSetup: {
        filePath: "/app/layout.tsx",
        nestingLevel: 0,
        rationale: "Main layout file",
        confidence: 0.9,
      },
      componentRecommendations: [],
      toolRecommendations: [],
      interactableRecommendations: [],
      chatWidgetSetup: {
        filePath: "/app/layout.tsx",
        position: "bottom-right",
        rationale: "Standard placement",
        confidence: 0.8,
      },
    });

    const progressChunks: string[] = [];
    const onProgress = jest.fn((chunk: string) => {
      progressChunks.push(chunk);
    });

    // Mock executeRun to call onEvent with text deltas
    mockExecuteRun.mockImplementation(
      async (
        _client: unknown,
        _threadId: unknown,
        _prompt: unknown,
        options?: {
          onEvent?: (event: { type: string; delta?: string }) => void;
        },
      ) => {
        // Simulate streaming events
        options?.onEvent?.({ type: "RUN_STARTED" });
        options?.onEvent?.({ type: "TEXT_MESSAGE_CONTENT", delta: "Hello" });
        options?.onEvent?.({ type: "TEXT_MESSAGE_CONTENT", delta: " world" });
        options?.onEvent?.({ type: "RUN_FINISHED" });
        return validPlan;
      },
    );

    await generatePlan({
      projectAnalysis: mockProjectAnalysis,
      apiKey: "sk_test_123",
      onProgress,
    });

    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenNthCalledWith(1, "Hello");
    expect(onProgress).toHaveBeenNthCalledWith(2, " world");
  });

  it("successfully generates plan from valid JSON", async () => {
    const validPlan = JSON.stringify({
      providerSetup: {
        filePath: "/app/layout.tsx",
        nestingLevel: 0,
        rationale: "Main layout file",
        confidence: 0.9,
      },
      componentRecommendations: [
        {
          name: "Button",
          filePath: "/components/Button.tsx",
          reason: "Interactive UI element",
          confidence: 0.85,
          suggestedRegistration: 'register("Button", Button)',
        },
      ],
      toolRecommendations: [],
      interactableRecommendations: [],
      chatWidgetSetup: {
        filePath: "/app/layout.tsx",
        position: "bottom-right",
        rationale: "Standard placement",
        confidence: 0.8,
      },
    });

    mockExecuteRun.mockResolvedValue(validPlan);

    const result = await generatePlan({
      projectAnalysis: mockProjectAnalysis,
      apiKey: "sk_test_123",
    });

    expect(result).toEqual({
      providerSetup: {
        filePath: "/app/layout.tsx",
        nestingLevel: 0,
        rationale: "Main layout file",
        confidence: 0.9,
      },
      componentRecommendations: [
        {
          name: "Button",
          filePath: "/components/Button.tsx",
          reason: "Interactive UI element",
          confidence: 0.85,
          suggestedRegistration: 'register("Button", Button)',
        },
      ],
      toolRecommendations: [],
      interactableRecommendations: [],
      chatWidgetSetup: {
        filePath: "/app/layout.tsx",
        position: "bottom-right",
        rationale: "Standard placement",
        confidence: 0.8,
      },
    });
  });

  it("throws descriptive error when model returns invalid JSON", async () => {
    mockExecuteRun.mockResolvedValue("This is not JSON at all");

    await expect(
      generatePlan({
        projectAnalysis: mockProjectAnalysis,
        apiKey: "sk_test_123",
      }),
    ).rejects.toThrow(/Failed to extract JSON from response:/);
  });

  it("throws descriptive error when model returns valid JSON that fails Zod validation", async () => {
    const invalidPlan = JSON.stringify({
      providerSetup: {
        // Missing required fields: filePath, nestingLevel, rationale
        confidence: 0.9,
      },
      componentRecommendations: [],
      toolRecommendations: [],
      interactableRecommendations: [],
      chatWidgetSetup: {
        filePath: "/app/layout.tsx",
        position: "bottom-right",
        rationale: "Standard placement",
        confidence: 0.8,
      },
    });

    mockExecuteRun.mockResolvedValue(invalidPlan);

    await expect(
      generatePlan({
        projectAnalysis: mockProjectAnalysis,
        apiKey: "sk_test_123",
      }),
    ).rejects.toThrow(/Model returned invalid plan:/);
  });
});

describe("re-exports", () => {
  it("re-exports buildPlanPrompt function", async () => {
    const { buildPlanPrompt } = await import("./index.js");
    expect(buildPlanPrompt).toBeDefined();
    expect(typeof buildPlanPrompt).toBe("function");
  });

  it("re-exports installationPlanSchema", async () => {
    const { installationPlanSchema } = await import("./index.js");
    expect(installationPlanSchema).toBeDefined();
  });
});
