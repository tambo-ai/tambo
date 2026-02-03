import { Pending } from "./pending.js";
import { TamboPropStreamProviderComponent } from "./provider.js";
import { Streaming } from "./streaming.js";
import { Success } from "./success.js";

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
export { Pending } from "./pending.js";
export { useTamboStream } from "./provider.js";
export { Streaming } from "./streaming.js";
export { Success } from "./success.js";
export * from "./types.js";
