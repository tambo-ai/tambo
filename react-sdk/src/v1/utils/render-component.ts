/**
 * Component Rendering Utility for v1 API
 *
 * Looks up components from the registry and creates React elements
 * for component content blocks in v1 messages. Uses caching to avoid
 * recreating React elements when props haven't changed.
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
 * Cache entry for a rendered component.
 * Stores the rendered element and the props used to create it.
 */
interface CacheEntry {
  element: ReactElement | null;
  propsJson: string;
}

/**
 * Cache for rendered components, keyed by component ID.
 * Used to avoid recreating React elements when props haven't changed.
 */
export type ComponentRenderCache = Map<string, CacheEntry>;

/**
 * Create a new empty component render cache.
 * @returns A new empty cache
 */
export function createComponentRenderCache(): ComponentRenderCache {
  return new Map();
}

/**
 * Render a component content block by looking up the component from the registry
 * and creating a React element with the props. Uses cache to avoid recreating
 * elements when props haven't changed.
 * @param content - The component content block
 * @param registry - The component registry
 * @param cache - The render cache
 * @returns The rendered React element, or null if the component is not found
 */
function renderComponentContent(
  content: V1ComponentContent,
  registry: ComponentRegistry,
  cache: ComponentRenderCache,
): ReactElement | null {
  const propsJson = JSON.stringify(content.props ?? {});

  // Check cache first
  const cached = cache.get(content.id);
  if (cached?.propsJson === propsJson) {
    return cached.element;
  }

  try {
    const registeredComponent = getComponentFromRegistry(
      content.name,
      registry,
    );

    // Parse props (handles partial JSON during streaming)
    const parsedProps = parse(propsJson);

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

    const element = React.createElement(
      registeredComponent.component,
      validatedProps,
    );

    // Update cache
    cache.set(content.id, { element, propsJson });

    return element;
  } catch {
    // Component not found in registry - cache null result
    cache.set(content.id, { element: null, propsJson });
    return null;
  }
}

/**
 * Transform a v1 message to add renderedComponent to component content blocks.
 * @param message - The v1 message to transform
 * @param registry - The component registry
 * @param cache - The render cache
 * @returns The message with renderedComponent populated on component content blocks
 */
export function renderComponentsInMessage(
  message: TamboV1Message,
  registry: ComponentRegistry,
  cache: ComponentRenderCache,
): TamboV1Message {
  const transformedContent = message.content.map((content): Content => {
    if (content.type !== "component") {
      return content;
    }

    const componentContent = content;
    const renderedComponent = renderComponentContent(
      componentContent,
      registry,
      cache,
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
 * Uses caching to avoid recreating React elements when props haven't changed.
 * @param messages - The v1 messages to transform
 * @param registry - The component registry
 * @param cache - The render cache (should be persisted across renders, e.g., in a ref)
 * @returns The messages with renderedComponent populated on component content blocks
 */
export function renderComponentsInMessages(
  messages: TamboV1Message[],
  registry: ComponentRegistry,
  cache: ComponentRenderCache,
): TamboV1Message[] {
  return messages.map((message) =>
    renderComponentsInMessage(message, registry, cache),
  );
}
