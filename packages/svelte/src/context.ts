import { getContext, setContext } from "svelte";
import { TamboClient } from "@tambo-ai/typescript-sdk";

const TAMBO_CONTEXT_KEY = "tambo";

export interface TamboContext {
  client: TamboClient;
}

/**
 * Create a Tambo client and set it in Svelte context.
 * Call this in your root layout or page component.
 *
 * Usage:
 * ```svelte
 * <script>
 *   import { createTamboClient } from '@tambo-ai/svelte';
 *   createTamboClient({ apiKey: 'your-api-key' });
 * </script>
 * ```
 */
export function createTamboClient(options: {
  apiKey: string;
  apiUrl?: string;
}): TamboContext {
  const client = new TamboClient({
    apiKey: options.apiKey,
    ...(options.apiUrl ? { apiUrl: options.apiUrl } : {}),
  });

  const context: TamboContext = { client };
  setContext(TAMBO_CONTEXT_KEY, context);
  return context;
}

/**
 * Set an existing Tambo context (useful for testing or SSR).
 */
export function setTamboContext(context: TamboContext): void {
  setContext(TAMBO_CONTEXT_KEY, context);
}

/**
 * Get the Tambo context from the nearest ancestor.
 * Must be called within a component tree that has called createTamboClient.
 */
export function getTamboContext(): TamboContext {
  const context = getContext<TamboContext>(TAMBO_CONTEXT_KEY);
  if (!context) {
    throw new Error(
      "getTamboContext() must be used within a component tree that called createTamboClient(). " +
        "Call createTamboClient({ apiKey: '...' }) in your root layout."
    );
  }
  return context;
}
