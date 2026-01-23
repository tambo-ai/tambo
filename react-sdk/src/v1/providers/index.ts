/**
 * Providers for v1 API
 *
 * Re-exports provider components and hooks for stream state management
 * and component/tool registry.
 */

export {
  TamboV1StreamProvider,
  useStreamState,
  useStreamDispatch,
  type TamboV1StreamProviderProps,
} from "./tambo-v1-stream-context";

// Re-export TamboRegistryProvider from beta SDK
// The registry is API-agnostic and works for both beta and v1
export {
  TamboRegistryProvider,
  TamboRegistryContext,
  type TamboRegistryContext as TamboRegistryContextType,
} from "../../providers/tambo-registry-provider";
