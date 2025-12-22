import { z } from "zod";
import { pathsSchema, type PathsConfig } from "./paths";
import { databaseSchema, type DatabaseConfig } from "./database";
import { authSchema, type AuthConfig } from "./auth";
import { secretsSchema, type SecretsConfig } from "./secrets";
import { integrationsSchema, type IntegrationsConfig } from "./integrations";
import { cliSchema, type CliConfig } from "./cli";
import { whitelabelSchema, type WhitelabelConfig } from "./whitelabel";

/**
 * Full configuration schema.
 * All fields are optional to allow partial configs that merge with defaults.
 */
export const fullConfigSchema = z.object({
  /** Override default paths (XDG-based) */
  paths: pathsSchema,

  /** Database configuration */
  database: databaseSchema.optional(),

  /** Authentication configuration */
  auth: authSchema.optional(),

  /** Encryption secrets */
  secrets: secretsSchema.optional(),

  /** Third-party integrations */
  integrations: integrationsSchema.optional(),

  /** CLI-specific settings */
  cli: cliSchema.optional(),

  /** Whitelabel/branding settings */
  whitelabel: whitelabelSchema.optional(),
});

export type FullConfig = z.infer<typeof fullConfigSchema>;

/**
 * Database-only configuration.
 * For packages that only need database access.
 */
export const dbConfigSchema = z.object({
  database: databaseSchema,
  secrets: secretsSchema.optional(),
});

export type DbConfig = z.infer<typeof dbConfigSchema>;

/**
 * CLI-only configuration.
 * For the CLI package.
 */
export const cliConfigSchema = z.object({
  paths: pathsSchema,
  cli: cliSchema.default({}),
});

export type CliOnlyConfig = z.infer<typeof cliConfigSchema>;

// Re-export individual schemas and types
export {
  pathsSchema,
  databaseSchema,
  authSchema,
  secretsSchema,
  integrationsSchema,
  cliSchema,
  whitelabelSchema,
  type PathsConfig,
  type DatabaseConfig,
  type AuthConfig,
  type SecretsConfig,
  type IntegrationsConfig,
  type CliConfig,
  type WhitelabelConfig,
};
