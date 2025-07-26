import { render, screen } from "@testing-library/react";
import React from "react";
import { useTamboCurrentMessage } from "../../hooks/use-current-message";
import {
  GenerationStage,
  TamboThreadMessage,
} from "../../model/generate-component-response";
import {
  TamboThreadContextProps,
  useTamboThread,
} from "../../providers/tambo-thread-provider";
import {
  TamboPropStreamProvider,
  useTamboStream,
} from "../tambo-prop-stream-provider";

// Mock the required providers
jest.mock("../../providers/tambo-thread-provider", () => ({
  useTamboThread: jest.fn(),
}));

jest.mock("../../hooks/use-current-message", () => ({
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
    jest.mocked(useTamboThread).mockReturnValue({
      generationStage: GenerationStage.IDLE,
    } as TamboThreadContextProps);

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
    describe("Loading Component", () => {
      it("should render loading when isPending is true", () => {
        jest.mocked(useTamboThread).mockReturnValue({
          generationStage: GenerationStage.IDLE,
        } as TamboThreadContextProps);

        jest.mocked(useTamboCurrentMessage).mockReturnValue(
          createMockMessage({
            component: createMockComponent({ title: "" }),
          }),
        );

        render(
          <TamboPropStreamProvider>
            <TamboPropStreamProvider.Loading>
              <div data-testid="loading">Loading...</div>
            </TamboPropStreamProvider.Loading>
          </TamboPropStreamProvider>,
        );

        expect(screen.getByTestId("loading")).toBeInTheDocument();
      });

      it("should render loading when isStreaming is true", () => {
        jest.mocked(useTamboThread).mockReturnValue({
          generationStage: GenerationStage.STREAMING_RESPONSE,
        } as TamboThreadContextProps);

        jest.mocked(useTamboCurrentMessage).mockReturnValue(
          createMockMessage({
            component: createMockComponent({ title: "Partial" }),
          }),
        );

        render(
          <TamboPropStreamProvider>
            <TamboPropStreamProvider.Loading>
              <div data-testid="loading">Loading...</div>
            </TamboPropStreamProvider.Loading>
          </TamboPropStreamProvider>,
        );

        expect(screen.getByTestId("loading")).toBeInTheDocument();
      });
    });

    describe("Complete Component", () => {
      it("should not render complete when isSuccess is false", () => {
        jest.mocked(useTamboThread).mockReturnValue({
          generationStage: GenerationStage.IDLE,
        } as TamboThreadContextProps);

        jest.mocked(useTamboCurrentMessage).mockReturnValue(
          createMockMessage({
            component: createMockComponent({ title: "" }),
          }),
        );

        render(
          <TamboPropStreamProvider>
            <TamboPropStreamProvider.Complete>
              <div data-testid="complete">Complete!</div>
            </TamboPropStreamProvider.Complete>
          </TamboPropStreamProvider>,
        );

        expect(screen.queryByTestId("complete")).not.toBeInTheDocument();
      });
    });

    describe("Empty Component", () => {
      it("should render empty when no active status", () => {
        jest.mocked(useTamboThread).mockReturnValue({
          generationStage: GenerationStage.IDLE,
        } as TamboThreadContextProps);

        jest.mocked(useTamboCurrentMessage).mockReturnValue(
          createMockMessage({
            component: createMockComponent({ title: "" }),
          }),
        );

        render(
          <TamboPropStreamProvider>
            <TamboPropStreamProvider.Empty>
              <div data-testid="empty">Empty!</div>
            </TamboPropStreamProvider.Empty>
          </TamboPropStreamProvider>,
        );

        expect(screen.getByTestId("empty")).toBeInTheDocument();
      });

      it("should not render empty when isPending is true", () => {
        jest.mocked(useTamboThread).mockReturnValue({
          generationStage: GenerationStage.STREAMING_RESPONSE,
        } as TamboThreadContextProps);

        jest.mocked(useTamboCurrentMessage).mockReturnValue(
          createMockMessage({
            component: createMockComponent({ title: "Partial" }),
          }),
        );

        render(
          <TamboPropStreamProvider>
            <TamboPropStreamProvider.Empty>
              <div data-testid="empty">Empty!</div>
            </TamboPropStreamProvider.Empty>
          </TamboPropStreamProvider>,
        );

        expect(screen.queryByTestId("empty")).not.toBeInTheDocument();
      });
    });
  });

  describe("Key-based Status", () => {
    it("should provide status for keys not in propStatus", () => {
      jest.mocked(useTamboThread).mockReturnValue({
        generationStage: GenerationStage.COMPLETE,
      } as TamboThreadContextProps);

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
        screen.getByTestId("key-status").textContent!,
      );
      expect(keyStatus.isPending).toBe(true);
    });
  });

  describe("Compound Components with Keys", () => {
    it("should render loading for specific key when pending", () => {
      jest.mocked(useTamboThread).mockReturnValue({
        generationStage: GenerationStage.STREAMING_RESPONSE,
      } as TamboThreadContextProps);

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
          <TamboPropStreamProvider.Loading streamKey="name">
            <div data-testid="name-loading">Name Loading...</div>
          </TamboPropStreamProvider.Loading>
          <TamboPropStreamProvider.Loading streamKey="age">
            <div data-testid="age-loading">Age Loading...</div>
          </TamboPropStreamProvider.Loading>
          <TamboPropStreamProvider.Complete streamKey="name">
            <div data-testid="name-complete">Name Complete!</div>
          </TamboPropStreamProvider.Complete>
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
      jest.mocked(useTamboThread).mockReturnValue({
        generationStage: GenerationStage.STREAMING_RESPONSE,
      } as TamboThreadContextProps);

      jest.mocked(useTamboCurrentMessage).mockReturnValue(
        createMockMessage({
          component: createMockComponent({ title: "Partial" }),
        }),
      );

      render(
        <TamboPropStreamProvider>
          <TamboPropStreamProvider.Loading className="loading-class">
            <div data-testid="loading">Loading...</div>
          </TamboPropStreamProvider.Loading>
        </TamboPropStreamProvider>,
      );

      const loadingElement = screen.getByTestId("loading").parentElement;
      expect(loadingElement).toHaveClass("loading-class");
    });
  });
});
