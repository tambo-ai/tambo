/**
 * Component Rendering Utility for v1 API
 *
 * Looks up components from the registry and creates React elements
 * for component content blocks in v1 messages.
 */

import { parse } from "partial-json";
import React, { type ReactElement } from "react";
import type { ComponentRegistry } from "../../model/component-metadata";
import { isStandardSchema } from "../../schema";
import { isPromise } from "../../util/is-promise";
import { getComponentFromRegistry } from "../../util/registry";
import type {
  Content,
  TamboV1Message,
  V1ComponentContent,
} from "../types/message";

/**
 * Render a component content block by looking up the component from the registry
 * and creating a React element with the props.
 * @param content - The component content block
 * @param registry - The component registry
 * @returns The rendered React element, or null if the component is not found
 */
function renderComponentContent(
  content: V1ComponentContent,
  registry: ComponentRegistry,
): ReactElement | null {
  try {
    const registeredComponent = getComponentFromRegistry(
      content.name,
      registry,
    );

    // Parse props (handles partial JSON during streaming)
    const parsedProps = parse(JSON.stringify(content.props ?? {}));

    let validatedProps: Record<string, unknown> = parsedProps as Record<
      string,
      unknown
    >;

    // Validate props if schema is present
    if (isStandardSchema(registeredComponent.props)) {
      const result =
        registeredComponent.props["~standard"].validate(parsedProps);

      if (isPromise(result)) {
        // Async validation not supported - skip validation
        console.warn(
          `Async schema validation not supported for component ${content.name}`,
        );
      } else if ("value" in result) {
        validatedProps = result.value as Record<string, unknown>;
      } else {
        // Validation failed - log warning but still render with raw props
        console.warn(
          `Props validation failed for component ${content.name}:`,
          result.issues?.[0]?.message,
        );
      }
    }

    return React.createElement(registeredComponent.component, validatedProps);
  } catch {
    // Component not found in registry
    return null;
  }
}

/**
 * Transform a v1 message to add renderedComponent to component content blocks.
 * @param message - The v1 message to transform
 * @param registry - The component registry
 * @returns The message with renderedComponent populated on component content blocks
 */
export function renderComponentsInMessage(
  message: TamboV1Message,
  registry: ComponentRegistry,
): TamboV1Message {
  const transformedContent = message.content.map((content): Content => {
    if (content.type !== "component") {
      return content;
    }

    const componentContent = content;
    const renderedComponent = renderComponentContent(
      componentContent,
      registry,
    );

    return {
      ...componentContent,
      renderedComponent,
    };
  });

  return {
    ...message,
    content: transformedContent,
  };
}

/**
 * Transform an array of v1 messages to add renderedComponent to component content blocks.
 * @param messages - The v1 messages to transform
 * @param registry - The component registry
 * @returns The messages with renderedComponent populated on component content blocks
 */
export function renderComponentsInMessages(
  messages: TamboV1Message[],
  registry: ComponentRegistry,
): TamboV1Message[] {
  return messages.map((message) =>
    renderComponentsInMessage(message, registry),
  );
}
