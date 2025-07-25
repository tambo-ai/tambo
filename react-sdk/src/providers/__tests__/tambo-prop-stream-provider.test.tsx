import { render, screen } from "@testing-library/react";
import React from "react";
import { StreamStatus } from "../../hooks/use-tambo-stream-status";
import {
  TamboPropStreamProvider,
  useTamboStream,
} from "../tambo-prop-stream-provider";

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

  describe("Basic Functionality", () => {
    it("should provide stream status through context", () => {
      const testStreamStatus: StreamStatus = {
        isPending: false,
        isStreaming: false,
        isSuccess: true,
        isError: false,
        streamError: undefined,
      };

      render(
        <TamboPropStreamProvider streamStatus={testStreamStatus}>
          <TestHookComponent />
        </TamboPropStreamProvider>,
      );

      expect(screen.getByTestId("stream-status")).toHaveTextContent(
        JSON.stringify(testStreamStatus),
      );
    });

    it("should use default stream status when none provided", () => {
      const expectedDefaultStatus = {
        isPending: false,
        isStreaming: false,
        isSuccess: true,
        isError: false,
        streamError: undefined,
      };

      render(
        <TamboPropStreamProvider>
          <TestHookComponent />
        </TamboPropStreamProvider>,
      );

      expect(screen.getByTestId("stream-status")).toHaveTextContent(
        JSON.stringify(expectedDefaultStatus),
      );
    });
  });

  describe("Compound Components", () => {
    describe("Loading Component", () => {
      it("should render loading when isPending is true", () => {
        const streamStatus: StreamStatus = {
          isPending: true,
          isStreaming: false,
          isSuccess: false,
          isError: false,
        };

        render(
          <TamboPropStreamProvider streamStatus={streamStatus}>
            <TamboPropStreamProvider.Loading>
              <div data-testid="loading">Loading...</div>
            </TamboPropStreamProvider.Loading>
          </TamboPropStreamProvider>,
        );

        expect(screen.getByTestId("loading")).toBeInTheDocument();
      });

      it("should render loading when isStreaming is true", () => {
        const streamStatus: StreamStatus = {
          isPending: false,
          isStreaming: true,
          isSuccess: false,
          isError: false,
        };

        render(
          <TamboPropStreamProvider streamStatus={streamStatus}>
            <TamboPropStreamProvider.Loading>
              <div data-testid="loading">Loading...</div>
            </TamboPropStreamProvider.Loading>
          </TamboPropStreamProvider>,
        );

        expect(screen.getByTestId("loading")).toBeInTheDocument();
      });

      it("should not render loading when not pending or streaming", () => {
        const streamStatus: StreamStatus = {
          isPending: false,
          isStreaming: false,
          isSuccess: true,
          isError: false,
        };

        render(
          <TamboPropStreamProvider streamStatus={streamStatus}>
            <TamboPropStreamProvider.Loading>
              <div data-testid="loading">Loading...</div>
            </TamboPropStreamProvider.Loading>
          </TamboPropStreamProvider>,
        );

        expect(screen.queryByTestId("loading")).not.toBeInTheDocument();
      });
    });

    describe("Complete Component", () => {
      it("should render complete when isSuccess is true", () => {
        const streamStatus: StreamStatus = {
          isPending: false,
          isStreaming: false,
          isSuccess: true,
          isError: false,
        };

        render(
          <TamboPropStreamProvider streamStatus={streamStatus}>
            <TamboPropStreamProvider.Complete>
              <div data-testid="complete">Complete!</div>
            </TamboPropStreamProvider.Complete>
          </TamboPropStreamProvider>,
        );

        expect(screen.getByTestId("complete")).toBeInTheDocument();
      });

      it("should not render complete when isSuccess is false", () => {
        const streamStatus: StreamStatus = {
          isPending: false,
          isStreaming: false,
          isSuccess: false,
          isError: false,
        };

        render(
          <TamboPropStreamProvider streamStatus={streamStatus}>
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
        const streamStatus: StreamStatus = {
          isPending: false,
          isStreaming: false,
          isSuccess: false,
          isError: false,
        };

        render(
          <TamboPropStreamProvider streamStatus={streamStatus}>
            <TamboPropStreamProvider.Empty>
              <div data-testid="empty">Empty!</div>
            </TamboPropStreamProvider.Empty>
          </TamboPropStreamProvider>,
        );

        expect(screen.getByTestId("empty")).toBeInTheDocument();
      });

      it("should not render empty when isPending is true", () => {
        const streamStatus: StreamStatus = {
          isPending: true,
          isStreaming: false,
          isSuccess: false,
          isError: false,
        };

        render(
          <TamboPropStreamProvider streamStatus={streamStatus}>
            <TamboPropStreamProvider.Empty>
              <div data-testid="empty">Empty!</div>
            </TamboPropStreamProvider.Empty>
          </TamboPropStreamProvider>,
        );

        expect(screen.queryByTestId("empty")).not.toBeInTheDocument();
      });

      it("should not render empty when isStreaming is true", () => {
        const streamStatus: StreamStatus = {
          isPending: false,
          isStreaming: true,
          isSuccess: false,
          isError: false,
        };

        render(
          <TamboPropStreamProvider streamStatus={streamStatus}>
            <TamboPropStreamProvider.Empty>
              <div data-testid="empty">Empty!</div>
            </TamboPropStreamProvider.Empty>
          </TamboPropStreamProvider>,
        );

        expect(screen.queryByTestId("empty")).not.toBeInTheDocument();
      });

      it("should not render empty when isSuccess is true", () => {
        const streamStatus: StreamStatus = {
          isPending: false,
          isStreaming: false,
          isSuccess: true,
          isError: false,
        };

        render(
          <TamboPropStreamProvider streamStatus={streamStatus}>
            <TamboPropStreamProvider.Empty>
              <div data-testid="empty">Empty!</div>
            </TamboPropStreamProvider.Empty>
          </TamboPropStreamProvider>,
        );

        expect(screen.queryByTestId("empty")).not.toBeInTheDocument();
      });

      it("should not render empty when isError is true", () => {
        const streamStatus: StreamStatus = {
          isPending: false,
          isStreaming: false,
          isSuccess: false,
          isError: true,
        };

        render(
          <TamboPropStreamProvider streamStatus={streamStatus}>
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
    it("should provide status for specific keys", () => {
      const propStatus = {
        name: {
          isPending: false,
          isStreaming: false,
          isSuccess: true,
          error: undefined,
        },
        age: {
          isPending: true,
          isStreaming: false,
          isSuccess: false,
          error: undefined,
        },
      };

      render(
        <TamboPropStreamProvider propStatus={propStatus}>
          <TestHookComponent testKey="name" />
        </TamboPropStreamProvider>,
      );

      const keyStatus = JSON.parse(
        screen.getByTestId("key-status").textContent!,
      );
      expect(keyStatus.isSuccess).toBe(true);
    });

    it("should provide status for keys not in propStatus", () => {
      const propStatus = {
        name: {
          isPending: false,
          isStreaming: false,
          isSuccess: true,
          error: undefined,
        },
      };

      render(
        <TamboPropStreamProvider propStatus={propStatus}>
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
      const propStatus = {
        name: {
          isPending: true,
          isStreaming: false,
          isSuccess: false,
          error: undefined,
        },
        age: {
          isPending: false,
          isStreaming: false,
          isSuccess: true,
          error: undefined,
        },
      };

      render(
        <TamboPropStreamProvider propStatus={propStatus}>
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

      expect(screen.getByTestId("name-loading")).toBeInTheDocument();
      expect(screen.queryByTestId("age-loading")).not.toBeInTheDocument();
      expect(screen.queryByTestId("name-complete")).not.toBeInTheDocument();
    });

    it("should render complete for specific key when successful", () => {
      const propStatus = {
        name: {
          isPending: false,
          isStreaming: false,
          isSuccess: true,
          error: undefined,
        },
        age: {
          isPending: false,
          isStreaming: false,
          isSuccess: true,
          error: undefined,
        },
        email: {
          isPending: false,
          isStreaming: false,
          isSuccess: true,
          error: undefined,
        },
      };

      render(
        <TamboPropStreamProvider propStatus={propStatus}>
          <TamboPropStreamProvider.Complete streamKey="name">
            <div data-testid="name-complete">Name Complete!</div>
          </TamboPropStreamProvider.Complete>
          <TamboPropStreamProvider.Complete streamKey="age">
            <div data-testid="age-complete">Age Complete!</div>
          </TamboPropStreamProvider.Complete>
          <TamboPropStreamProvider.Complete streamKey="email">
            <div data-testid="email-complete">Email Complete!</div>
          </TamboPropStreamProvider.Complete>
        </TamboPropStreamProvider>,
      );

      expect(screen.getByTestId("name-complete")).toBeInTheDocument();
      expect(screen.getByTestId("age-complete")).toBeInTheDocument();
      expect(screen.getByTestId("email-complete")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should apply className to loading component", () => {
      const streamStatus: StreamStatus = {
        isPending: true,
        isStreaming: false,
        isSuccess: false,
        isError: false,
      };

      render(
        <TamboPropStreamProvider streamStatus={streamStatus}>
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
