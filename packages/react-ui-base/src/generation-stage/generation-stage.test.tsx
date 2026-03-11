import { describe, expect, it, jest } from "@jest/globals";
import { useTambo } from "@tambo-ai/react";
import { render, screen } from "@testing-library/react";
import { GenerationStage } from "./index";

describe("GenerationStage", () => {
  const mockUseTambo = jest.mocked(useTambo);

  beforeEach(() => {
    mockUseTambo.mockReturnValue({
      messages: [],
      isStreaming: false,
      isWaiting: false,
      isIdle: true,
      currentThreadId: "thread-1",
      switchThread: jest.fn(),
      startNewThread: jest.fn().mockReturnValue("new-thread-id"),
    } as never);
  });

  it("renders Root with data-slot attribute", () => {
    const { container } = render(
      <GenerationStage.Root>
        <span>child</span>
      </GenerationStage.Root>,
    );

    expect(
      container.querySelector('[data-slot="generation-stage"]'),
    ).toBeTruthy();
  });

  it("throws when parts are used outside Root", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<GenerationStage.Content />)).toThrow(
      "GenerationStageContext is missing",
    );
    spy.mockRestore();
  });

  describe("Content", () => {
    it("renders when not idle (waiting)", () => {
      mockUseTambo.mockReturnValue({
        isStreaming: false,
        isWaiting: true,
        isIdle: false,
      } as never);

      const { container } = render(
        <GenerationStage.Root>
          <GenerationStage.Content>
            <span>active</span>
          </GenerationStage.Content>
        </GenerationStage.Root>,
      );

      expect(
        container.querySelector('[data-slot="generation-stage-content"]'),
      ).toBeTruthy();
    });

    it("renders when not idle (streaming)", () => {
      mockUseTambo.mockReturnValue({
        isStreaming: true,
        isWaiting: false,
        isIdle: false,
      } as never);

      const { container } = render(
        <GenerationStage.Root>
          <GenerationStage.Content>
            <span>active</span>
          </GenerationStage.Content>
        </GenerationStage.Root>,
      );

      expect(
        container.querySelector('[data-slot="generation-stage-content"]'),
      ).toBeTruthy();
    });

    it("unmounts when idle", () => {
      const { container } = render(
        <GenerationStage.Root>
          <GenerationStage.Content>
            <span>active</span>
          </GenerationStage.Content>
        </GenerationStage.Root>,
      );

      expect(
        container.querySelector('[data-slot="generation-stage-content"]'),
      ).toBeNull();
    });

    it("keeps mounted with keepMounted and sets data-hidden and aria-hidden when idle", () => {
      const { container } = render(
        <GenerationStage.Root>
          <GenerationStage.Content keepMounted>
            <span>active</span>
          </GenerationStage.Content>
        </GenerationStage.Root>,
      );

      const el = container.querySelector(
        '[data-slot="generation-stage-content"]',
      );
      expect(el).toBeTruthy();
      expect(el?.hasAttribute("data-hidden")).toBe(true);
      expect(el?.getAttribute("aria-hidden")).toBe("true");
    });
  });

  describe("Waiting", () => {
    it("renders default text when no children provided", () => {
      mockUseTambo.mockReturnValue({
        isStreaming: false,
        isWaiting: true,
        isIdle: false,
      } as never);

      render(
        <GenerationStage.Root>
          <GenerationStage.Waiting />
        </GenerationStage.Root>,
      );

      expect(screen.getByText("Preparing response")).toBeTruthy();
    });

    it("renders when waiting", () => {
      mockUseTambo.mockReturnValue({
        isStreaming: false,
        isWaiting: true,
        isIdle: false,
      } as never);

      const { container } = render(
        <GenerationStage.Root>
          <GenerationStage.Waiting>
            <span>Preparing response</span>
          </GenerationStage.Waiting>
        </GenerationStage.Root>,
      );

      expect(
        container.querySelector('[data-slot="generation-stage-waiting"]'),
      ).toBeTruthy();
    });

    it("unmounts when not waiting", () => {
      mockUseTambo.mockReturnValue({
        isStreaming: true,
        isWaiting: false,
        isIdle: false,
      } as never);

      const { container } = render(
        <GenerationStage.Root>
          <GenerationStage.Waiting>
            <span>Preparing response</span>
          </GenerationStage.Waiting>
        </GenerationStage.Root>,
      );

      expect(
        container.querySelector('[data-slot="generation-stage-waiting"]'),
      ).toBeNull();
    });

    it("keeps mounted with keepMounted and sets data-hidden and aria-hidden", () => {
      const { container } = render(
        <GenerationStage.Root>
          <GenerationStage.Waiting keepMounted>
            <span>Preparing response</span>
          </GenerationStage.Waiting>
        </GenerationStage.Root>,
      );

      const el = container.querySelector(
        '[data-slot="generation-stage-waiting"]',
      );
      expect(el).toBeTruthy();
      expect(el?.hasAttribute("data-hidden")).toBe(true);
      expect(el?.getAttribute("aria-hidden")).toBe("true");
    });
  });

  describe("Streaming", () => {
    it("renders default text when no children provided", () => {
      mockUseTambo.mockReturnValue({
        isStreaming: true,
        isWaiting: false,
        isIdle: false,
      } as never);

      render(
        <GenerationStage.Root>
          <GenerationStage.Streaming />
        </GenerationStage.Root>,
      );

      expect(screen.getByText("Generating response")).toBeTruthy();
    });

    it("renders when streaming", () => {
      mockUseTambo.mockReturnValue({
        isStreaming: true,
        isWaiting: false,
        isIdle: false,
      } as never);

      const { container } = render(
        <GenerationStage.Root>
          <GenerationStage.Streaming>
            <span>Generating response</span>
          </GenerationStage.Streaming>
        </GenerationStage.Root>,
      );

      expect(
        container.querySelector('[data-slot="generation-stage-streaming"]'),
      ).toBeTruthy();
    });

    it("unmounts when not streaming", () => {
      mockUseTambo.mockReturnValue({
        isStreaming: false,
        isWaiting: true,
        isIdle: false,
      } as never);

      const { container } = render(
        <GenerationStage.Root>
          <GenerationStage.Streaming>
            <span>Generating response</span>
          </GenerationStage.Streaming>
        </GenerationStage.Root>,
      );

      expect(
        container.querySelector('[data-slot="generation-stage-streaming"]'),
      ).toBeNull();
    });

    it("keeps mounted with keepMounted and sets data-hidden and aria-hidden", () => {
      const { container } = render(
        <GenerationStage.Root>
          <GenerationStage.Streaming keepMounted>
            <span>Generating response</span>
          </GenerationStage.Streaming>
        </GenerationStage.Root>,
      );

      const el = container.querySelector(
        '[data-slot="generation-stage-streaming"]',
      );
      expect(el).toBeTruthy();
      expect(el?.hasAttribute("data-hidden")).toBe(true);
      expect(el?.getAttribute("aria-hidden")).toBe("true");
    });
  });

  it("exposes state via Root render prop", () => {
    mockUseTambo.mockReturnValue({
      isStreaming: true,
      isWaiting: false,
      isIdle: false,
    } as never);

    let capturedState:
      | { isStreaming: boolean; isWaiting: boolean; isIdle: boolean }
      | undefined;
    render(
      <GenerationStage.Root
        render={(props, state) => {
          capturedState = state;
          return <div {...props} />;
        }}
      />,
    );

    expect(capturedState?.isStreaming).toBe(true);
    expect(capturedState?.isWaiting).toBe(false);
    expect(capturedState?.isIdle).toBe(false);
  });
});
