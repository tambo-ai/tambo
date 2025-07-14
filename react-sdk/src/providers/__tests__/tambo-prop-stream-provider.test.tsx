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
  const { data, streamStatus, getStatusForKey } = useTamboStream();
  const status = getStatusForKey(testKey);

  return (
    <div>
      <div data-testid="data">{JSON.stringify(data)}</div>
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
    it("should provide data and stream status through context", () => {
      const testData = { message: "Hello World" };
      const testStreamStatus: StreamStatus = {
        isPending: false,
        isStreaming: false,
        isSuccess: true,
        isError: false,
        streamError: undefined,
      };

      render(
        <TamboPropStreamProvider
          data={testData}
          streamStatus={testStreamStatus}
        >
          <TestHookComponent />
        </TamboPropStreamProvider>,
      );

      expect(screen.getByTestId("data")).toHaveTextContent(
        JSON.stringify(testData),
      );
      expect(screen.getByTestId("stream-status")).toHaveTextContent(
        JSON.stringify(testStreamStatus),
      );
    });

    it("should use default stream status when none provided", () => {
      const testData = { message: "Hello World" };
      const expectedDefaultStatus = {
        isPending: false,
        isStreaming: false,
        isSuccess: true,
        isError: false,
        streamError: undefined,
      };

      render(
        <TamboPropStreamProvider data={testData}>
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
          <TamboPropStreamProvider data={null} streamStatus={streamStatus}>
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
          <TamboPropStreamProvider data={null} streamStatus={streamStatus}>
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
          <TamboPropStreamProvider data="test" streamStatus={streamStatus}>
            <TamboPropStreamProvider.Loading>
              <div data-testid="loading">Loading...</div>
            </TamboPropStreamProvider.Loading>
          </TamboPropStreamProvider>,
        );

        expect(screen.queryByTestId("loading")).not.toBeInTheDocument();
      });
    });

    describe("Complete Component", () => {
      it("should render complete when isSuccess is true and data exists", () => {
        const streamStatus: StreamStatus = {
          isPending: false,
          isStreaming: false,
          isSuccess: true,
          isError: false,
        };

        render(
          <TamboPropStreamProvider data="test data" streamStatus={streamStatus}>
            <TamboPropStreamProvider.Complete>
              <div data-testid="complete">Complete!</div>
            </TamboPropStreamProvider.Complete>
          </TamboPropStreamProvider>,
        );

        expect(screen.getByTestId("complete")).toBeInTheDocument();
      });

      it("should not render complete when data is null", () => {
        const streamStatus: StreamStatus = {
          isPending: false,
          isStreaming: false,
          isSuccess: true,
          isError: false,
        };

        render(
          <TamboPropStreamProvider data={null} streamStatus={streamStatus}>
            <TamboPropStreamProvider.Complete>
              <div data-testid="complete">Complete!</div>
            </TamboPropStreamProvider.Complete>
          </TamboPropStreamProvider>,
        );

        expect(screen.queryByTestId("complete")).not.toBeInTheDocument();
      });

      it("should not render complete when data is undefined", () => {
        const streamStatus: StreamStatus = {
          isPending: false,
          isStreaming: false,
          isSuccess: true,
          isError: false,
        };

        render(
          <TamboPropStreamProvider data={undefined} streamStatus={streamStatus}>
            <TamboPropStreamProvider.Complete>
              <div data-testid="complete">Complete!</div>
            </TamboPropStreamProvider.Complete>
          </TamboPropStreamProvider>,
        );

        expect(screen.queryByTestId("complete")).not.toBeInTheDocument();
      });
    });

    describe("Empty Component", () => {
      it("should render empty when no data and not loading/streaming/success/error", () => {
        const streamStatus: StreamStatus = {
          isPending: false,
          isStreaming: false,
          isSuccess: false,
          isError: false,
        };

        render(
          <TamboPropStreamProvider data={null} streamStatus={streamStatus}>
            <TamboPropStreamProvider.Empty>
              <div data-testid="empty">No data</div>
            </TamboPropStreamProvider.Empty>
          </TamboPropStreamProvider>,
        );

        expect(screen.getByTestId("empty")).toBeInTheDocument();
      });

      it("should render empty when data is empty string", () => {
        const streamStatus: StreamStatus = {
          isPending: false,
          isStreaming: false,
          isSuccess: false,
          isError: false,
        };

        render(
          <TamboPropStreamProvider data="" streamStatus={streamStatus}>
            <TamboPropStreamProvider.Empty>
              <div data-testid="empty">No data</div>
            </TamboPropStreamProvider.Empty>
          </TamboPropStreamProvider>,
        );

        expect(screen.getByTestId("empty")).toBeInTheDocument();
      });

      it("should not render empty when loading", () => {
        const streamStatus: StreamStatus = {
          isPending: true,
          isStreaming: false,
          isSuccess: false,
          isError: false,
        };

        render(
          <TamboPropStreamProvider data={null} streamStatus={streamStatus}>
            <TamboPropStreamProvider.Empty>
              <div data-testid="empty">No data</div>
            </TamboPropStreamProvider.Empty>
          </TamboPropStreamProvider>,
        );

        expect(screen.queryByTestId("empty")).not.toBeInTheDocument();
      });

      it("should not render empty when successful", () => {
        const streamStatus: StreamStatus = {
          isPending: false,
          isStreaming: false,
          isSuccess: true,
          isError: false,
        };

        render(
          <TamboPropStreamProvider data={null} streamStatus={streamStatus}>
            <TamboPropStreamProvider.Empty>
              <div data-testid="empty">No data</div>
            </TamboPropStreamProvider.Empty>
          </TamboPropStreamProvider>,
        );

        expect(screen.queryByTestId("empty")).not.toBeInTheDocument();
      });
    });
  });

  describe("Per-Key Status Tracking", () => {
    it("should track status for object keys", () => {
      const testData = { name: "John", age: null };
      const streamStatus: StreamStatus = {
        isPending: false,
        isStreaming: false,
        isSuccess: true,
        isError: false,
      };

      render(
        <TamboPropStreamProvider data={testData} streamStatus={streamStatus}>
          <TestHookComponent testKey="name" />
        </TamboPropStreamProvider>,
      );

      const keyStatus = JSON.parse(
        screen.getByTestId("key-status").textContent ?? "{}",
      );
      expect(keyStatus.isSuccess).toBe(true); // name has data
    });

    it("should show loading for keys without data", () => {
      const testData = { name: "John", age: null };
      const streamStatus: StreamStatus = {
        isPending: false,
        isStreaming: false,
        isSuccess: true,
        isError: false,
      };

      render(
        <TamboPropStreamProvider data={testData} streamStatus={streamStatus}>
          <TestHookComponent testKey="age" />
        </TamboPropStreamProvider>,
      );

      const keyStatus = JSON.parse(
        screen.getByTestId("key-status").textContent ?? "{}",
      );
      expect(keyStatus.isPending).toBe(true); // age has no data
    });

    it("should handle per-key loading states", () => {
      render(
        <TamboPropStreamProvider data={{ name: "John", age: null }}>
          <TamboPropStreamProvider.Loading streamKey="name">
            <div data-testid="name-loading">Name loading...</div>
          </TamboPropStreamProvider.Loading>
          <TamboPropStreamProvider.Loading streamKey="age">
            <div data-testid="age-loading">Age loading...</div>
          </TamboPropStreamProvider.Loading>
          <TamboPropStreamProvider.Complete streamKey="name">
            <div data-testid="name-complete">Name: John</div>
          </TamboPropStreamProvider.Complete>
        </TamboPropStreamProvider>,
      );

      // Name should be complete (has data)
      expect(screen.getByTestId("name-complete")).toBeInTheDocument();
      expect(screen.queryByTestId("name-loading")).not.toBeInTheDocument();

      // Age should be loading (no data)
      expect(screen.getByTestId("age-loading")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle null data gracefully", () => {
      render(
        <TamboPropStreamProvider data={null}>
          <TestHookComponent />
        </TamboPropStreamProvider>,
      );

      expect(screen.getByTestId("data")).toHaveTextContent("null");
    });

    it("should handle undefined data gracefully", () => {
      render(
        <TamboPropStreamProvider data={undefined}>
          <TestHookComponent />
        </TamboPropStreamProvider>,
      );

      expect(screen.getByTestId("data")).toHaveTextContent("");
    });

    it("should handle array data", () => {
      const arrayData = ["item1", "item2"];
      render(
        <TamboPropStreamProvider data={arrayData}>
          <TestHookComponent />
        </TamboPropStreamProvider>,
      );

      expect(screen.getByTestId("data")).toHaveTextContent(
        JSON.stringify(arrayData),
      );
    });

    it("should handle primitive data types", () => {
      render(
        <TamboPropStreamProvider data="string data">
          <TestHookComponent />
        </TamboPropStreamProvider>,
      );

      expect(screen.getByTestId("data")).toHaveTextContent('"string data"');
    });

    it("should fallback to default status for unknown keys", () => {
      const testData = { name: "John" };

      render(
        <TamboPropStreamProvider data={testData}>
          <TestHookComponent testKey="unknown-key" />
        </TamboPropStreamProvider>,
      );

      const keyStatus = JSON.parse(
        screen.getByTestId("key-status").textContent ?? "{}",
      );
      // Should fallback to default status
      expect(keyStatus.isSuccess).toBe(true);
    });
  });

  describe("Component Attributes", () => {
    it("should add correct data attributes to components", () => {
      const streamStatus: StreamStatus = {
        isPending: true,
        isStreaming: false,
        isSuccess: false,
        isError: false,
      };

      render(
        <TamboPropStreamProvider data={null} streamStatus={streamStatus}>
          <TamboPropStreamProvider.Loading className="loading-class">
            <div>Loading...</div>
          </TamboPropStreamProvider.Loading>
        </TamboPropStreamProvider>,
      );

      const loadingElement = screen.getByText("Loading...").parentElement;
      expect(loadingElement).toHaveAttribute("data-stream-key", "default");
      expect(loadingElement).toHaveAttribute("data-stream-state", "loading");
      expect(loadingElement).toHaveClass("loading-class");
    });
  });
});
