import TamboAI from "@tambo-ai/typescript-sdk";
import { parse } from "partial-json";
import React from "react";
import { wrapWithTamboMessageProvider } from "../hooks/use-current-message";
import { ComponentRegistry } from "../model/component-metadata";
import { TamboThreadMessage } from "../model/generate-component-response";
import { isStandardSchema } from "../schema";
import { isPromise } from "../util/is-promise";
import { getComponentFromRegistry } from "../util/registry";

/**
 * Generate a message that has a component rendered into it, if the message
 * came with one.
 * @param message - The message that may contain a component
 * @param componentList - the list of available components
 * @returns The updated message with the component rendered into it
 */
export function renderComponentIntoMessage(
  message: TamboAI.Beta.Threads.ThreadMessage,
  componentList: ComponentRegistry,
): TamboThreadMessage {
  if (!message.component?.componentName) {
    throw new Error("Component not found");
  }
  const parsedProps = parse(JSON.stringify(message.component.props));
  const registeredComponent = getComponentFromRegistry(
    message.component.componentName,
    componentList,
  );

  let validatedProps: Record<string, unknown> = parsedProps as Record<
    string,
    unknown
  >;
  if (isStandardSchema(registeredComponent.props)) {
    const result = registeredComponent.props["~standard"].validate(parsedProps);
    // Standard Schema validate() returns { value: T } on success or { issues: [...] } on failure
    // Async validation is not supported for component rendering
    if (isPromise(result)) {
      throw new Error(
        "Async schema validation is not supported for component props",
      );
    }
    if ("value" in result) {
      validatedProps = result.value as Record<string, unknown>;
    } else {
      // Validation failed - throw with first issue message
      const issueMessage =
        result.issues?.[0]?.message ?? "Schema validation failed";
      throw new Error(`Component props validation failed: ${issueMessage}`);
    }
  }

  const renderedComponent = React.createElement(
    registeredComponent.component,
    validatedProps,
  );

  // Create the full message object first so we can pass it to the provider
  const fullMessage: TamboThreadMessage = {
    ...message,
    component: {
      ...message.component,
      props: validatedProps,
    },
  };

  const wrappedComponent = wrapWithTamboMessageProvider(
    renderedComponent,
    fullMessage,
  );

  return {
    ...fullMessage,
    renderedComponent: wrappedComponent,
  };
}
