import { getContext } from "svelte";
import type TamboAI from "@tambo-ai/typescript-sdk";
import { TAMBO_CLIENT_KEY } from "../context.js";

/**
 * Get the TamboAI client from context.
 *
 * Must be called within a component that is a descendant of TamboProvider.
 * @returns The TamboAI client instance
 * @throws Error if called outside of TamboProvider
 */
export function useTamboClient(): TamboAI {
  const client = getContext<TamboAI | undefined>(TAMBO_CLIENT_KEY);

  if (!client) {
    throw new Error("useTamboClient must be used within a TamboProvider");
  }

  return client;
}
