import TamboAI from "@tambo-ai/typescript-sdk";
import type { TamboClientOptions } from "./types.js";

/**
 * Package version for tracking in headers
 */
const PACKAGE_VERSION = "0.1.0";

/**
 * Creates a new TamboAI client instance.
 *
 * IMPORTANT: This is a factory function that creates a NEW client instance
 * every time it's called. This is intentional for SSR safety - module-level
 * singletons cause state to bleed between requests in SSR environments.
 *
 * Usage:
 * - Call this once per provider instance
 * - Pass the client through Svelte context
 * - Never store clients at module level
 * @param options - Client configuration options
 * @returns A new TamboAI client instance
 */
export function createTamboClient(options: TamboClientOptions): TamboAI {
  const { apiKey, tamboUrl, additionalHeaders, userToken } = options;

  if (!apiKey) {
    throw new Error(
      "Tambo API key is required. Pass apiKey in TamboProvider options.",
    );
  }

  const defaultHeaders: Record<string, string> = {
    "X-Tambo-Svelte-Version": PACKAGE_VERSION,
    ...additionalHeaders,
  };

  if (userToken) {
    defaultHeaders["X-Tambo-User-Token"] = userToken;
  }

  return new TamboAI({
    apiKey,
    baseURL: tamboUrl,
    defaultHeaders,
  });
}

/**
 * Type guard to check if a value is a TamboAI client
 * @param value - Value to check
 * @returns True if value is a TamboAI client
 */
export function isTamboClient(value: unknown): value is TamboAI {
  return (
    typeof value === "object" &&
    value !== null &&
    "beta" in value &&
    typeof (value as TamboAI).beta === "object"
  );
}
