"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { TamboMessageProvider } from "../hooks/use-current-message";
import { TamboThreadMessage } from "../model/generate-component-response";
import { useTamboInteractable } from "../providers/tambo-interactable-provider";
import { SupportedSchema } from "../schema";

export interface InteractableConfig<
  Props = Record<string, unknown>,
  State = Record<string, unknown>,
> {
  /**
   * The name of the component, used for identification in Tambo.
   */
  componentName: string;
  /**
   * A brief description of the component's purpose and functionality. LLM will
   * use this to understand how to interact with it.
   */
  description: string;
  /**
   * Optional schema for component props. If provided, prop updates will be
   * validated against this schema.
   */
  propsSchema?: SupportedSchema<Props>;
  /**
   * Optional schema for component state. If provided, state updates will be
   * validated against this schema.
   */
  stateSchema?: SupportedSchema<State>;
}

/**
 * Props injected by withTamboInteractable HOC. These can be passed to the wrapped
 * component to customize interactable behavior.
 */
export interface WithTamboInteractableProps {
  /**
   * Optional ID to use for this interactable component instance.
   * If not provided, a unique ID will be generated automatically.
   */
  interactableId?: string;
  /**
   * Callback fired when the component has been registered as interactable.
   * @param id - The assigned interactable component ID
   */
  onInteractableReady?: (id: string) => void;
  /**
   * Callback fired when the component's serializable props are updated by Tambo
   * through a tool call. Note: Only serializable props are tracked.
   * @param newProps - The updated serializable props
   */
  onPropsUpdate?: (newProps: Record<string, unknown>) => void;
}

/**
 * Higher-Order Component that makes any component interactable by tambo.
 * @param WrappedComponent - The component to make interactable
 * @param config - Configuration for the interactable component
 * @returns A new component that is automatically registered as interactable
 * @example
 * ```tsx
 * const MyNote: React.FC<{ title: string; content: string }> = ({ title, content }) => {
 *   const [isPinned, setIsPinned] = useTamboComponentState("isPinned", false);
 *   return (
 *     <div style={{ border: isPinned ? "2px solid gold" : "1px solid gray", order: isPinned ? -1 : 0 }}>
 *       <h2>{title}</h2>
 *       <p>{content}</p>
 *     </div>
 *   );
 * };
 *
 * const MyInteractableNote = withTamboInteractable(MyNote, {
 *   componentName: "MyNote",
 *   description: "A note component",
 *   propsSchema: z.object({
 *     title: z.string(),
 *     content: z.string(),
 *   }),
 *  stateSchema: z.object({
 *    isPinned: z.boolean(),
 *  }),
 * });
 *
 * // Usage
 * <MyInteractableNote title="My Note" content="This is my note" />
 * ```
 */
export function withTamboInteractable<ComponentProps extends object>(
  WrappedComponent: React.ComponentType<ComponentProps>,
  config: InteractableConfig,
) {
  const displayName =
    WrappedComponent.displayName ?? WrappedComponent.name ?? "Component";

  const TamboInteractableWrapper: React.FC<
    ComponentProps & WithTamboInteractableProps
  > = (props) => {
    const {
      addInteractableComponent,
      updateInteractableComponentProps,
      getInteractableComponent,
    } = useTamboInteractable();

    const [interactableId, setInteractableId] = useState<string | null>(null);
    const isInitialized = useRef(false);
    const lastSerializedProps = useRef<Record<string, unknown>>({});

    // Extract interactable-specific props from component props
    const {
      interactableId: _providedId, // Reserved for future use
      onInteractableReady,
      onPropsUpdate,
      ...componentProps
    } = props;

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
          stateSchema: config.stateSchema,
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
        const lastPropsString = JSON.stringify(lastSerializedProps.current);
        const currentPropsString = JSON.stringify(componentProps);

        if (lastPropsString !== currentPropsString) {
          updateInteractableComponentProps(interactableId, componentProps);
          onPropsUpdate?.(componentProps);
          lastSerializedProps.current = componentProps;
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
      return <WrappedComponent {...(effectiveProps as ComponentProps)} />;
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
        <WrappedComponent {...(effectiveProps as ComponentProps)} />
      </TamboMessageProvider>
    );
  };

  TamboInteractableWrapper.displayName = `withTamboInteractable(${displayName})`;

  return TamboInteractableWrapper;
}
