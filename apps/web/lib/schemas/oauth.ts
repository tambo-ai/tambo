import { OAuthValidationMode } from "@tambo-ai-cloud/core";
import { z } from "zod/v3";

/**
 * Shared schemas for OAuth validation settings.
 * Used by both tRPC routers and tool definitions.
 */

// Input schemas
export const getOAuthValidationSettingsInput = z.object({
  projectId: z
    .string()
    .describe("The complete project ID (e.g., 'p_u2tgQg5U.43bbdf')"),
});

export const updateOAuthValidationSettingsInput = z
  .object({
    projectId: z
      .string()
      .describe("The complete project ID (e.g., 'p_u2tgQg5U.43bbdf')"),
    mode: z
      .nativeEnum(OAuthValidationMode)
      .describe("The OAuth validation mode"),
    secretKey: z
      .string()
      .optional()
      .describe(
        "The secret key for symmetric validation (required when mode is SYMMETRIC)",
      ),
    publicKey: z
      .string()
      .optional()
      .describe(
        "The public key for asymmetric manual validation (required when mode is ASYMMETRIC_MANUAL)",
      ),
    isTokenRequired: z
      .boolean()
      .optional()
      .describe("Whether authentication tokens are required for this project"),
  })
  .refine(
    (data) => {
      // Validate required fields based on mode
      if (data.mode === OAuthValidationMode.SYMMETRIC) {
        return !!data.secretKey;
      }
      if (data.mode === OAuthValidationMode.ASYMMETRIC_MANUAL) {
        return !!data.publicKey;
      }
      return true;
    },
    {
      message:
        "Secret key is required for SYMMETRIC mode, public key is required for ASYMMETRIC_MANUAL mode",
    },
  );

// Output schemas
export const oauthValidationSettingsSchema = z.object({
  mode: z.nativeEnum(OAuthValidationMode).describe("The OAuth validation mode"),
  publicKey: z
    .string()
    .nullable()
    .describe("The public key for asymmetric validation"),
  hasSecretKey: z
    .boolean()
    .describe("Whether a secret key is stored for symmetric validation"),
  hasPublicKey: z.boolean().describe("Whether a public key is stored"),
});

export const updateOAuthValidationSettingsOutputSchema = z.object({
  success: z.boolean().describe("Whether the update was successful"),
});
