/**
 * Tests for generatePlan orchestrator
 */

import { jest } from "@jest/globals";
import type { ProjectAnalysis } from "../project-analysis/types.js";

// Mock @ag-ui/core EventType enum
const MockEventType = {
  RUN_STARTED: "RUN_STARTED",
  TEXT_MESSAGE_CONTENT: "TEXT_MESSAGE_CONTENT",
  RUN_FINISHED: "RUN_FINISHED",
  RUN_ERROR: "RUN_ERROR",
  TOOL_CALL_START: "TOOL_CALL_START",
  TOOL_CALL_ARGS: "TOOL_CALL_ARGS",
  TOOL_CALL_END: "TOOL_CALL_END",
  CUSTOM: "CUSTOM",
} as const;

jest.unstable_mockModule("@ag-ui/core", () => ({
  EventType: MockEventType,
}));

// Mock @tambo-ai/client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockRun = jest.fn() as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockTamboClientConstructor = jest.fn() as any;

jest.unstable_mockModule("@tambo-ai/client", () => ({
  TamboClient: class {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(opts: any) {
      mockTamboClientConstructor(opts);
      this.run = mockRun;
    }
    run = mockRun;
  },
}));

// Dynamic import after mocking
const { generatePlan } = await import("./index.js");

/**
 * Helper: create a mock async iterable stream from events
 */
function createMockStream(
  events: { type: string; delta?: string }[],
): AsyncIterable<{ event: { type: string; delta?: string } }> {
  return {
    [Symbol.asyncIterator]() {
      let i = 0;
      return {
        async next() {
          if (i < events.length) {
            return { value: { event: events[i++] }, done: false };
          }
          return { value: undefined, done: true };
        },
      };
    },
  };
}

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

  const validPlanJson = JSON.stringify({
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates TamboClient with provided apiKey and baseUrl", async () => {
    mockRun.mockReturnValue(
      createMockStream([
        { type: MockEventType.RUN_STARTED },
        { type: MockEventType.TEXT_MESSAGE_CONTENT, delta: validPlanJson },
        { type: MockEventType.RUN_FINISHED },
      ]),
    );

    await generatePlan({
      projectAnalysis: mockProjectAnalysis,
      apiKey: "sk_test_123",
      baseUrl: "https://api.test.com",
    });

    expect(mockTamboClientConstructor).toHaveBeenCalledWith({
      apiKey: "sk_test_123",
      userKey: "cli",
      tamboUrl: "https://api.test.com",
    });
  });

  it("passes prompt to client.run with autoExecuteTools: false", async () => {
    mockRun.mockReturnValue(
      createMockStream([
        { type: MockEventType.RUN_STARTED },
        { type: MockEventType.TEXT_MESSAGE_CONTENT, delta: validPlanJson },
        { type: MockEventType.RUN_FINISHED },
      ]),
    );

    await generatePlan({
      projectAnalysis: mockProjectAnalysis,
      apiKey: "sk_test_123",
    });

    expect(mockRun).toHaveBeenCalledWith(
      expect.stringContaining("Next.js"),
      expect.objectContaining({ autoExecuteTools: false }),
    );
  });

  it("calls onProgress callback with text deltas from streaming events", async () => {
    const progressChunks: string[] = [];
    const onProgress = jest.fn((chunk: string) => {
      progressChunks.push(chunk);
    });

    mockRun.mockReturnValue(
      createMockStream([
        { type: MockEventType.RUN_STARTED },
        { type: MockEventType.TEXT_MESSAGE_CONTENT, delta: "Hello" },
        { type: MockEventType.TEXT_MESSAGE_CONTENT, delta: " world" },
        {
          type: MockEventType.TEXT_MESSAGE_CONTENT,
          delta: validPlanJson.slice(0, 0),
        },
        { type: MockEventType.RUN_FINISHED },
      ]),
    );

    // Need to provide valid JSON across all deltas
    // Reset and use a simpler approach: full JSON in first delta
    mockRun.mockReturnValue(
      createMockStream([
        { type: MockEventType.RUN_STARTED },
        { type: MockEventType.TEXT_MESSAGE_CONTENT, delta: "Hello" },
        { type: MockEventType.TEXT_MESSAGE_CONTENT, delta: " world " },
        { type: MockEventType.TEXT_MESSAGE_CONTENT, delta: validPlanJson },
        { type: MockEventType.RUN_FINISHED },
      ]),
    );

    await generatePlan({
      projectAnalysis: mockProjectAnalysis,
      apiKey: "sk_test_123",
      onProgress,
    });

    expect(onProgress).toHaveBeenCalledTimes(3);
    expect(onProgress).toHaveBeenNthCalledWith(1, "Hello");
    expect(onProgress).toHaveBeenNthCalledWith(2, " world ");
    expect(onProgress).toHaveBeenNthCalledWith(3, validPlanJson);
  });

  it("successfully generates plan from valid JSON", async () => {
    const planWithComponent = JSON.stringify({
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

    mockRun.mockReturnValue(
      createMockStream([
        { type: MockEventType.RUN_STARTED },
        { type: MockEventType.TEXT_MESSAGE_CONTENT, delta: planWithComponent },
        { type: MockEventType.RUN_FINISHED },
      ]),
    );

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
    mockRun.mockReturnValue(
      createMockStream([
        { type: MockEventType.RUN_STARTED },
        {
          type: MockEventType.TEXT_MESSAGE_CONTENT,
          delta: "This is not JSON at all",
        },
        { type: MockEventType.RUN_FINISHED },
      ]),
    );

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

    mockRun.mockReturnValue(
      createMockStream([
        { type: MockEventType.RUN_STARTED },
        { type: MockEventType.TEXT_MESSAGE_CONTENT, delta: invalidPlan },
        { type: MockEventType.RUN_FINISHED },
      ]),
    );

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
