"use client";

/**
 * Component Renderer
 *
 * A wrapper component that renders a component from the registry based on
 * component content block data. Uses React's normal reconciliation to maintain
 * component identity - as long as the key stays stable, the component instance
 * is preserved.
 *
 * Wraps the component with ComponentContentProvider so that hooks like
 * useTamboComponentState can access component context.
 *
 * When autoInteractables is enabled in TamboConfig, automatically registers
 * rendered components as interactables so the AI can update them.
 */

import { parse } from "partial-json";
import React, { type FC, useMemo, useContext, useEffect, useRef } from "react";
import { TamboRegistryContext } from "../../providers/tambo-registry-provider";
import { useTamboInteractable } from "../../providers/tambo-interactable-provider";
import { isStandardSchema } from "../../schema";
import { isPromise } from "../../util/is-promise";
import { getComponentFromRegistry } from "../../util/registry";
import type { TamboComponentContent } from "../types/message";
import { ComponentContentProvider } from "../utils/component-renderer";
import { useTamboConfig } from "../providers/tambo-v1-provider";

export interface ComponentRendererProps {
  /**
   * The component content block from a message
   */
  content: TamboComponentContent;

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
 * Internal wrapper that auto-registers a rendered component as an interactable
 * when autoInteractables is enabled in TamboConfig.
 */
function AutoInteractableWrapper({
  children,
  componentName,
  componentId,
  props,
  propsSchema,
}: {
  children: React.ReactNode;
  componentName: string;
  componentId: string;
  props: Record<string, unknown>;
  propsSchema?: unknown;
}) {
  const config = useTamboConfig();
  const { addInteractableComponent, removeInteractableComponent } =
    useTamboInteractable();
  const registeredIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!config.autoInteractables) return;

    // Only register once per component instance
    if (registeredIdRef.current) return;

    try {
      const id = addInteractableComponent({
        name: componentName,
        component: () => null, // Placeholder — the real component is rendered by ComponentRenderer
        props,
        propsSchema: propsSchema as never,
      });
      registeredIdRef.current = id;
    } catch {
      // Silently ignore registration failures (e.g., invalid component name)
    }

    return () => {
      if (registeredIdRef.current) {
        removeInteractableComponent(registeredIdRef.current);
        registeredIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.autoInteractables, componentId]);

  return <>{children}</>;
}

/**
 * Renders a component from the registry based on component content block data.
 *
 * Use this component in your message renderer to display AI-generated components.
 * The component instance is preserved across re-renders as long as React's
 * reconciliation keeps this wrapper mounted (use content.id as key).
 *
 * Wraps the rendered component with ComponentContentProvider so that hooks
 * like useTamboComponentState can access component context.
 * @returns The rendered component wrapped in ComponentContentProvider, or fallback if not found
 * @example
 * ```tsx
 * function MessageContent({ content }: { content: Content }) {
 *   if (content.type === 'component') {
 *     return (
 *       <ComponentRenderer
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
export const ComponentRenderer: FC<ComponentRendererProps> = ({
  content,
  threadId,
  messageId,
  fallback = null,
}) => {
  const registry = useContext(TamboRegistryContext);

  // Memoize the rendered element - only recreates when props change
  const renderData = useMemo(() => {
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

      return {
        element: React.createElement(
          registeredComponent.component,
          validatedProps,
        ),
        propsSchema: registeredComponent.props,
        validatedProps,
      };
    } catch (error) {
      console.error("[ComponentRenderer] Failed to render component", {
        threadId,
        messageId,
        componentId: content.id,
        componentName: content.name,
        streamingState: content.streamingState,
        props: content.props,
        error,
      });
      return null;
    }
  }, [
    content.id,
    content.name,
    content.props,
    content.streamingState,
    messageId,
    threadId,
    registry.componentList,
  ]);

  if (renderData === null) {
    return <>{fallback}</>;
  }

  // Wrap with provider so hooks like useTamboComponentState work
  return (
    <ComponentContentProvider
      componentId={content.id}
      threadId={threadId}
      messageId={messageId}
      componentName={content.name}
    >
      <AutoInteractableWrapper
        componentName={content.name}
        componentId={content.id}
        props={renderData.validatedProps}
        propsSchema={renderData.propsSchema}
      >
        {renderData.element}
      </AutoInteractableWrapper>
    </ComponentContentProvider>
  );
};
