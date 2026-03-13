import type { DevtoolsEvent } from "@tambo-ai/client";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TimelineView } from "./timeline-view";

function makeEvent(
  overrides: Partial<DevtoolsEvent> & { type: string },
): DevtoolsEvent {
  return {
    id: `tdt_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: 100,
    threadId: "thread_1",
    detail: {},
    ...overrides,
  };
}

describe("TimelineView", () => {
  it("renders empty state when no events", () => {
    render(<TimelineView events={[]} onClear={vi.fn()} />);

    expect(screen.getByText("No events captured")).toBeInTheDocument();
    expect(
      screen.getByText("Send a message to see timeline events appear here."),
    ).toBeInTheDocument();
  });

  it("renders table with correct column headers", () => {
    const events = [makeEvent({ type: "RUN_STARTED" })];
    render(<TimelineView events={events} onClear={vi.fn()} />);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Initiator")).toBeInTheDocument();
    expect(screen.getByText("Time")).toBeInTheDocument();
    expect(screen.getByText("Thread")).toBeInTheDocument();
    expect(screen.getByText("Waterfall")).toBeInTheDocument();
  });

  it("renders rows for each event", () => {
    const events = [
      makeEvent({ id: "e1", type: "RUN_STARTED", timestamp: 100 }),
      makeEvent({ id: "e2", type: "user_message", timestamp: 150 }),
      makeEvent({ id: "e3", type: "TEXT_MESSAGE_START", timestamp: 200 }),
    ];
    render(<TimelineView events={events} onClear={vi.fn()} />);

    // Should have 3 data rows (plus header row)
    const rows = screen.getAllByRole("row");
    // 1 header row + 3 data rows
    expect(rows).toHaveLength(4);
  });

  it("shows event count", () => {
    const events = [
      makeEvent({ id: "e1", type: "RUN_STARTED" }),
      makeEvent({ id: "e2", type: "RUN_FINISHED" }),
    ];
    render(<TimelineView events={events} onClear={vi.fn()} />);

    expect(screen.getByText("2 events")).toBeInTheDocument();
  });

  it("shows singular event count for 1 event", () => {
    const events = [makeEvent({ type: "RUN_STARTED" })];
    render(<TimelineView events={events} onClear={vi.fn()} />);

    expect(screen.getByText("1 event")).toBeInTheDocument();
  });

  it("calls onClear when Clear button is clicked", () => {
    const onClear = vi.fn();
    const events = [makeEvent({ type: "RUN_STARTED" })];
    render(<TimelineView events={events} onClear={onClear} />);

    fireEvent.click(screen.getByRole("button", { name: "Clear timeline" }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("displays event names correctly", () => {
    const events = [
      makeEvent({ type: "RUN_STARTED", id: "e1" }),
      makeEvent({ type: "user_message", id: "e2" }),
      makeEvent({
        type: "TOOL_CALL_START",
        id: "e3",
        detail: { toolCallName: "fetchData" },
      }),
      makeEvent({
        type: "tambo.component.start",
        id: "e4",
        detail: { name: "WeatherCard" },
      }),
    ];
    render(<TimelineView events={events} onClear={vi.fn()} />);

    expect(screen.getByText("run")).toBeInTheDocument();
    expect(screen.getByText("user_message")).toBeInTheDocument();
    expect(screen.getByText("tool:fetchData")).toBeInTheDocument();
    expect(screen.getByText("component:WeatherCard")).toBeInTheDocument();
  });

  it("displays status badges", () => {
    const events = [
      makeEvent({ type: "RUN_STARTED", id: "e1" }),
      makeEvent({ type: "RUN_FINISHED", id: "e2" }),
      makeEvent({ type: "RUN_ERROR", id: "e3" }),
    ];
    render(<TimelineView events={events} onClear={vi.fn()} />);

    expect(screen.getByText("started")).toBeInTheDocument();
    expect(screen.getByText("complete")).toBeInTheDocument();
    expect(screen.getByText("(failed)")).toBeInTheDocument();
  });

  it("shows detail panel when event row is clicked", () => {
    const events = [
      makeEvent({
        id: "e1",
        type: "TOOL_CALL_START",
        detail: { toolCallName: "fetchData", toolCallId: "tc_1" },
      }),
    ];
    render(<TimelineView events={events} onClear={vi.fn()} />);

    // Click the row
    const row = screen.getAllByRole("row")[1]; // first data row
    fireEvent.click(row);

    // Detail panel should show JSON with the event data
    expect(screen.getByText(/tc_1/)).toBeInTheDocument();
  });

  it("deselects event when clicking same row again", () => {
    const events = [
      makeEvent({
        id: "e1",
        type: "TOOL_CALL_START",
        detail: { toolCallName: "fetchData", toolCallId: "tc_unique_123" },
      }),
    ];
    render(<TimelineView events={events} onClear={vi.fn()} />);

    const row = screen.getAllByRole("row")[1];
    fireEvent.click(row);
    expect(screen.getByText(/tc_unique_123/)).toBeInTheDocument();

    // Click again to deselect
    fireEvent.click(row);
    // The detail JSON containing tc_unique_123 should be gone
    // (it still shows in the table cell, but the <pre> detail panel should close)
    const preElements = document.querySelectorAll("pre");
    expect(preElements).toHaveLength(0);
  });

  it("truncates long thread IDs", () => {
    const events = [
      makeEvent({
        type: "RUN_STARTED",
        threadId: "abcdefghijklmnopqrstuvwxyz",
      }),
    ];
    render(<TimelineView events={events} onClear={vi.fn()} />);

    // 26 chars > 16, so should be truncated
    expect(screen.getByText("abcdefgh...uvwxyz")).toBeInTheDocument();
  });

  it("shows short thread IDs in full", () => {
    const events = [makeEvent({ type: "RUN_STARTED", threadId: "short_id" })];
    render(<TimelineView events={events} onClear={vi.fn()} />);

    expect(screen.getByText("short_id")).toBeInTheDocument();
  });

  describe("event name derivation", () => {
    it("shows assistant_message for TEXT_MESSAGE_START", () => {
      const events = [makeEvent({ type: "TEXT_MESSAGE_START", id: "e1" })];
      render(<TimelineView events={events} onClear={vi.fn()} />);

      expect(screen.getByText("assistant_message")).toBeInTheDocument();
    });

    it("shows assistant_message for TEXT_MESSAGE_END", () => {
      const events = [makeEvent({ type: "TEXT_MESSAGE_END", id: "e1" })];
      render(<TimelineView events={events} onClear={vi.fn()} />);

      expect(screen.getByText("assistant_message")).toBeInTheDocument();
    });

    it("shows tool_result for TOOL_CALL_RESULT", () => {
      const events = [makeEvent({ type: "TOOL_CALL_RESULT", id: "e1" })];
      render(<TimelineView events={events} onClear={vi.fn()} />);

      expect(screen.getByText("tool_result")).toBeInTheDocument();
    });

    it("shows tool_result for tool_result type", () => {
      const events = [makeEvent({ type: "tool_result", id: "e1" })];
      render(<TimelineView events={events} onClear={vi.fn()} />);

      expect(screen.getByText("tool_result")).toBeInTheDocument();
    });

    it("shows awaiting_input for tambo.run.awaiting_input", () => {
      const events = [
        makeEvent({ type: "tambo.run.awaiting_input", id: "e1" }),
      ];
      render(<TimelineView events={events} onClear={vi.fn()} />);

      expect(screen.getByText("awaiting_input")).toBeInTheDocument();
    });

    it("falls back to toolCallId when toolCallName is missing", () => {
      const events = [
        makeEvent({
          type: "TOOL_CALL_END",
          id: "e1",
          detail: { toolCallId: "tc_42" },
        }),
      ];
      render(<TimelineView events={events} onClear={vi.fn()} />);

      expect(screen.getByText("tool:tc_42")).toBeInTheDocument();
    });

    it("shows unknown for component without name", () => {
      const events = [
        makeEvent({ type: "tambo.component.end", id: "e1", detail: {} }),
      ];
      render(<TimelineView events={events} onClear={vi.fn()} />);

      expect(screen.getByText("component:unknown")).toBeInTheDocument();
    });

    it("shows raw type for unknown event types", () => {
      const events = [makeEvent({ type: "some.custom.event", id: "e1" })];
      render(<TimelineView events={events} onClear={vi.fn()} />);

      // The raw type appears both as the name and status, so use getAllByText
      const matches = screen.getAllByText("some.custom.event");
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("status derivation", () => {
    it("shows streaming for TEXT_MESSAGE_START", () => {
      const events = [makeEvent({ type: "TEXT_MESSAGE_START", id: "e1" })];
      render(<TimelineView events={events} onClear={vi.fn()} />);

      expect(screen.getByText("streaming")).toBeInTheDocument();
    });

    it("shows invoke for TOOL_CALL_START", () => {
      const events = [
        makeEvent({
          type: "TOOL_CALL_START",
          id: "e1",
          detail: { toolCallName: "fn" },
        }),
      ];
      render(<TimelineView events={events} onClear={vi.fn()} />);

      expect(screen.getByText("invoke")).toBeInTheDocument();
    });

    it("shows success for tool_result", () => {
      const events = [makeEvent({ type: "tool_result", id: "e1" })];
      render(<TimelineView events={events} onClear={vi.fn()} />);

      expect(screen.getByText("success")).toBeInTheDocument();
    });

    it("shows pending for tambo.run.awaiting_input", () => {
      const events = [
        makeEvent({ type: "tambo.run.awaiting_input", id: "e1" }),
      ];
      render(<TimelineView events={events} onClear={vi.fn()} />);

      expect(screen.getByText("pending")).toBeInTheDocument();
    });

    it("shows sent for user_message", () => {
      const events = [makeEvent({ type: "user_message", id: "e1" })];
      render(<TimelineView events={events} onClear={vi.fn()} />);

      expect(screen.getByText("sent")).toBeInTheDocument();
    });
  });

  describe("initiator derivation", () => {
    it("shows system for RUN_STARTED", () => {
      const events = [makeEvent({ type: "RUN_STARTED", id: "e1" })];
      render(<TimelineView events={events} onClear={vi.fn()} />);

      expect(screen.getByText("system")).toBeInTheDocument();
    });

    it("shows thread for user_message", () => {
      const events = [makeEvent({ type: "user_message", id: "e1" })];
      render(<TimelineView events={events} onClear={vi.fn()} />);

      expect(screen.getByText("thread")).toBeInTheDocument();
    });

    it("shows assistant for TEXT_MESSAGE_START", () => {
      const events = [makeEvent({ type: "TEXT_MESSAGE_START", id: "e1" })];
      render(<TimelineView events={events} onClear={vi.fn()} />);

      expect(screen.getByText("assistant")).toBeInTheDocument();
    });

    it("shows tool_call for TOOL_CALL_RESULT", () => {
      const events = [makeEvent({ type: "TOOL_CALL_RESULT", id: "e1" })];
      render(<TimelineView events={events} onClear={vi.fn()} />);

      expect(screen.getByText("tool_call")).toBeInTheDocument();
    });

    it("shows system for unknown event types", () => {
      const events = [makeEvent({ type: "some.unknown.type", id: "e1" })];
      render(<TimelineView events={events} onClear={vi.fn()} />);

      expect(screen.getByText("system")).toBeInTheDocument();
    });
  });

  describe("time formatting", () => {
    it("shows <1 ms for sub-millisecond offsets", () => {
      const events = [
        makeEvent({ type: "RUN_STARTED", id: "e1", timestamp: 100 }),
        makeEvent({ type: "RUN_FINISHED", id: "e2", timestamp: 100.5 }),
      ];
      render(<TimelineView events={events} onClear={vi.fn()} />);

      // First event is at offset 0, formatted as "<1 ms"
      // The ruler also shows "<1 ms" at tick 0, so multiple matches expected
      const matches = screen.getAllByText("<1 ms");
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });

    it("shows milliseconds for events under 1 second", () => {
      const events = [
        makeEvent({ type: "RUN_STARTED", id: "e1", timestamp: 100 }),
        makeEvent({ type: "RUN_FINISHED", id: "e2", timestamp: 350 }),
      ];
      render(<TimelineView events={events} onClear={vi.fn()} />);

      // The second event is at 250ms offset; ruler may also show "250 ms"
      const matches = screen.getAllByText("250 ms");
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });

    it("shows seconds for events over 1 second", () => {
      const events = [
        makeEvent({ type: "RUN_STARTED", id: "e1", timestamp: 100 }),
        makeEvent({ type: "RUN_FINISHED", id: "e2", timestamp: 2600 }),
      ];
      render(<TimelineView events={events} onClear={vi.fn()} />);

      // The second event is at 2500ms offset, formatted as "2.50 s"
      const matches = screen.getAllByText("2.50 s");
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
  });
});
