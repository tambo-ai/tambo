"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { TamboMessageProvider } from "../hooks/use-current-message";
import { TamboThreadMessage } from "../model/generate-component-response";
import { useTamboInteractable } from "../providers/tambo-interactable-provider";
import { SupportedSchema } from "../schema";

export interface InteractableConfig {
  componentName: string;
  description: string;
  propsSchema?: SupportedSchema;
}

export interface WithTamboInteractableProps {
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
 * const MyInteractableNote = withTamboInteractable(MyNote, {
 *   componentName: "MyNote",
 *   description: "A note component",
 *   propsSchema: z.object({
 *     title: z.string(),
 *     content: z.string(),
 *   }),
 * });
 *
 * // Usage
 * <MyInteractableNote title="My Note" content="This is my note" />
 * ```
 */
export function withTamboInteractable<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  config: InteractableConfig,
) {
  const displayName =
    WrappedComponent.displayName ?? WrappedComponent.name ?? "Component";

  const TamboInteractableWrapper: React.FC<P & WithTamboInteractableProps> = (
    props,
  ) => {
    const {
      addInteractableComponent,
      updateInteractableComponentProps,
      getInteractableComponent,
    } = useTamboInteractable();

    const [interactableId, setInteractableId] = useState<string | null>(null);
    const isInitialized = useRef(false);
    const lastParentProps = useRef<Record<string, any>>({});

    // Extract interactable-specific props
    const { onInteractableReady, onPropsUpdate, ...componentProps } = props;

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

    // If the interactable ID is not yet set, render the component without provider
    if (!interactableId) {
      return <WrappedComponent {...(effectiveProps as P)} />;
    }

    // Create a minimal message with interactable metadata
    // This allows useTamboCurrentComponent to work with standalone interactable components
    const minimalMessage: TamboThreadMessage = {
      id: interactableId,
      role: "assistant" as const,
      content: [],
      threadId: "",
      createdAt: new Date().toISOString(),
      component: {
        componentName: config.componentName,
        componentState: {},
        message: "",
        props: effectiveProps,
      },
      componentState: {},
    };

    // Wrap with TamboMessageProvider including interactable metadata
    return (
      <TamboMessageProvider
        message={minimalMessage}
        interactableMetadata={{
          id: interactableId,
          componentName: config.componentName,
          description: config.description,
        }}
      >
        <WrappedComponent {...(effectiveProps as P)} />
      </TamboMessageProvider>
    );
  };

  TamboInteractableWrapper.displayName = `withTamboInteractable(${displayName})`;

  return TamboInteractableWrapper;
}
