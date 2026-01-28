"use client";

/**
 * Component Renderer Utility for v1 API
 *
 * Provides utilities for rendering React components from component content blocks.
 * Components are looked up in the registry and wrapped with context providers.
 */

import React, {
  createContext,
  createElement,
  Suspense,
  useContext,
  useMemo,
  type ReactElement,
} from "react";

/**
 * Props that should be filtered out when rendering components.
 * These could be used for event handler injection or other security concerns.
 */
const DANGEROUS_PROP_PATTERNS = [
  /^on[A-Z]/, // Event handlers (onClick, onError, etc.)
  /^dangerouslySetInnerHTML$/,
];

const DANGEROUS_PROP_NAMES = new Set(["ref", "key", "children"]);

/**
 * Sanitize props by removing potentially dangerous properties.
 * Filters out event handlers, refs, and other props that could be abused.
 * @param props - Raw props from the component content
 * @returns Sanitized props safe for spreading to components
 */
function sanitizeProps(
  props: Record<string, unknown>,
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(props)) {
    // Skip dangerous prop names
    if (DANGEROUS_PROP_NAMES.has(key)) {
      continue;
    }

    // Skip props matching dangerous patterns
    if (DANGEROUS_PROP_PATTERNS.some((pattern) => pattern.test(key))) {
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}
import type { ComponentRegistry } from "../../model/component-metadata";
import type {
  Content,
  TamboV1Message,
  V1ComponentContent,
} from "../types/message";

/**
 * Context for component content blocks.
 * Provides access to the component ID and thread ID for component state hooks.
 */
export interface V1ComponentContentContext {
  /** Component instance ID */
  componentId: string;
  /** Thread ID the component belongs to */
  threadId: string;
  /** Message ID the component belongs to */
  messageId: string;
  /** Component name */
  componentName: string;
}

const ComponentContentContext = createContext<V1ComponentContentContext | null>(
  null,
);

/**
 * Provider for component content context.
 * Wraps rendered components to provide access to component metadata.
 * @returns Provider component with memoized context value
 */
function V1ComponentContentProvider({
  children,
  componentId,
  threadId,
  messageId,
  componentName,
}: V1ComponentContentContext & { children: React.ReactNode }) {
  // Memoize context value to prevent unnecessary re-renders of consumers
  const value = useMemo(
    () => ({ componentId, threadId, messageId, componentName }),
    [componentId, threadId, messageId, componentName],
  );

  return (
    <ComponentContentContext.Provider value={value}>
      {children}
    </ComponentContentContext.Provider>
  );
}

/**
 * Hook to access the current component content context.
 * Must be used within a rendered component.
 * @returns Component content context
 * @throws {Error} If used outside a rendered component
 */
export function useV1ComponentContent(): V1ComponentContentContext {
  const context = useContext(ComponentContentContext);
  if (!context) {
    throw new Error(
      "useV1ComponentContent must be used within a rendered component",
    );
  }
  return context;
}

/**
 * Hook to optionally access the current component content context.
 * Returns null if not within a rendered component.
 * @returns Component content context or null
 */
export function useV1ComponentContentOptional(): V1ComponentContentContext | null {
  return useContext(ComponentContentContext);
}

/**
 * Options for rendering a component content block.
 */
export interface RenderComponentOptions {
  /** Thread ID for the component context */
  threadId: string;
  /** Message ID the component belongs to */
  messageId: string;
  /** Component registry to look up components */
  componentList: ComponentRegistry;
}

/**
 * Check if a content block is a component.
 * @param content - Content block to check
 * @returns True if content is a V1ComponentContent
 */
export function isComponentContent(
  content: Content,
): content is V1ComponentContent {
  return content.type === "component";
}

/**
 * Render a component content block into a React element.
 *
 * Looks up the component in the registry, creates a React element with props,
 * and wraps it with the component content context provider.
 * @param content - Component content block to render
 * @param options - Rendering options including registry and context info
 * @returns V1ComponentContent with the renderedComponent attached
 * @example
 * ```tsx
 * const rendered = renderComponentContent(componentContent, {
 *   threadId: 'thread_123',
 *   messageId: 'msg_456',
 *   componentList: registry.componentList,
 * });
 *
 * // Use in JSX:
 * {rendered.renderedComponent}
 * ```
 */
export function renderComponentContent(
  content: V1ComponentContent,
  options: RenderComponentOptions,
): V1ComponentContent {
  const { threadId, messageId, componentList } = options;

  // Look up component in registry
  const registeredComponent = componentList[content.name];

  if (!registeredComponent) {
    console.warn(`Component "${content.name}" not found in registry`);
    return {
      ...content,
      renderedComponent: null,
    };
  }

  const Component = registeredComponent.component;
  const LoadingComponent = registeredComponent.loadingComponent;

  // Determine if we should show loading state
  const isStreaming = content.streamingState !== "done";

  // Sanitize props to prevent injection of event handlers or other dangerous props
  const props = sanitizeProps(content.props as Record<string, unknown>);

  // Create the component element
  let element: ReactElement;

  if (isStreaming && LoadingComponent) {
    // Show loading component during streaming
    element = createElement(LoadingComponent, props);
  } else {
    // Show main component (with Suspense for lazy loading support)
    const mainElement = createElement(Component, {
      ...props,
      // Pass state as initialState prop for components that support it
      initialState: content.state,
    });

    element = LoadingComponent
      ? createElement(
          Suspense,
          { fallback: createElement(LoadingComponent) },
          mainElement,
        )
      : mainElement;
  }

  // Wrap with component content context
  const wrappedElement = (
    <V1ComponentContentProvider
      componentId={content.id}
      threadId={threadId}
      messageId={messageId}
      componentName={content.name}
    >
      {element}
    </V1ComponentContentProvider>
  );

  return {
    ...content,
    renderedComponent: wrappedElement,
  };
}

/**
 * Render all component content blocks in a message.
 *
 * Renders component content blocks and attaches renderedComponent.
 * Non-component content blocks are passed through unchanged.
 * @param content - Array of content blocks
 * @param options - Rendering options including registry and context info
 * @returns Array of content with rendered components
 */
export function renderMessageContent(
  content: Content[],
  options: RenderComponentOptions,
): Content[] {
  return content.map((block) => {
    if (isComponentContent(block)) {
      return renderComponentContent(block, options);
    }
    // Pass through non-component content unchanged
    return block;
  });
}

/**
 * Render all components in a message.
 *
 * Creates a new message object with all component content blocks rendered.
 * @param message - Message to render components for
 * @param options - Rendering options (threadId is extracted from message if not provided)
 * @returns Message with rendered component content
 */
export function renderMessageComponents(
  message: TamboV1Message,
  options: Omit<RenderComponentOptions, "messageId"> & { threadId: string },
): TamboV1Message {
  const renderedContent = renderMessageContent(message.content, {
    ...options,
    messageId: message.id,
  });

  return {
    ...message,
    content: renderedContent,
  };
}
