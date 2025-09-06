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
  /** Deprecated: Voice input is now always enabled when the component is present */
  voiceInputEnabled?: boolean;
}

/**
 * Provider for managing voice input configuration across the application.
 * Voice input is now automatically enabled when the MessageInputVoiceButton component is used.
 * @param props - The props for the TamboVoiceInputProvider
 * @param props.children - The children to render
 * @returns The provider component
 * @example
 * ```tsx
 * <TamboVoiceInputProvider>
 *   <App />
 * </TamboVoiceInputProvider>
 * ```
 */
export const TamboVoiceInputProvider: React.FC<
  PropsWithChildren<TamboVoiceInputProviderProps>
> = ({ children }) => {
  const contextValue: TamboVoiceInputContextProps = {
    isEnabled: true,
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
