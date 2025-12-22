import { z } from "zod";

/**
 * Secrets configuration schema.
 * These are encryption keys that should be kept secure.
 */
export const secretsSchema = z.object({
  /** Secret for encrypting/decrypting Tambo API keys */
  apiKey: z
    .string()
    .min(8)
    .describe(
      "Secret for encrypting API keys (generate with: openssl rand -hex 32)",
    ),
  /** Secret for encrypting/decrypting provider keys (e.g., OpenAI) */
  providerKey: z
    .string()
    .min(8)
    .describe(
      "Secret for encrypting provider keys (generate with: openssl rand -hex 32)",
    ),
});

export type SecretsConfig = z.infer<typeof secretsSchema>;
