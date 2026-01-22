/**
 * Component Types for v1 API
 *
 * Defines how React components are registered and made available to the AI.
 *
 * TODO: Once @tambo-ai/typescript-sdk/v1 is released, import AvailableComponent
 * from the SDK package.
 */

import type { ComponentType } from "react";

/**
 * Component registration metadata for the AI
 * This is what gets sent to the API in the `available_components` field
 */
export interface AvailableComponent {
  /** Component name (must be unique) */
  name: string;

  /** Human-readable description for the AI */
  description: string;

  /** JSON Schema describing component props */
  propsSchema: Record<string, unknown>;

  /** JSON Schema describing component state (optional) */
  stateSchema?: Record<string, unknown>;
}

/**
 * Component registration for React SDK
 * Extends AvailableComponent with the actual React component
 */
export interface TamboV1Component extends AvailableComponent {
  /** The React component to render */
  component: ComponentType<any>;

  /** Initial state factory (optional) */
  initialState?: () => Record<string, unknown>;
}

/**
 * Props passed to components when rendered
 */
export interface TamboComponentProps<
  TProps extends Record<string, unknown> = Record<string, unknown>,
  TState extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Component props from AI */
  props: TProps;

  /** Component state (can be updated by AI or client) */
  state?: TState;

  /** Unique component instance ID */
  componentId: string;

  /** Whether this component is currently streaming */
  isStreaming?: boolean;
}
