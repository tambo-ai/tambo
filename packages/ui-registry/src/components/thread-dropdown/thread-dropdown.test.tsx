/// <reference types="@testing-library/jest-dom" />
import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThreadDropdown } from "./thread-dropdown";
import { useTamboThread, useTamboThreadList } from "@tambo-ai/react";

// @tambo-ai/react is mocked via moduleNameMapper in jest.config.ts

describe("ThreadDropdown", () => {
  const mockUseTamboThread = jest.mocked(useTamboThread);
  const mockUseTamboThreadList = jest.mocked(useTamboThreadList);

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

  it("calls useTamboThreadList without arguments (contextKey comes from provider)", () => {
    render(<ThreadDropdown />);
    expect(mockUseTamboThreadList).toHaveBeenCalledWith();
  });

  describe("keyboard navigation", () => {
    it("renders trigger as a button element for keyboard accessibility", () => {
      render(<ThreadDropdown />);
      const trigger = screen.getByRole("button", { name: /thread history/i });
      expect(trigger.tagName).toBe("BUTTON");
    });

    it("opens dropdown with keyboard", async () => {
      const user = userEvent.setup();
      mockUseTamboThreadList.mockReturnValue({
        data: { items: [{ id: "thread-1" }] },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as never);

      render(<ThreadDropdown />);
      const trigger = screen.getByRole("button", { name: /thread history/i });

      trigger.focus();
      await user.keyboard("{Enter}");

      const newThreadItem = await screen.findByText("New Thread");
      expect(newThreadItem).toBeInTheDocument();
    });
  });
});
