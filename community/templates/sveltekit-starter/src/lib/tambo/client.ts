import TamboAI from "@tambo-ai/typescript-sdk";

let tamboClient: TamboAI | null = null;

export interface TamboClientOptions {
  apiKey: string;
  baseURL?: string;
}

/**
 * Initialize and get the Tambo AI client
 */
export function getTamboClient(options?: TamboClientOptions): TamboAI {
  if (tamboClient) {
    return tamboClient;
  }

  const apiKey = options?.apiKey || import.meta.env.VITE_TAMBO_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Tambo API key is required. Set VITE_TAMBO_API_KEY environment variable or pass apiKey in options.",
    );
  }

  tamboClient = new TamboAI({
    apiKey,
    baseURL: options?.baseURL,
  });

  return tamboClient;
}

/**
 * Reset the Tambo client (useful for testing)
 */
export function resetTamboClient(): void {
  tamboClient = null;
}
