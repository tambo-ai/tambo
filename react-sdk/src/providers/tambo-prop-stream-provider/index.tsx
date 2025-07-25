import { TamboPropStreamProviderComponent } from "./provider";
import { Complete, Empty, Loading } from "./state";

/**
 * The TamboPropsStreamProvider provides a context for managing stream states
 * with compound components for Loading, Empty, and Complete states.
 * @param children - The children to wrap
 * @returns The TamboPropStreamProvider component
 */
export const TamboPropStreamProvider = Object.assign(
  TamboPropStreamProviderComponent,
  {
    Loading,
    Empty,
    Complete,
  },
);

// Re-export components for individual use
export { useTamboStream } from "./provider";
export * from "./state";
export * from "./types";
