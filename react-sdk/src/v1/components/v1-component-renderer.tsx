"use client";

/**
 * V1 Component Renderer
 *
 * A wrapper component that renders a component from the registry based on
 * component content block data. Uses React's normal reconciliation to maintain
 * component identity - as long as the key stays stable, the component instance
 * is preserved.
 *
 * Wraps the component with V1ComponentContentProvider so that hooks like
 * useTamboV1ComponentState can access component context.
 */

import { parse } from "partial-json";
import React, { type FC, useMemo, useContext } from "react";
import { TamboRegistryContext } from "../../providers/tambo-registry-provider";
import { isStandardSchema } from "../../schema";
import { isPromise } from "../../util/is-promise";
import { getComponentFromRegistry } from "../../util/registry";
import type { V1ComponentContent } from "../types/message";
import { V1ComponentContentProvider } from "../utils/component-renderer";

export interface V1ComponentRendererProps {
  /**
   * The component content block from a v1 message
   */
  content: V1ComponentContent;

  /**
   * The thread ID the component belongs to
   */
  threadId: string;

  /**
   * The message ID the component belongs to
   */
  messageId: string;

  /**
   * Optional fallback to render if component is not found in registry
   */
  fallback?: React.ReactNode;
}

/**
 * Renders a component from the registry based on component content block data.
 *
 * Use this component in your message renderer to display AI-generated components.
 * The component instance is preserved across re-renders as long as React's
 * reconciliation keeps this wrapper mounted (use content.id as key).
 *
 * Wraps the rendered component with V1ComponentContentProvider so that hooks
 * like useTamboV1ComponentState can access component context.
 * @returns The rendered component wrapped in V1ComponentContentProvider, or fallback if not found
 * @example
 * ```tsx
 * function MessageContent({ content }: { content: Content }) {
 *   if (content.type === 'component') {
 *     return (
 *       <V1ComponentRenderer
 *         key={content.id}
 *         content={content}
 *         fallback={<div>Unknown component: {content.name}</div>}
 *       />
 *     );
 *   }
 *   // ... handle other content types
 * }
 * ```
 */
export const V1ComponentRenderer: FC<V1ComponentRendererProps> = ({
  content,
  threadId,
  messageId,
  fallback = null,
}) => {
  const registry = useContext(TamboRegistryContext);

  // Memoize the rendered element - only recreates when props change
  const element = useMemo(() => {
    try {
      const registeredComponent = getComponentFromRegistry(
        content.name,
        registry.componentList,
      );

      // Parse props (handles partial JSON during streaming)
      const propsJson = JSON.stringify(content.props ?? {});
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

      return React.createElement(registeredComponent.component, validatedProps);
    } catch {
      // Component not found in registry
      return null;
    }
  }, [content.name, content.props, registry.componentList]);

  if (element === null) {
    return <>{fallback}</>;
  }

  // Wrap with provider so hooks like useTamboV1ComponentState work
  return (
    <V1ComponentContentProvider
      componentId={content.id}
      threadId={threadId}
      messageId={messageId}
      componentName={content.name}
    >
      {element}
    </V1ComponentContentProvider>
  );
};
