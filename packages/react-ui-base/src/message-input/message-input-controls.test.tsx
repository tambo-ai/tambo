/// <reference types="@testing-library/jest-dom" />
import { describe, expect, it, jest } from "@jest/globals";
import type {
  TamboElicitationRequest,
  TamboElicitationResponse,
} from "@tambo-ai/react/mcp";
import { fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { MessageInputContent } from "./message-input-content";
import { MessageInputElicitation } from "./message-input-elicitation";
import {
  MessageInputContext,
  type MessageInputContextValue,
} from "./message-input-context";
import { MessageInputStopButton } from "./message-input-stop-button";
import { MessageInputSubmitButton } from "./message-input-submit-button";

const NOOP_SET_STRING: React.Dispatch<
  React.SetStateAction<string | null>
> = () => undefined;

const createRequest = (): TamboElicitationRequest => ({
  message: "Choose one",
  requestedSchema: {
    type: "object",
    properties: {
      approval: {
        type: "boolean",
        description: "Approve change",
      },
    },
    required: ["approval"],
  },
});

const createContextValue = (
  overrides?: Partial<MessageInputContextValue>,
): MessageInputContextValue => {
  const defaultContextValue: MessageInputContextValue = {
    value: "",
    setValue: () => undefined,
    submitMessage: async () => undefined,
    submit: async () => ({ threadId: undefined }),
    handleSubmit: async () => undefined,
    isPending: false,
    error: null,
    editorRef: { current: null },
    submitError: null,
    setSubmitError: NOOP_SET_STRING,
    imageError: null,
    setImageError: NOOP_SET_STRING,
    elicitation: null,
    resolveElicitation: null,
    isIdle: true,
    cancel: async () => undefined,
    images: [],
    addImages: async () => undefined,
    addImage: async () => undefined,
    removeImage: () => undefined,
    isUpdatingToken: false,
    isDragging: false,
  };

  return { ...defaultContextValue, ...overrides };
};

const renderWithContext = (
  ui: React.ReactNode,
  contextOverrides?: Partial<MessageInputContextValue>,
) => {
  const value = createContextValue(contextOverrides);
  return render(
    <MessageInputContext.Provider value={value}>
      {ui}
    </MessageInputContext.Provider>,
  );
};

describe("MessageInput controls", () => {
  it("hides submit button while generation is active when keepMounted is false", () => {
    renderWithContext(
      <MessageInputSubmitButton>Send</MessageInputSubmitButton>,
      {
        isIdle: false,
      },
    );
    expect(screen.queryByRole("button", { name: "Send message" })).toBeNull();
  });

  it("keeps submit button mounted with data-hidden while generation is active", () => {
    const { container } = renderWithContext(
      <MessageInputSubmitButton keepMounted>Send</MessageInputSubmitButton>,
      { isIdle: false },
    );

    const button = container.querySelector(
      '[data-slot="message-input-submit"]',
    );
    if (!button) {
      throw new Error("Submit button was not rendered");
    }
    expect(button.getAttribute("data-hidden")).toBe("true");
  });

  it("shows submit button in loading state while token is updating during startup", () => {
    const { container } = renderWithContext(
      <MessageInputSubmitButton keepMounted>Send</MessageInputSubmitButton>,
      { isIdle: false, isUpdatingToken: true },
    );

    const button = container.querySelector(
      '[data-slot="message-input-submit"]',
    );
    if (!button) {
      throw new Error("Submit button was not rendered");
    }
    expect(button.getAttribute("data-loading")).toBe("true");
    expect(button.getAttribute("data-hidden")).toBeNull();
    expect(button.getAttribute("data-disabled")).toBe("true");
  });

  it("shows stop button while generation is active", () => {
    renderWithContext(<MessageInputStopButton>Stop</MessageInputStopButton>, {
      isIdle: false,
    });

    expect(
      screen.getByRole("button", { name: "Stop response" }),
    ).not.toBeNull();
  });

  it("runs cancel when stop button is clicked", () => {
    const cancel = jest.fn(async () => undefined);
    renderWithContext(<MessageInputStopButton>Stop</MessageInputStopButton>, {
      isIdle: false,
      cancel,
    });

    fireEvent.click(screen.getByRole("button", { name: "Stop response" }));
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("hides stop button while token is updating", () => {
    renderWithContext(<MessageInputStopButton>Stop</MessageInputStopButton>, {
      isIdle: false,
      isUpdatingToken: true,
    });

    expect(screen.queryByRole("button", { name: "Stop response" })).toBeNull();
  });
});

describe("MessageInput elicitation visibility", () => {
  it("hides content while elicitation is active", () => {
    renderWithContext(
      <MessageInputContent>input content</MessageInputContent>,
      { elicitation: createRequest() },
    );

    expect(screen.queryByText("input content")).toBeNull();
  });

  it("renders elicitation primitive when elicitation exists", () => {
    const resolveElicitation = jest.fn(
      (_response: TamboElicitationResponse) => undefined,
    );

    renderWithContext(<MessageInputElicitation />, {
      elicitation: createRequest(),
      resolveElicitation,
    });

    expect(screen.getByText("Choose one")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));

    expect(resolveElicitation).toHaveBeenCalledWith({
      action: "accept",
      content: { approval: true },
    });
  });

  it("keeps elicitation wrapper mounted with data-hidden when keepMounted is true", () => {
    renderWithContext(
      <MessageInputElicitation
        keepMounted
        data-testid="elicitation-hidden-wrapper"
      />,
    );
    const wrapper = screen.getByTestId("elicitation-hidden-wrapper");
    expect(wrapper.getAttribute("data-hidden")).toBe("true");
  });
});
