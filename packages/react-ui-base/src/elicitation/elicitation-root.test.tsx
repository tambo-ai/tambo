import { describe, expect, it, jest } from "@jest/globals";
import type { TamboElicitationRequest } from "@tambo-ai/react/mcp";
import { fireEvent, render, screen } from "@testing-library/react";
import { Elicitation } from "./index";

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

describe("Elicitation.Root", () => {
  it("renders message and fields", () => {
    const request = createRequest();

    render(
      <Elicitation.Root request={request} onResponse={jest.fn()}>
        <Elicitation.Message />
        <Elicitation.Fields />
      </Elicitation.Root>,
    );

    expect(screen.getByText("Please provide details")).not.toBeNull();
    expect(screen.getByLabelText("Your answer*")).not.toBeNull();
  });

  it("submits immediately for single-entry boolean schema", () => {
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

    render(
      <Elicitation.Root request={request} onResponse={onResponse}>
        <Elicitation.Fields />
      </Elicitation.Root>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Yes" }));

    expect(onResponse).toHaveBeenCalledWith({
      action: "accept",
      content: { confirm: true },
    });
  });

  it("submits from actions for multi-field schemas", () => {
    const onResponse = jest.fn();
    const request = createRequest();

    render(
      <Elicitation.Root request={request} onResponse={onResponse}>
        <Elicitation.Fields />
        <Elicitation.Actions />
      </Elicitation.Root>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(onResponse).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Your answer*"), {
      target: { value: "Ship it" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    expect(onResponse).toHaveBeenCalledWith({
      action: "accept",
      content: { answer: "Ship it" },
    });
  });

  it("supports decline and cancel actions", () => {
    const onResponse = jest.fn();
    const request = createRequest();

    render(
      <Elicitation.Root request={request} onResponse={onResponse}>
        <Elicitation.Actions />
      </Elicitation.Root>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Decline" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onResponse).toHaveBeenNthCalledWith(1, { action: "decline" });
    expect(onResponse).toHaveBeenNthCalledWith(2, { action: "cancel" });
  });
});
