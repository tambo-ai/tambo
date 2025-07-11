// react-sdk/src/providers/with-interactable.tsx
"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useTamboInteractable } from "../tambo-interactable-provider";

export interface InteractableConfig {
  componentName: string;
  description: string;
  messageId: string;
  threadId: string;
  isInteractable?: boolean;
  metadata?: Record<string, any>;
  propsSchema?: z.ZodTypeAny;
}

export interface WithInteractableProps {
  interactableId?: string;
  onInteractableReady?: (id: string) => void;
  onPropsUpdate?: (newProps: Record<string, any>) => void;
}

/**
 * Higher-Order Component that makes any component interactable by tambo.
 * @param WrappedComponent - The component to make interactable
 * @param config - Configuration for the interactable component
 * @returns A new component that is automatically registered as interactable
 * @example
 * ```tsx
 * const MyInteractableButton = withInteractable(MyButton, {
 *   componentName: "MyButton",
 *   messageId: "msg-123",
 *   threadId: "thread-456",
 *   metadata: { category: "action" }
 * });
 *
 * // Usage
 * <MyInteractableButton text="Click me!" />
 * ```
 */
export function withInteractable<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  config: InteractableConfig,
) {
  const displayName =
    WrappedComponent.displayName ?? WrappedComponent.name ?? "Component";

  const InteractableWrapper: React.FC<P & WithInteractableProps> = (props) => {
    const {
      addInteractableComponent,
      updateInteractableComponentProps,
      getInteractableComponent,
    } = useTamboInteractable();

    const [interactableId, setInteractableId] = useState<string | null>(null);
    const isInitialized = useRef(false);
    const lastParentProps = useRef<Record<string, any>>({});

    // Extract interactable-specific props
    const { onInteractableReady, onPropsUpdate, ...componentProps } =
      props as P & WithInteractableProps;

    // Get the current interactable component to track prop updates
    const currentInteractable = interactableId
      ? getInteractableComponent(interactableId)
      : null;

    // Use the props from the interactable component if available, otherwise use the passed props
    // We need to be careful not to create a loop, so we only use stored props if they're different from passed props
    const effectiveProps = currentInteractable?.props ?? componentProps;

    // Memoize the registration function
    const registerComponent = useCallback(() => {
      if (!isInitialized.current) {
        const id = addInteractableComponent({
          name: config.componentName,
          description: config.description,
          component: WrappedComponent,
          props: componentProps,
          propsSchema: config.propsSchema,
        });

        setInteractableId(id);
        onInteractableReady?.(id);
        isInitialized.current = true;
      }
    }, [addInteractableComponent, componentProps, onInteractableReady]);

    // Register the component as interactable on mount (only once)
    useEffect(() => {
      registerComponent();
    }, [registerComponent]);

    // Update the interactable component when props change from parent
    useEffect(() => {
      if (interactableId && isInitialized.current) {
        // Only update if the props are different from what we last sent
        const lastPropsString = JSON.stringify(lastParentProps.current);
        const currentPropsString = JSON.stringify(componentProps);

        if (lastPropsString !== currentPropsString) {
          updateInteractableComponentProps(interactableId, componentProps);
          onPropsUpdate?.(componentProps);
          lastParentProps.current = componentProps;
        }
      }
    }, [
      interactableId,
      componentProps,
      updateInteractableComponentProps,
      onPropsUpdate,
    ]);

    return <WrappedComponent {...(effectiveProps as P)} />;
  };

  InteractableWrapper.displayName = `withInteractable(${displayName})`;

  return InteractableWrapper;
}
