import TamboAI from "@tambo-ai/typescript-sdk";
import { parse } from "partial-json";
import React from "react";
import { z } from "zod";
import { wrapWithTamboMessageProvider } from "../hooks/use-current-message";
import { ComponentRegistry } from "../model/component-metadata";
import { TamboThreadMessage } from "../model/generate-component-response";
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

  const validatedProps =
    registeredComponent.props instanceof z.ZodType
      ? registeredComponent.props.parse(parsedProps)
      : parsedProps;

  const renderedComponent = React.createElement(
    registeredComponent.component,
    validatedProps,
  );
  const wrappedComponent = wrapWithTamboMessageProvider(
    renderedComponent,
    message.threadId,
    message.id,
  );

  return {
    ...message,
    component: {
      ...message.component,
      props: validatedProps,
    },
    renderedComponent: wrappedComponent,
  };
}
