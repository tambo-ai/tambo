import { render, screen } from "@testing-library/react";
import React from "react";
import { useTamboCurrentMessage } from "../hooks/use-current-message";
import {
  GenerationStage,
  TamboThreadMessage,
} from "../model/generate-component-response";
import {
  CombinedTamboThreadContextProps,
  useTamboGenerationStage,
  useTamboThread,
} from "../providers/tambo-thread-provider";
import {
  TamboPropStreamProvider,
  useTamboStream,
} from "./tambo-prop-stream-provider";

// Mock the required providers
jest.mock("../providers/tambo-thread-provider", () => ({
  useTamboThread: jest.fn(),
  useTamboGenerationStage: jest.fn(),
}));

jest.mock("../hooks/use-current-message", () => ({
  useTamboCurrentMessage: jest.fn(),
}));

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

// Helper function to create mock CombinedTamboThreadContextProps
const createMockThreadContext = (
  overrides: Partial<CombinedTamboThreadContextProps> = {},
): CombinedTamboThreadContextProps => {
  const mockThread = {
    id: "test-thread",
    projectId: "test-project",
    messages: [],
    name: "Test Thread",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return {
    // TamboThreadContextProps properties
    thread: mockThread,
    currentThreadId: mockThread.id,
    currentThread: mockThread,
    threadMap: { [mockThread.id]: mockThread },
    setThreadMap: jest.fn(),
    switchCurrentThread: jest.fn(),
    startNewThread: jest.fn(),
    updateThreadName: jest.fn(),
    generateThreadName: jest.fn(),
    addThreadMessage: jest.fn(),
    updateThreadMessage: jest.fn(),
    cancel: jest.fn(),
    streaming: false,
    sendThreadMessage: jest.fn(),
    // GenerationStageContextProps properties
    generationStage: GenerationStage.IDLE,
    generationStatusMessage: "",
    isIdle: true,
    ...overrides,
  };
};

// Helper component to test hook usage
const TestHookComponent: React.FC<{ testKey?: string }> = ({
  testKey = "default",
}) => {
  const { streamStatus, getStatusForKey } = useTamboStream();
  const status = getStatusForKey(testKey);

  return (
    <div>
      <div data-testid="stream-status">{JSON.stringify(streamStatus)}</div>
      <div data-testid="key-status">{JSON.stringify(status)}</div>
    </div>
  );
};

describe("TamboPropStreamProvider", () => {
  beforeEach(() => {
    // Restore window for client-side tests
    global.window = originalWindow;

    // Default mock implementations
    jest.mocked(useTamboThread).mockReturnValue(createMockThreadContext());

    jest.mocked(useTamboGenerationStage).mockReturnValue({
      generationStage: GenerationStage.IDLE,
      generationStatusMessage: "",
      isIdle: true,
    });

    jest.mocked(useTamboCurrentMessage).mockReturnValue({
      id: "test-message",
      component: {
        props: {},
      },
    } as TamboThreadMessage);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Hook Error Handling", () => {
    it("should throw error when useTamboStream is used outside provider", () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        render(<TestHookComponent />);
      }).toThrow(
        "useTamboStream must be used within a TamboPropStreamProvider",
      );

      console.error = originalError;
    });
  });

  describe("Compound Components", () => {
    describe("Streaming Component", () => {
      it("should render streaming when isPending is true", () => {
        jest.mocked(useTamboThread).mockReturnValue(
          createMockThreadContext({
            generationStage: GenerationStage.IDLE,
          }),
        );

        jest.mocked(useTamboGenerationStage).mockReturnValue({
          generationStage: GenerationStage.IDLE,
          generationStatusMessage: "",
          isIdle: true,
        });

        jest.mocked(useTamboCurrentMessage).mockReturnValue(
          createMockMessage({
            component: createMockComponent({ title: "" }),
          }),
        );

        render(
          <TamboPropStreamProvider>
            <TamboPropStreamProvider.Streaming>
              <div data-testid="loading">Loading...</div>
            </TamboPropStreamProvider.Streaming>
          </TamboPropStreamProvider>,
        );

        expect(screen.getByTestId("loading")).toBeInTheDocument();
      });

      it("should render streaming when isStreaming is true", () => {
        jest.mocked(useTamboThread).mockReturnValue(
          createMockThreadContext({
            generationStage: GenerationStage.STREAMING_RESPONSE,
          }),
        );

        jest.mocked(useTamboGenerationStage).mockReturnValue({
          generationStage: GenerationStage.STREAMING_RESPONSE,
          generationStatusMessage: "",
          isIdle: false,
        });

        jest.mocked(useTamboCurrentMessage).mockReturnValue(
          createMockMessage({
            component: createMockComponent({ title: "Partial" }),
          }),
        );

        render(
          <TamboPropStreamProvider>
            <TamboPropStreamProvider.Streaming>
              <div data-testid="loading">Loading...</div>
            </TamboPropStreamProvider.Streaming>
          </TamboPropStreamProvider>,
        );

        expect(screen.getByTestId("loading")).toBeInTheDocument();
      });
    });

    describe("Success Component", () => {
      it("should not render success when isSuccess is false", () => {
        jest.mocked(useTamboThread).mockReturnValue(
          createMockThreadContext({
            generationStage: GenerationStage.IDLE,
          }),
        );

        jest.mocked(useTamboGenerationStage).mockReturnValue({
          generationStage: GenerationStage.IDLE,
          generationStatusMessage: "",
          isIdle: true,
        });

        jest.mocked(useTamboCurrentMessage).mockReturnValue(
          createMockMessage({
            component: createMockComponent({ title: "" }),
          }),
        );

        render(
          <TamboPropStreamProvider>
            <TamboPropStreamProvider.Success>
              <div data-testid="complete">Complete!</div>
            </TamboPropStreamProvider.Success>
          </TamboPropStreamProvider>,
        );

        expect(screen.queryByTestId("complete")).not.toBeInTheDocument();
      });
    });

    describe("Pending Component", () => {
      it("should render pending when no active status", () => {
        jest.mocked(useTamboThread).mockReturnValue(
          createMockThreadContext({
            generationStage: GenerationStage.IDLE,
          }),
        );

        jest.mocked(useTamboGenerationStage).mockReturnValue({
          generationStage: GenerationStage.IDLE,
          generationStatusMessage: "",
          isIdle: true,
        });

        jest.mocked(useTamboCurrentMessage).mockReturnValue(
          createMockMessage({
            component: createMockComponent({ title: "" }),
          }),
        );

        render(
          <TamboPropStreamProvider>
            <TamboPropStreamProvider.Pending>
              <div data-testid="empty">Empty!</div>
            </TamboPropStreamProvider.Pending>
          </TamboPropStreamProvider>,
        );

        expect(screen.getByTestId("empty")).toBeInTheDocument();
      });

      it("should not render pending when isPending is true", () => {
        jest.mocked(useTamboThread).mockReturnValue(
          createMockThreadContext({
            generationStage: GenerationStage.STREAMING_RESPONSE,
          }),
        );

        jest.mocked(useTamboGenerationStage).mockReturnValue({
          generationStage: GenerationStage.STREAMING_RESPONSE,
          generationStatusMessage: "",
          isIdle: false,
        });

        jest.mocked(useTamboCurrentMessage).mockReturnValue(
          createMockMessage({
            component: createMockComponent({ title: "Partial" }),
          }),
        );

        render(
          <TamboPropStreamProvider>
            <TamboPropStreamProvider.Pending>
              <div data-testid="empty">Empty!</div>
            </TamboPropStreamProvider.Pending>
          </TamboPropStreamProvider>,
        );

        expect(screen.queryByTestId("empty")).not.toBeInTheDocument();
      });
    });
  });

  describe("Key-based Status", () => {
    it("should provide status for keys not in propStatus", () => {
      jest.mocked(useTamboThread).mockReturnValue(
        createMockThreadContext({
          generationStage: GenerationStage.COMPLETE,
        }),
      );

      jest.mocked(useTamboGenerationStage).mockReturnValue({
        generationStage: GenerationStage.COMPLETE,
        generationStatusMessage: "",
        isIdle: false,
      });

      jest.mocked(useTamboCurrentMessage).mockReturnValue(
        createMockMessage({
          component: createMockComponent({ name: "John" }),
        }),
      );

      render(
        <TamboPropStreamProvider>
          <TestHookComponent testKey="nonexistent" />
        </TamboPropStreamProvider>,
      );

      const keyStatus = JSON.parse(
        screen.getByTestId("key-status").textContent,
      );
      expect(keyStatus.isPending).toBe(true);
    });
  });

  describe("Compound Components with Keys", () => {
    it("should render loading for specific key when pending", () => {
      jest.mocked(useTamboThread).mockReturnValue(
        createMockThreadContext({
          generationStage: GenerationStage.STREAMING_RESPONSE,
        }),
      );

      jest.mocked(useTamboGenerationStage).mockReturnValue({
        generationStage: GenerationStage.STREAMING_RESPONSE,
        generationStatusMessage: "",
        isIdle: false,
      });

      jest.mocked(useTamboCurrentMessage).mockReturnValue(
        createMockMessage({
          component: createMockComponent({
            name: "Partial",
            age: 25,
          }),
        }),
      );

      render(
        <TamboPropStreamProvider>
          <TamboPropStreamProvider.Streaming streamKey="name">
            <div data-testid="name-loading">Name Loading...</div>
          </TamboPropStreamProvider.Streaming>
          <TamboPropStreamProvider.Streaming streamKey="age">
            <div data-testid="age-loading">Age Loading...</div>
          </TamboPropStreamProvider.Streaming>
          <TamboPropStreamProvider.Success streamKey="name">
            <div data-testid="name-complete">Name Complete!</div>
          </TamboPropStreamProvider.Success>
        </TamboPropStreamProvider>,
      );

      // Both props should be loading since they're in streaming stage
      expect(screen.getByTestId("name-loading")).toBeInTheDocument();
      expect(screen.getByTestId("age-loading")).toBeInTheDocument();
      expect(screen.queryByTestId("name-complete")).not.toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should apply className to loading component", () => {
      jest.mocked(useTamboThread).mockReturnValue(
        createMockThreadContext({
          generationStage: GenerationStage.STREAMING_RESPONSE,
        }),
      );

      jest.mocked(useTamboGenerationStage).mockReturnValue({
        generationStage: GenerationStage.STREAMING_RESPONSE,
        generationStatusMessage: "",
        isIdle: false,
      });

      jest.mocked(useTamboCurrentMessage).mockReturnValue(
        createMockMessage({
          component: createMockComponent({ title: "Partial" }),
        }),
      );

      render(
        <TamboPropStreamProvider>
          <TamboPropStreamProvider.Streaming className="loading-class">
            <div data-testid="loading">Loading...</div>
          </TamboPropStreamProvider.Streaming>
        </TamboPropStreamProvider>,
      );

      const loadingElement = screen.getByTestId("loading").parentElement;
      expect(loadingElement).toHaveClass("loading-class");
    });
  });
});
