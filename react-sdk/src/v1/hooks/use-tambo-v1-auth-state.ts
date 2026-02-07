"use client";

import { useContext } from "react";
import { TamboClientContext } from "../../providers/tambo-client-provider";
import { TamboV1ConfigContext } from "../providers/tambo-v1-provider";
import type { TamboV1AuthState } from "../types/auth";

/**
 * Hook to compute the current authentication state for the v1 SDK.
 *
 * Reads from TamboClientContext and TamboV1ConfigContext to determine
 * whether the SDK is ready to make API calls.
 * @returns The current auth state as a discriminated union
 * @throws {Error} If used outside TamboV1Provider
 */
export function useTamboV1AuthState(): TamboV1AuthState {
  const clientContext = useContext(TamboClientContext);
  if (!clientContext) {
    throw new Error("useTamboV1AuthState must be used within TamboV1Provider");
  }

  const config = useContext(TamboV1ConfigContext);
  if (!config) {
    throw new Error("useTamboV1AuthState must be used within TamboV1Provider");
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
