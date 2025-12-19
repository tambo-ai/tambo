import { z } from "zod";

/**
 * OAuth provider configuration.
 */
const oauthProviderSchema = z.object({
  clientId: z.string().optional().describe("OAuth client ID"),
  clientSecret: z.string().optional().describe("OAuth client secret"),
});

/**
 * Admin credentials configuration (for self-hosted without OAuth).
 */
const adminCredentialsSchema = z.object({
  email: z.string().email().describe("Admin user email"),
  password: z.string().min(8).describe("Admin user password (min 8 chars)"),
});

/**
 * Authentication configuration schema.
 */
export const authSchema = z.object({
  /** Secret for encrypting sessions */
  secret: z.string().min(8).describe("Session encryption secret"),
  /** Base URL for auth callbacks */
  url: z.string().url().describe("Auth callback URL"),

  /** GitHub OAuth configuration */
  github: oauthProviderSchema.optional().describe("GitHub OAuth settings"),
  /** Google OAuth configuration */
  google: oauthProviderSchema.optional().describe("Google OAuth settings"),

  /** Admin credentials for self-hosted deployments */
  admin: adminCredentialsSchema
    .optional()
    .describe("Admin credentials for self-hosted deployments"),

  /** Restrict logins to a specific email domain */
  allowedDomain: z
    .string()
    .optional()
    .describe("Restrict logins to this email domain (e.g., 'company.com')"),

  /** Block signups from these email domains */
  disallowedDomains: z
    .array(z.string())
    .optional()
    .describe("Block signups from these email domains"),
});

export type AuthConfig = z.infer<typeof authSchema>;
