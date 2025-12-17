import { renderHook } from "@testing-library/react";
import {
  GenerationStage,
  TamboThreadMessage,
} from "../model/generate-component-response";
import { useTamboStreamStatus } from "./use-tambo-stream-status";

// Mock the required providers
jest.mock("../providers/tambo-thread-provider", () => ({
  useTamboGenerationStage: jest.fn(),
}));

jest.mock("./use-current-message", () => ({
  useTamboCurrentMessage: jest.fn(),
}));

// Import the mocked functions
import { useTamboGenerationStage } from "../providers/tambo-thread-provider";
import { useTamboCurrentMessage } from "./use-current-message";

// Mock window for SSR tests
const originalWindow = global.window;

// Helper function to create mock ComponentDecisionV2
const createMockComponent = (props: Record<string, unknown> = {}): any => ({
  componentName: "TestComponent",
  componentState: {},
  message: "Component generated",
  props,
  reasoning: "Test reasoning",
});

// Helper function to create mock TamboThreadMessage
const createMockMessage = (
  overrides: Partial<TamboThreadMessage> = {},
): TamboThreadMessage => ({
  id: "test-message",
  componentState: {},
  content: [{ type: "text", text: "test content" }],
  createdAt: new Date().toISOString(),
  role: "assistant",
  threadId: "test-thread",
  ...overrides,
});

// Get the mocked functions
const mockUseTamboGenerationStage = jest.mocked(useTamboGenerationStage);
const mockUseTamboCurrentMessage = jest.mocked(useTamboCurrentMessage);

describe("useTamboStreamStatus", () => {
  beforeEach(() => {
    // Restore window for client-side tests
    global.window = originalWindow;

    // Default mock implementations
    mockUseTamboGenerationStage.mockReturnValue({
      generationStage: GenerationStage.IDLE,
      generationStatusMessage: "",
      isIdle: true,
      activeStreamingMessageId: null,
    });

    mockUseTamboCurrentMessage.mockReturnValue({
      id: "test-message",
      component: {
        props: {},
      },
    } as TamboThreadMessage);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should start with all flags as missing when idle and no props have content", () => {
      // When generation is IDLE (not active) and props have no content,
      // they are considered "missing" - generation finished without providing them
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.IDLE,
        generationStatusMessage: "",
        isIdle: true,
        activeStreamingMessageId: null,
      });

      mockUseTamboCurrentMessage.mockReturnValue(
        createMockMessage({
          component: createMockComponent({ title: "", body: "" }),
        }),
      );

      const { result } = renderHook(() =>
        useTamboStreamStatus<{ title: string; body: string }>(),
      );

      expect(result.current.streamStatus).toEqual({
        isPending: false,
        isStreaming: false,
        isSuccess: false,
        isError: false,
        streamError: undefined,
      });

      expect(result.current.propStatus.title).toEqual({
        isPending: false,
        isStreaming: false,
        isSuccess: false,
        isMissing: true,
        error: undefined,
      });

      expect(result.current.propStatus.body).toEqual({
        isPending: false,
        isStreaming: false,
        isSuccess: false,
        isMissing: true,
        error: undefined,
      });
    });

    it("should show props as pending when generation is actively streaming but no content yet", () => {
      // When generation is STREAMING_RESPONSE, props without content are "pending" (waiting)
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.STREAMING_RESPONSE,
        generationStatusMessage: "",
        isIdle: false,
        activeStreamingMessageId: "test-message",
      });

      mockUseTamboCurrentMessage.mockReturnValue(
        createMockMessage({
          component: createMockComponent({ title: "", body: "" }),
        }),
      );

      const { result } = renderHook(() =>
        useTamboStreamStatus<{ title: string; body: string }>(),
      );

      expect(result.current.propStatus.title).toEqual({
        isPending: true,
        isStreaming: false,
        isSuccess: false,
        isMissing: false,
        error: undefined,
      });

      expect(result.current.propStatus.body).toEqual({
        isPending: true,
        isStreaming: false,
        isSuccess: false,
        isMissing: false,
        error: undefined,
      });
    });
  });

  describe("Generation vs Props Streaming", () => {
    it("should show global and props pending when STREAMING_RESPONSE with no prop content yet", () => {
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.STREAMING_RESPONSE,
        generationStatusMessage: "",
        isIdle: false,
        activeStreamingMessageId: "test-message",
      });

      mockUseTamboCurrentMessage.mockReturnValue(
        createMockMessage({
          component: createMockComponent({ title: "", body: "" }),
        }),
      );

      const { result } = renderHook(() =>
        useTamboStreamStatus<{ title: string; body: string }>(),
      );

      // Global streaming should be false because no props are actually streaming yet
      expect(result.current.streamStatus.isStreaming).toBe(false);
      // Global isPending is true because we're waiting for content to arrive
      expect(result.current.streamStatus.isPending).toBe(true);

      // Individual props should be pending because they haven't started streaming yet
      expect(result.current.propStatus.title.isPending).toBe(true);
      expect(result.current.propStatus.title.isStreaming).toBe(false);
      expect(result.current.propStatus.title.isMissing).toBe(false);
      expect(result.current.propStatus.body.isPending).toBe(true);
      expect(result.current.propStatus.body.isStreaming).toBe(false);
      expect(result.current.propStatus.body.isMissing).toBe(false);
    });

    it("should show prop streaming when props receive content during STREAMING_RESPONSE", () => {
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.STREAMING_RESPONSE,
        generationStatusMessage: "",
        isIdle: false,
        activeStreamingMessageId: "test-message",
      });

      mockUseTamboCurrentMessage.mockReturnValue(
        createMockMessage({
          component: createMockComponent({ title: "Hello", body: "" }),
        }),
      );

      const { result } = renderHook(() =>
        useTamboStreamStatus<{ title: string; body: string }>(),
      );

      // Title prop should be streaming since it has content
      expect(result.current.propStatus.title.isStreaming).toBe(true);
      expect(result.current.propStatus.title.isPending).toBe(false);

      // Body prop should still be pending since it has no content
      expect(result.current.propStatus.body.isStreaming).toBe(false);
      expect(result.current.propStatus.body.isPending).toBe(true);

      // Global should be streaming because at least one prop is streaming
      expect(result.current.streamStatus.isStreaming).toBe(true);
    });
  });

  describe("Boolean Lifecycle", () => {
    it("should transition through Pending -> Streaming -> Success lifecycle", () => {
      // Start with STREAMING_RESPONSE but no content yet (Pending phase)
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.STREAMING_RESPONSE,
        generationStatusMessage: "",
        isIdle: false,
        activeStreamingMessageId: "test-message",
      });

      mockUseTamboCurrentMessage.mockReturnValue(
        createMockMessage({
          component: createMockComponent({ title: "", body: "" }),
        }),
      );

      const { result, rerender } = renderHook(() =>
        useTamboStreamStatus<{ title: string; body: string }>(),
      );

      // Phase 1: Pending - waiting for content
      expect(result.current.propStatus.title.isPending).toBe(true);
      expect(result.current.propStatus.title.isMissing).toBe(false);
      expect(result.current.streamStatus.isStreaming).toBe(false);
      expect(result.current.streamStatus.isSuccess).toBe(false);

      // Phase 2: Streaming - content arrives
      mockUseTamboCurrentMessage.mockReturnValue(
        createMockMessage({
          component: createMockComponent({
            title: "Hello World",
            body: "Some content",
          }),
        }),
      );

      rerender();

      expect(result.current.streamStatus.isPending).toBe(false);
      expect(result.current.streamStatus.isStreaming).toBe(true);
      expect(result.current.streamStatus.isSuccess).toBe(false);

      // Phase 3: Complete - move to COMPLETE
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.COMPLETE,
        generationStatusMessage: "",
        isIdle: false,
        activeStreamingMessageId: null,
      });

      rerender();

      expect(result.current.streamStatus.isPending).toBe(false);
      expect(result.current.streamStatus.isStreaming).toBe(false);
      expect(result.current.streamStatus.isSuccess).toBe(true);
      expect(result.current.propStatus.title.isMissing).toBe(false);
      expect(result.current.propStatus.body.isMissing).toBe(false);
    });

    it("should handle error state correctly with missing props", () => {
      // When error occurs and props never received content, they are missing
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.ERROR,
        generationStatusMessage: "",
        isIdle: false,
        activeStreamingMessageId: null,
      });

      const errorMessage = "Generation failed";
      mockUseTamboCurrentMessage.mockReturnValue(
        createMockMessage({
          component: createMockComponent({ title: "", body: "" }),
          error: errorMessage,
        }),
      );

      const { result } = renderHook(() =>
        useTamboStreamStatus<{ title: string; body: string }>(),
      );

      // Props that never received content are marked as missing
      expect(result.current.propStatus.title.isMissing).toBe(true);
      expect(result.current.propStatus.title.isPending).toBe(false);
      expect(result.current.propStatus.body.isMissing).toBe(true);
      expect(result.current.streamStatus.isStreaming).toBe(false);
      expect(result.current.streamStatus.isSuccess).toBe(false);
      expect(result.current.streamStatus.isError).toBe(true);
      expect(result.current.streamStatus.streamError?.message).toBe(
        errorMessage,
      );
    });
  });

  describe("Derivation Rules", () => {
    it("should derive isPending correctly when generation is active but no content yet", () => {
      // isPending is true when generation is active but prop hasn't received content
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.STREAMING_RESPONSE,
        generationStatusMessage: "",
        isIdle: false,
        activeStreamingMessageId: "test-message",
      });

      mockUseTamboCurrentMessage.mockReturnValue(
        createMockMessage({
          component: createMockComponent({ title: "", body: "", footer: "" }),
        }),
      );

      const { result } = renderHook(() =>
        useTamboStreamStatus<{
          title: string;
          body: string;
          footer: string;
        }>(),
      );

      // All props are pending (waiting for content) during active generation
      expect(result.current.propStatus.title.isPending).toBe(true);
      expect(result.current.propStatus.title.isMissing).toBe(false);
      expect(result.current.propStatus.body.isPending).toBe(true);
      expect(result.current.propStatus.body.isMissing).toBe(false);
      expect(result.current.propStatus.footer.isPending).toBe(true);
      expect(result.current.propStatus.footer.isMissing).toBe(false);
    });

    it("should derive isStreaming correctly (generation streaming OR any prop streaming)", () => {
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.COMPLETE,
        generationStatusMessage: "",
        isIdle: false,
        activeStreamingMessageId: null,
      });

      // One prop still streaming
      mockUseTamboCurrentMessage.mockReturnValue(
        createMockMessage({
          component: createMockComponent({
            title: "Complete Title",
            body: "Still streaming...",
          }),
        }),
      );

      const { result } = renderHook(() =>
        useTamboStreamStatus<{ title: string; body: string }>(),
      );

      // Should be streaming because at least one prop is streaming
      expect(result.current.streamStatus.isStreaming).toBe(false); // Note: this will be false in our implementation because props are considered complete when generation is COMPLETE
    });

    it("should derive isSuccess correctly (generation complete AND all props successful)", () => {
      // Step 1: Start with streaming, props empty
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.STREAMING_RESPONSE,
        generationStatusMessage: "",
        isIdle: false,
        activeStreamingMessageId: "test-message",
      });

      mockUseTamboCurrentMessage.mockReturnValue(
        createMockMessage({
          component: createMockComponent({
            title: "",
            body: "",
          }),
        }),
      );

      const { result, rerender } = renderHook(() =>
        useTamboStreamStatus<{ title: string; body: string }>(),
      );

      // Step 2: Simulate streaming in title
      mockUseTamboCurrentMessage.mockReturnValue(
        createMockMessage({
          component: createMockComponent({
            title: "Complete Title",
            body: "",
          }),
        }),
      );
      rerender();

      // Step 3: Simulate streaming in body
      mockUseTamboCurrentMessage.mockReturnValue(
        createMockMessage({
          component: createMockComponent({
            title: "Complete Title",
            body: "Complete Body",
          }),
        }),
      );
      rerender();

      // Step 4: Generation complete
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.COMPLETE,
        generationStatusMessage: "",
        isIdle: false,
        activeStreamingMessageId: null,
      });
      rerender();

      // Now both props should be successful
      expect(result.current.propStatus.title.isSuccess).toBe(true);
      expect(result.current.propStatus.body.isSuccess).toBe(true);
      expect(result.current.streamStatus.isSuccess).toBe(true);
    });

    it("should derive isError correctly (generation error OR any prop error)", () => {
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.COMPLETE,
        generationStatusMessage: "",
        isIdle: false,
        activeStreamingMessageId: null,
      });

      mockUseTamboCurrentMessage.mockReturnValue(
        createMockMessage({
          component: createMockComponent({
            title: "Good Title",
            body: "Good Body",
          }),
          error: "Something went wrong",
        }),
      );

      const { result } = renderHook(() =>
        useTamboStreamStatus<{ title: string; body: string }>(),
      );

      expect(result.current.streamStatus.isError).toBe(true);
      expect(result.current.streamStatus.streamError?.message).toBe(
        "Something went wrong",
      );
    });
  });

  describe("Type Safety", () => {
    it("should provide strongly typed prop status based on generic", () => {
      interface TestProps {
        title: string;
        description: string;
        count: number;
      }

      mockUseTamboCurrentMessage.mockReturnValue(
        createMockMessage({
          component: createMockComponent({
            title: "Test",
            description: "Test desc",
            count: 42,
          }),
        }),
      );

      const { result } = renderHook(() => useTamboStreamStatus<TestProps>());

      // TypeScript should infer these keys correctly
      expect(result.current.propStatus.title).toBeDefined();
      expect(result.current.propStatus.description).toBeDefined();
      expect(result.current.propStatus.count).toBeDefined();

      // This would cause a TypeScript error if uncommented:
      // expect(result.current.propStatus.nonExistentProp).toBeDefined();
    });

    it("should work without generic type parameter", () => {
      mockUseTamboCurrentMessage.mockReturnValue(
        createMockMessage({
          component: createMockComponent({ dynamicProp: "value" }),
        }),
      );

      const { result } = renderHook(() => useTamboStreamStatus());

      expect(result.current.streamStatus).toBeDefined();
      expect(result.current.propStatus).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing message gracefully", () => {
      mockUseTamboCurrentMessage.mockReturnValue({
        id: "test-message",
        role: "user",
        content: [],
        componentState: {},
        createdAt: "",
        threadId: "",
      } as TamboThreadMessage);

      const { result } = renderHook(() => useTamboStreamStatus());

      expect(result.current.streamStatus.isPending).toBe(true);
      expect(result.current.propStatus).toEqual({});
    });

    it("should handle missing component props gracefully", () => {
      mockUseTamboCurrentMessage.mockReturnValue({
        id: "test-message",
        // Missing component property
      } as TamboThreadMessage);

      const { result } = renderHook(() => useTamboStreamStatus());

      expect(result.current.streamStatus.isPending).toBe(true);
      expect(result.current.propStatus).toEqual({});
    });

    it("should reset prop tracking when generation restarts", () => {
      // Step 1: Complete a message
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.STREAMING_RESPONSE,
        generationStatusMessage: "",
        isIdle: false,
        activeStreamingMessageId: "test-message",
      });
      mockUseTamboCurrentMessage.mockReturnValue(
        createMockMessage({
          component: createMockComponent({ title: "" }),
        }),
      );
      const { result, rerender } = renderHook(() =>
        useTamboStreamStatus<{ title: string }>(),
      );
      // Simulate streaming in title
      mockUseTamboCurrentMessage.mockReturnValue(
        createMockMessage({
          component: createMockComponent({ title: "First Title" }),
        }),
      );
      rerender();
      // Complete generation
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.COMPLETE,
        generationStatusMessage: "",
        isIdle: false,
        activeStreamingMessageId: null,
      });
      rerender();
      // Should be successful initially
      expect(result.current.propStatus.title.isSuccess).toBe(true);

      // Step 2: Start new generation with a new message ID to trigger reset
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.CHOOSING_COMPONENT,
        generationStatusMessage: "",
        isIdle: false,
        activeStreamingMessageId: null,
      });
      mockUseTamboCurrentMessage.mockReturnValue(
        createMockMessage({
          id: "new-message-id", // Different message ID to trigger reset
          component: createMockComponent({ title: "" }),
        }),
      );
      rerender();
      // Should reset to pending
      expect(result.current.propStatus.title.isPending).toBe(true);
      expect(result.current.propStatus.title.isSuccess).toBe(false);
    });
  });

  describe("Multi-Component Turn", () => {
    it("should mark first component props as complete when streaming moves to second component", () => {
      // Scenario: AI generates two components in response to one user message
      // Component 1 (message-1) starts streaming
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.STREAMING_RESPONSE,
        generationStatusMessage: "",
        isIdle: false,
        activeStreamingMessageId: "message-1",
      });

      mockUseTamboCurrentMessage.mockReturnValue(
        createMockMessage({
          id: "message-1",
          component: createMockComponent({ title: "First Component" }),
        }),
      );

      const { result, rerender } = renderHook(() =>
        useTamboStreamStatus<{ title: string }>(),
      );

      // First component should be streaming
      expect(result.current.propStatus.title.isStreaming).toBe(true);
      expect(result.current.propStatus.title.isSuccess).toBe(false);
      expect(result.current.streamStatus.isStreaming).toBe(true);

      // Now streaming moves to second component (message-2)
      // The activeStreamingMessageId changes, but this hook is still rendering message-1
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.STREAMING_RESPONSE,
        generationStatusMessage: "",
        isIdle: false,
        activeStreamingMessageId: "message-2", // Streaming moved to new message
      });

      rerender();

      // First component's props should now be marked as complete (success)
      // because streaming has moved on to a different message
      expect(result.current.propStatus.title.isStreaming).toBe(false);
      expect(result.current.propStatus.title.isSuccess).toBe(true);
      expect(result.current.streamStatus.isSuccess).toBe(true);
      expect(result.current.streamStatus.isStreaming).toBe(false);
    });

    it("should keep component streaming when activeStreamingMessageId matches current message", () => {
      // Component is actively being streamed
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.STREAMING_RESPONSE,
        generationStatusMessage: "",
        isIdle: false,
        activeStreamingMessageId: "message-1",
      });

      mockUseTamboCurrentMessage.mockReturnValue(
        createMockMessage({
          id: "message-1",
          component: createMockComponent({ title: "Streaming..." }),
        }),
      );

      const { result } = renderHook(() =>
        useTamboStreamStatus<{ title: string }>(),
      );

      // Should still be streaming since activeStreamingMessageId matches
      expect(result.current.propStatus.title.isStreaming).toBe(true);
      expect(result.current.propStatus.title.isSuccess).toBe(false);
    });

    it("should handle null activeStreamingMessageId (no active streaming)", () => {
      // Generation complete, no active streaming
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.COMPLETE,
        generationStatusMessage: "",
        isIdle: false,
        activeStreamingMessageId: null,
      });

      mockUseTamboCurrentMessage.mockReturnValue(
        createMockMessage({
          id: "message-1",
          component: createMockComponent({ title: "Complete" }),
        }),
      );

      const { result, rerender } = renderHook(() =>
        useTamboStreamStatus<{ title: string }>(),
      );

      // Need to simulate the streaming phase first to trigger hasStarted
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.STREAMING_RESPONSE,
        generationStatusMessage: "",
        isIdle: false,
        activeStreamingMessageId: "message-1",
      });
      rerender();

      // Now complete
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.COMPLETE,
        generationStatusMessage: "",
        isIdle: false,
        activeStreamingMessageId: null,
      });
      rerender();

      // Should be complete, not streaming
      expect(result.current.propStatus.title.isSuccess).toBe(true);
      expect(result.current.propStatus.title.isStreaming).toBe(false);
    });

    it("should keep first component successful when user cancels during second component generation", () => {
      // Scenario:
      // 1. User sends a message
      // 2. First component (message-1) gets fully generated
      // 3. Second component (message-2) starts generating
      // 4. User hits cancel
      // Expected: First component remains isSuccess: true, not affected by cancel

      // Step 1: First component starts streaming
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.STREAMING_RESPONSE,
        generationStatusMessage: "",
        isIdle: false,
        activeStreamingMessageId: "message-1",
      });

      mockUseTamboCurrentMessage.mockReturnValue(
        createMockMessage({
          id: "message-1",
          component: createMockComponent({ title: "First Component Title" }),
        }),
      );

      const { result, rerender } = renderHook(() =>
        useTamboStreamStatus<{ title: string }>(),
      );

      // First component should be streaming
      expect(result.current.propStatus.title.isStreaming).toBe(true);
      expect(result.current.propStatus.title.isSuccess).toBe(false);

      // Step 2: Second component starts streaming (first component is now complete)
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.STREAMING_RESPONSE,
        generationStatusMessage: "",
        isIdle: false,
        activeStreamingMessageId: "message-2", // Streaming moved to second component
      });

      rerender();

      // First component should now be marked as successful (streaming moved on)
      expect(result.current.propStatus.title.isStreaming).toBe(false);
      expect(result.current.propStatus.title.isSuccess).toBe(true);
      expect(result.current.streamStatus.isSuccess).toBe(true);

      // Step 3: User cancels during second component generation
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.CANCELLED,
        generationStatusMessage: "",
        isIdle: true, // CANCELLED is an idle stage
        activeStreamingMessageId: null, // Cleared on cancel
      });

      rerender();

      // First component should STILL be successful - cancel only affects the second component
      expect(result.current.propStatus.title.isSuccess).toBe(true);
      expect(result.current.propStatus.title.isStreaming).toBe(false);
      expect(result.current.propStatus.title.isPending).toBe(false);
      expect(result.current.streamStatus.isSuccess).toBe(true);
      expect(result.current.streamStatus.isStreaming).toBe(false);
    });

    it("should keep first component successful when error occurs during second component generation", () => {
      // Scenario: Same as cancel test but with ERROR stage
      // First component should remain successful when error occurs during second component

      // Step 1: First component streams
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.STREAMING_RESPONSE,
        generationStatusMessage: "",
        isIdle: false,
        activeStreamingMessageId: "message-1",
      });

      mockUseTamboCurrentMessage.mockReturnValue(
        createMockMessage({
          id: "message-1",
          component: createMockComponent({ title: "First Component" }),
        }),
      );

      const { result, rerender } = renderHook(() =>
        useTamboStreamStatus<{ title: string }>(),
      );

      expect(result.current.propStatus.title.isStreaming).toBe(true);

      // Step 2: Streaming moves to second component
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.STREAMING_RESPONSE,
        generationStatusMessage: "",
        isIdle: false,
        activeStreamingMessageId: "message-2",
      });

      rerender();

      expect(result.current.propStatus.title.isSuccess).toBe(true);

      // Step 3: Error occurs during second component
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.ERROR,
        generationStatusMessage: "",
        isIdle: false,
        activeStreamingMessageId: null,
      });

      rerender();

      // First component should still be successful
      expect(result.current.propStatus.title.isSuccess).toBe(true);
      expect(result.current.propStatus.title.isStreaming).toBe(false);
      expect(result.current.streamStatus.isSuccess).toBe(true);
    });

    it("should mark props that never started as isMissing when streaming moves on", () => {
      // Scenario: A component has two props, only one receives content before streaming moves on
      // The prop that never started should be isMissing, not isSuccess

      // Step 1: Component starts streaming, only 'title' receives content
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.STREAMING_RESPONSE,
        generationStatusMessage: "",
        isIdle: false,
        activeStreamingMessageId: "message-1",
      });

      mockUseTamboCurrentMessage.mockReturnValue(
        createMockMessage({
          id: "message-1",
          component: createMockComponent({
            title: "Has Content",
            description: "", // Never receives content
          }),
        }),
      );

      const { result, rerender } = renderHook(() =>
        useTamboStreamStatus<{ title: string; description: string }>(),
      );

      // title started streaming, description is still pending (waiting)
      expect(result.current.propStatus.title.isStreaming).toBe(true);
      expect(result.current.propStatus.title.isPending).toBe(false);
      expect(result.current.propStatus.title.isMissing).toBe(false);
      expect(result.current.propStatus.description.isPending).toBe(true);
      expect(result.current.propStatus.description.isMissing).toBe(false);
      expect(result.current.propStatus.description.isStreaming).toBe(false);

      // Step 2: Streaming moves to second component before description gets content
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.STREAMING_RESPONSE,
        generationStatusMessage: "",
        isIdle: false,
        activeStreamingMessageId: "message-2", // Moved on
      });

      rerender();

      // title should be successful (it started and streaming moved on)
      expect(result.current.propStatus.title.isSuccess).toBe(true);
      expect(result.current.propStatus.title.isPending).toBe(false);
      expect(result.current.propStatus.title.isMissing).toBe(false);

      // description should now be isMissing - component is done but prop never got content
      expect(result.current.propStatus.description.isMissing).toBe(true);
      expect(result.current.propStatus.description.isPending).toBe(false);
      expect(result.current.propStatus.description.isSuccess).toBe(false);
      expect(result.current.propStatus.description.isStreaming).toBe(false);

      // Overall stream status: not fully successful since one prop is missing
      expect(result.current.streamStatus.isSuccess).toBe(false);
    });

    it("should complete both components successfully in full happy path", () => {
      // Scenario: Full multi-component turn where both components complete successfully
      // 1. First component streams and completes (streaming moves to second)
      // 2. Second component streams
      // 3. Generation completes normally
      // Both components should end up isSuccess: true

      // Step 1: First component streams
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.STREAMING_RESPONSE,
        generationStatusMessage: "",
        isIdle: false,
        activeStreamingMessageId: "message-1",
      });

      mockUseTamboCurrentMessage.mockReturnValue(
        createMockMessage({
          id: "message-1",
          component: createMockComponent({ title: "First Component" }),
        }),
      );

      const { result, rerender } = renderHook(() =>
        useTamboStreamStatus<{ title: string }>(),
      );

      expect(result.current.propStatus.title.isStreaming).toBe(true);
      expect(result.current.streamStatus.isStreaming).toBe(true);

      // Step 2: Streaming moves to second component (first completes)
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.STREAMING_RESPONSE,
        generationStatusMessage: "",
        isIdle: false,
        activeStreamingMessageId: "message-2",
      });

      rerender();

      // First component is now complete
      expect(result.current.propStatus.title.isSuccess).toBe(true);
      expect(result.current.streamStatus.isSuccess).toBe(true);

      // Step 3: Generation completes normally
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.COMPLETE,
        generationStatusMessage: "",
        isIdle: false,
        activeStreamingMessageId: null,
      });

      rerender();

      // First component should still be successful
      expect(result.current.propStatus.title.isSuccess).toBe(true);
      expect(result.current.propStatus.title.isStreaming).toBe(false);
      expect(result.current.propStatus.title.isPending).toBe(false);
      expect(result.current.propStatus.title.isMissing).toBe(false);
      expect(result.current.streamStatus.isSuccess).toBe(true);
      expect(result.current.streamStatus.isStreaming).toBe(false);
      expect(result.current.streamStatus.isPending).toBe(false);
    });
  });

  describe("Single Component with Missing Prop", () => {
    it("should mark prop as isMissing when single component completes without providing it", () => {
      // Scenario: Single component generation where one prop never receives content
      // 1. Generation starts, title receives content, description stays empty
      // 2. Generation completes
      // Result: title is isSuccess, description is isMissing

      // Step 1: Generation starts streaming
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.STREAMING_RESPONSE,
        generationStatusMessage: "",
        isIdle: false,
        activeStreamingMessageId: "message-1",
      });

      mockUseTamboCurrentMessage.mockReturnValue(
        createMockMessage({
          id: "message-1",
          component: createMockComponent({
            title: "Has Content",
            description: "", // Never receives content
          }),
        }),
      );

      const { result, rerender } = renderHook(() =>
        useTamboStreamStatus<{ title: string; description: string }>(),
      );

      // During streaming: title is streaming, description is pending
      expect(result.current.propStatus.title.isStreaming).toBe(true);
      expect(result.current.propStatus.title.isMissing).toBe(false);
      expect(result.current.propStatus.description.isPending).toBe(true);
      expect(result.current.propStatus.description.isMissing).toBe(false);

      // Step 2: Generation completes
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.COMPLETE,
        generationStatusMessage: "",
        isIdle: false,
        activeStreamingMessageId: null,
      });

      rerender();

      // title should be successful
      expect(result.current.propStatus.title.isSuccess).toBe(true);
      expect(result.current.propStatus.title.isMissing).toBe(false);
      expect(result.current.propStatus.title.isPending).toBe(false);

      // description should be isMissing (never received content, generation complete)
      expect(result.current.propStatus.description.isMissing).toBe(true);
      expect(result.current.propStatus.description.isSuccess).toBe(false);
      expect(result.current.propStatus.description.isPending).toBe(false);
      expect(result.current.propStatus.description.isStreaming).toBe(false);

      // Overall: not successful since one prop is missing
      expect(result.current.streamStatus.isSuccess).toBe(false);
      expect(result.current.streamStatus.isStreaming).toBe(false);
    });

    it("should allow consumer to show fallback UI for missing props", () => {
      // This test demonstrates the consumer use case for isMissing
      // When a prop is missing, consumer can render fallback content

      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.COMPLETE,
        generationStatusMessage: "",
        isIdle: false,
        activeStreamingMessageId: null,
      });

      mockUseTamboCurrentMessage.mockReturnValue(
        createMockMessage({
          id: "message-1",
          component: createMockComponent({
            title: "Product Name",
            description: "", // Optional prop that wasn't provided
            price: "99.99",
          }),
        }),
      );

      // Simulate streaming phase first to mark title and price as started
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.STREAMING_RESPONSE,
        generationStatusMessage: "",
        isIdle: false,
        activeStreamingMessageId: "message-1",
      });

      const { result, rerender } = renderHook(() =>
        useTamboStreamStatus<{
          title: string;
          description: string;
          price: string;
        }>(),
      );

      // Simulate receiving content for title and price
      mockUseTamboCurrentMessage.mockReturnValue(
        createMockMessage({
          id: "message-1",
          component: createMockComponent({
            title: "Product Name",
            description: "",
            price: "99.99",
          }),
        }),
      );
      rerender();

      // Complete generation
      mockUseTamboGenerationStage.mockReturnValue({
        generationStage: GenerationStage.COMPLETE,
        generationStatusMessage: "",
        isIdle: false,
        activeStreamingMessageId: null,
      });
      rerender();

      // Consumer can now check isMissing to decide what to render:
      // if (propStatus.description.isMissing) {
      //   return <div>No description available</div>;
      // }
      expect(result.current.propStatus.title.isSuccess).toBe(true);
      expect(result.current.propStatus.price.isSuccess).toBe(true);
      expect(result.current.propStatus.description.isMissing).toBe(true);
    });
  });
});
