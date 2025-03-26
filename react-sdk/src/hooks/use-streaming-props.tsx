import { useEffect } from "react";

/**
 * A helper hook that automatically updates Tambo component state when specified props change.
 *
 * This hook streamlines the common pattern of updating component state when receiving new
 * streamed values from Tambo, eliminating the need to write repetitive useEffect code.
 * @param currentState - The current state object from useTamboComponentState
 * @param setState - The setState function from useTamboComponentState
 * @param streamingProps - An object mapping state keys to prop values that should update the state
 * @example
 * ```tsx
 * // Instead of writing a complex useEffect:
 * const [emailState, setEmailState] = useTamboComponentState("email", initialState);
 *
 * // Simply use:
 * useTamboStreamingProps(emailState, setEmailState, {
 *   subject: aiGeneratedSubject,
 *   body: aiGeneratedBody,
 *   usersEmail: usersEmail
 * });
 * ```
 */
export function useTamboStreamingProps<T extends Record<string, any>>(
  currentState: T | undefined,
  setState: (state: T) => void,
  streamingProps: Partial<T>,
) {
  useEffect(() => {
    if (currentState) {
      let shouldUpdate = false;
      const updates: Partial<T> = {};

      Object.entries(streamingProps).forEach(([key, value]) => {
        if (value !== undefined && value !== currentState[key]) {
          shouldUpdate = true;
          updates[key as keyof T] = value as T[keyof T];
        }
      });

      if (shouldUpdate) {
        setState({
          ...currentState,
          ...updates,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentState, setState, ...Object.values(streamingProps)]);
}
