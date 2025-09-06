"use client";
import React, { createContext, PropsWithChildren, useContext } from "react";

export interface TamboVoiceInputContextProps {
  /** Whether voice input is enabled */
  isEnabled: boolean;
}

export const TamboVoiceInputContext = createContext<
  TamboVoiceInputContextProps | undefined
>(undefined);

export interface TamboVoiceInputProviderProps {
  /** Whether voice input functionality is enabled. Defaults to true. */
  voiceInputEnabled?: boolean;
}

/**
 * Provider for managing voice input configuration across the application.
 * This provider controls whether voice input features are available to users.
 * @param props - The props for the TamboVoiceInputProvider
 * @param props.children - The children to render
 * @param props.voiceInputEnabled - Whether voice input is enabled (default: true)
 * @returns The provider component
 * @example
 * ```tsx
 * <TamboVoiceInputProvider voiceInputEnabled={true}>
 *   <App />
 * </TamboVoiceInputProvider>
 * ```
 */
export const TamboVoiceInputProvider: React.FC<
  PropsWithChildren<TamboVoiceInputProviderProps>
> = ({ children, voiceInputEnabled = true }) => {
  const contextValue: TamboVoiceInputContextProps = {
    isEnabled: voiceInputEnabled,
  };

  return (
    <TamboVoiceInputContext.Provider value={contextValue}>
      {children}
    </TamboVoiceInputContext.Provider>
  );
};

/**
 * Hook to access the voice input configuration.
 * Must be used within a TamboVoiceInputProvider.
 * @returns The voice input context
 * @throws Error if used outside of TamboVoiceInputProvider
 * @example
 * ```tsx
 * const { isEnabled } = useTamboVoiceInput();
 *
 * if (isEnabled) {
 *   // Show voice input button
 * }
 * ```
 */
export const useTamboVoiceInput = () => {
  const context = useContext(TamboVoiceInputContext);
  if (!context) {
    throw new Error(
      "useTamboVoiceInput must be used within a TamboVoiceInputProvider",
    );
  }
  return context;
};
