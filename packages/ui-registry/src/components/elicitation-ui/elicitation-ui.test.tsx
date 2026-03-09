/// <reference types="@testing-library/jest-dom" />

import { describe, expect, it, jest } from "@jest/globals";
import type { TamboElicitationRequest } from "@tambo-ai/react/mcp";
import { fireEvent, render, screen } from "@testing-library/react";
import { ElicitationUI } from "./elicitation-ui";

const createRequest = (
  overrides?: Partial<TamboElicitationRequest>,
): TamboElicitationRequest => {
  return {
    message: "Please provide details",
    requestedSchema: {
      type: "object",
      properties: {
        answer: {
          type: "string",
          description: "Your answer",
        },
      },
      required: ["answer"],
    },
    ...overrides,
  };
};

describe("ElicitationUI", () => {
  it("auto-submits single-entry boolean requests", () => {
    const onResponse = jest.fn();
    const request = createRequest({
      requestedSchema: {
        type: "object",
        properties: {
          confirm: {
            type: "boolean",
            description: "Confirm action",
          },
        },
        required: ["confirm"],
      },
    });

    render(<ElicitationUI request={request} onResponse={onResponse} />);

    expect(screen.queryByRole("button", { name: "Submit" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Yes" }));

    expect(onResponse).toHaveBeenCalledWith({
      action: "accept",
      content: { confirm: true },
    });
  });

  it("uses base validation and submit handling for multi-entry requests", () => {
    const onResponse = jest.fn();
    const request = createRequest();

    render(<ElicitationUI request={request} onResponse={onResponse} />);

    const submitButton = screen.getByRole("button", {
      name: "Submit",
    }) as HTMLButtonElement;

    expect(submitButton).toBeDisabled();

    fireEvent.click(submitButton);
    expect(onResponse).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/your answer/i), {
      target: { value: "Ship it" },
    });

    expect(submitButton).not.toBeDisabled();

    fireEvent.click(submitButton);

    expect(onResponse).toHaveBeenCalledWith({
      action: "accept",
      content: { answer: "Ship it" },
    });
  });

  it("passes through decline and cancel actions", () => {
    const onResponse = jest.fn();

    render(<ElicitationUI request={createRequest()} onResponse={onResponse} />);

    fireEvent.click(screen.getByRole("button", { name: "Decline" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onResponse).toHaveBeenNthCalledWith(1, { action: "decline" });
    expect(onResponse).toHaveBeenNthCalledWith(2, { action: "cancel" });
  });
});
