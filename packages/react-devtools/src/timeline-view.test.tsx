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
});
