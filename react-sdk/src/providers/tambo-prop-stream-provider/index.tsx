import { Pending } from "./pending";
import { TamboPropStreamProviderComponent } from "./provider";
import { Streaming } from "./streaming";
import { Success } from "./success";

/**
 * The TamboPropStreamProvider provides a context for managing stream states
 * with compound components for Pending, Streaming, and Success states.
 * @param children - The children to wrap
 * @returns The TamboPropStreamProvider component
 */
export const TamboPropStreamProvider = Object.assign(
  TamboPropStreamProviderComponent,
  {
    Streaming,
    Pending,
    Success,
  },
);

// Re-export components for individual use
export { Pending } from "./pending";
export { useTamboStream } from "./provider";
export { Streaming } from "./streaming";
export { Success } from "./success";
export * from "./types";
