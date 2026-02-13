/**
 * @tambo-ai/react-native
 *
 * React Native SDK for Tambo. Provides mobile-compatible providers
 * and hooks for building AI-powered React Native applications.
 *
 * This package wraps @tambo-ai/typescript-sdk with React hooks
 * that are compatible with React Native (no DOM dependencies).
 */

export { TamboProvider, useTamboContext } from "./provider";
export { useTambo } from "./hooks/use-tambo";
export { useTamboThread } from "./hooks/use-tambo-thread";
export { useTamboThreadInput } from "./hooks/use-tambo-thread-input";
export type { TamboProviderProps, TamboContextValue } from "./provider";
