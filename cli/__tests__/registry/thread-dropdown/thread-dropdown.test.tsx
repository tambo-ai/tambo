import React from "react";
import { render, screen } from "@testing-library/react";
import { ThreadDropdown } from "../../../src/registry/thread-dropdown/thread-dropdown";
import { useTamboThread, useTamboThreadList } from "@tambo-ai/react";

jest.mock("@tambo-ai/react");

describe("ThreadDropdown", () => {
  const mockUseTamboThread = useTamboThread as jest.MockedFunction<
    typeof useTamboThread
  >;
  const mockUseTamboThreadList = useTamboThreadList as jest.MockedFunction<
    typeof useTamboThreadList
  >;

  beforeEach(() => {
    mockUseTamboThread.mockReturnValue({
      switchCurrentThread: jest.fn(),
      startNewThread: jest.fn(),
    } as never);

    mockUseTamboThreadList.mockReturnValue({
      data: { items: [] },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as never);
  });

  it("renders the dropdown trigger", () => {
    render(<ThreadDropdown />);
    const trigger = screen.getByRole("button", { name: /thread history/i });
    expect(trigger).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    const { container } = render(<ThreadDropdown className="custom-class" />);
    const dropdown = container.firstChild as HTMLElement;
    expect(dropdown).toHaveClass("custom-class");
  });

  it("passes contextKey to useTamboThreadList", () => {
    const contextKey = "test-context";
    render(<ThreadDropdown contextKey={contextKey} />);
    expect(mockUseTamboThreadList).toHaveBeenCalledWith({ contextKey });
  });
});
