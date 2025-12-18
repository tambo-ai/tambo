/// <reference types="@testing-library/jest-dom" />
import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import React from "react";
import { render } from "@testing-library/react";
import { ScrollableMessageContainer } from "../../../src/registry/scrollable-message-container/scrollable-message-container";
import { useTambo } from "@tambo-ai/react";

// @tambo-ai/react is mocked via moduleNameMapper in jest.config.react.ts

describe("ScrollableMessageContainer", () => {
  const mockUseTambo = jest.mocked(useTambo);

  beforeEach(() => {
    mockUseTambo.mockReturnValue({
      thread: {
        messages: [],
        generationStage: "IDLE",
      },
    } as never);
  });

  it("renders children correctly", () => {
    const { getByText } = render(
      <ScrollableMessageContainer>
        <div>Test Content</div>
      </ScrollableMessageContainer>,
    );
    expect(getByText("Test Content")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <ScrollableMessageContainer className="custom-class">
        <div>Content</div>
      </ScrollableMessageContainer>,
    );
    const scrollContainer = container.querySelector(
      '[data-slot="scrollable-message-container"]',
    );
    expect(scrollContainer).toHaveClass("custom-class");
  });

  it("has default scroll styling classes", () => {
    const { container } = render(
      <ScrollableMessageContainer>
        <div>Content</div>
      </ScrollableMessageContainer>,
    );
    const scrollContainer = container.querySelector(
      '[data-slot="scrollable-message-container"]',
    );
    expect(scrollContainer).toHaveClass("flex-1", "overflow-y-auto");
  });

  it("passes through additional props", () => {
    const { container } = render(
      <ScrollableMessageContainer data-testid="test-container">
        <div>Content</div>
      </ScrollableMessageContainer>,
    );
    const scrollContainer = container.querySelector(
      '[data-slot="scrollable-message-container"]',
    );
    expect(scrollContainer).toHaveAttribute("data-testid", "test-container");
  });
});
