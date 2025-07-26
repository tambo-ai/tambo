import { Complete } from "./complete";
import { Empty } from "./empty";
import { Loading } from "./loading";
import { TamboPropStreamProviderComponent } from "./provider";

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
export { Complete } from "./complete";
export { Empty } from "./empty";
export { Loading } from "./loading";
export { useTamboStream } from "./provider";
export * from "./types";
