// react-sdk/src/providers/with-interactable.tsx
"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTamboInteractable } from "./tambo-interactable-provider";

export interface InteractableConfig {
  componentName: string;
  messageId: string;
  threadId: string;
  isInteractable?: boolean;
  metadata?: Record<string, any>;
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
    const { addInteractableComponent, updateInteractableComponentProps } =
      useTamboInteractable();

    const [interactableId, setInteractableId] = useState<string | null>(null);
    const isInitialized = useRef(false);

    // Extract interactable-specific props
    const { onInteractableReady, onPropsUpdate, ...componentProps } =
      props as P & WithInteractableProps;

    // Memoize the component props to prevent unnecessary re-renders
    const memoizedComponentProps = useMemo(
      () => componentProps,
      [componentProps],
    );

    // Memoize the registration function
    const registerComponent = useCallback(() => {
      if (!isInitialized.current) {
        const id = addInteractableComponent({
          componentName: config.componentName,
          props: memoizedComponentProps,
          messageId: config.messageId,
          threadId: config.threadId,
          isInteractable: config.isInteractable ?? true,
          metadata: config.metadata,
        });

        setInteractableId(id);
        onInteractableReady?.(id);
        isInitialized.current = true;
      }
    }, [addInteractableComponent, memoizedComponentProps, onInteractableReady]);

    // Register the component as interactable on mount (only once)
    useEffect(() => {
      registerComponent();
    }, [registerComponent]);

    // Update the interactable component when props change
    useEffect(() => {
      if (interactableId && isInitialized.current) {
        updateInteractableComponentProps(
          interactableId,
          memoizedComponentProps,
        );
        onPropsUpdate?.(memoizedComponentProps);
      }
    }, [
      interactableId,
      memoizedComponentProps,
      updateInteractableComponentProps,
      onPropsUpdate,
    ]);

    return <WrappedComponent {...(memoizedComponentProps as P)} />;
  };

  InteractableWrapper.displayName = `withInteractable(${displayName})`;

  return InteractableWrapper;
}
