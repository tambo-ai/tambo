/**
 * Component Types for v1 API
 *
 * Defines how React components are registered and made available to the AI.
 *
 * Note: AvailableComponent is defined locally to match RunCreateParams.AvailableComponent
 * from the SDK. The SDK exports two different AvailableComponent types:
 * - `shared.AvailableComponent` has `props` and `contextTools` fields
 * - `RunCreateParams.AvailableComponent` has `propsSchema` and `stateSchema` fields
 * We need the latter for v1 API calls, so we define it locally to avoid confusion.
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
