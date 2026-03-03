import { describe, expect, it, jest } from "@jest/globals";
import type { TamboElicitationRequest } from "@tambo-ai/react/mcp";
import { fireEvent, render, screen } from "@testing-library/react";
import { Elicitation, useElicitationField } from "./index";

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
  const CustomStringInput = () => {
    const { field, inputId, label } = useElicitationField();
    if (
      field.schema.type !== "string" ||
      ("enum" in field.schema && field.schema.enum)
    ) {
      return null;
    }

    const value = typeof field.value === "string" ? field.value : "";

    return (
      <input
        id={inputId}
        aria-label={label}
        value={value}
        onChange={(event) => field.setValue(event.currentTarget.value)}
      />
    );
  };

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

  it("replaces default actions when custom action children are provided", () => {
    const request = createRequest();

    render(
      <Elicitation.Root request={request} onResponse={jest.fn()}>
        <Elicitation.Actions>
          <button type="button">Custom action</button>
        </Elicitation.Actions>
      </Elicitation.Root>,
    );

    expect(
      screen.getByRole("button", { name: "Custom action" }),
    ).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Decline" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Submit" })).toBeNull();
  });

  it("supports composed field primitives with type-gated inputs", () => {
    const request = createRequest();

    render(
      <Elicitation.Root request={request} onResponse={jest.fn()}>
        <Elicitation.Fields
          render={(_props, { fields }) => (
            <>
              {fields.map((field) => (
                <Elicitation.Field key={field.name} field={field}>
                  <Elicitation.FieldLabel />
                  <Elicitation.FieldInput>
                    <Elicitation.FieldStringInput
                      data-testid={`string-${field.name}`}
                    />
                    <Elicitation.FieldNumberInput
                      data-testid={`number-${field.name}`}
                    />
                  </Elicitation.FieldInput>
                  <Elicitation.FieldError />
                </Elicitation.Field>
              ))}
            </>
          )}
        />
      </Elicitation.Root>,
    );

    expect(screen.getByTestId("string-answer")).not.toBeNull();
    expect(screen.queryByTestId("number-answer")).toBeNull();
  });

  it("supports fully custom field input via useElicitationField", () => {
    const onResponse = jest.fn();
    const request = createRequest();

    render(
      <Elicitation.Root request={request} onResponse={onResponse}>
        <Elicitation.Fields
          render={(_props, { fields }) => (
            <>
              {fields.map((field) => (
                <Elicitation.Field key={field.name} field={field}>
                  <Elicitation.FieldLabel />
                  <CustomStringInput />
                  <Elicitation.FieldError />
                </Elicitation.Field>
              ))}
            </>
          )}
        />
        <Elicitation.Actions />
      </Elicitation.Root>,
    );

    fireEvent.change(screen.getByLabelText("Your answer"), {
      target: { value: "Ship it" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    expect(onResponse).toHaveBeenCalledWith({
      action: "accept",
      content: { answer: "Ship it" },
    });
  });
});
