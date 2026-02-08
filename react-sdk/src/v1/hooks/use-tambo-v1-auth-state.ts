"use client";

import { useContext } from "react";
import { TamboClientContext } from "../../providers/tambo-client-provider";
import { TamboConfigContext } from "../providers/tambo-v1-provider";
import type { TamboAuthState } from "../types/auth";

/**
 * Hook to compute the current authentication state for the SDK.
 *
 * Reads from TamboClientContext and TamboConfigContext to determine
 * whether the SDK is ready to make API calls.
 * @returns The current auth state as a discriminated union
 * @throws {Error} If used outside TamboProvider
 */
export function useTamboAuthState(): TamboAuthState {
  const clientContext = useContext(TamboClientContext);
  if (!clientContext) {
    throw new Error("useTamboAuthState must be used within TamboProvider");
  }

  const config = useContext(TamboConfigContext);
  if (!config) {
    throw new Error("useTamboAuthState must be used within TamboProvider");
  }

  const { tokenExchangeError, userToken, hasValidToken } = clientContext;
  const { userKey } = config;

  // Invalid: both userKey AND userToken provided
  if (userKey && userToken) {
    return { status: "invalid" };
  }

  // Identified via userKey
  if (userKey) {
    return { status: "identified", source: "userKey" };
  }

  // Token exchange scenarios
  if (userToken) {
    if (tokenExchangeError) {
      return { status: "error", error: tokenExchangeError };
    }
    if (hasValidToken) {
      return { status: "identified", source: "tokenExchange" };
    }
    return { status: "exchanging" };
  }

  // Neither provided
  return { status: "unauthenticated" };
}
