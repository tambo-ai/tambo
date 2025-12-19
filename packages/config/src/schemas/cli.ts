import { z } from "zod";

/**
 * CLI component installation preferences.
 */
const componentsSchema = z.object({
  /** Default directory for component installation */
  prefix: z
    .string()
    .default("src/components/tambo")
    .describe("Default component install path"),
  /** Skip agent docs generation */
  skipAgentDocs: z
    .boolean()
    .default(false)
    .describe("Skip creating/updating agent docs"),
});

/**
 * CLI output preferences.
 */
const outputSchema = z.object({
  /** Use colors in output (respects NO_COLOR env var) */
  color: z.boolean().default(true).describe("Use colors in output"),
  /** Verbose output */
  verbose: z.boolean().default(false).describe("Enable verbose output"),
});

/**
 * CLI-specific configuration schema.
 */
export const cliSchema = z.object({
  /** Tambo Cloud API URL */
  apiUrl: z
    .string()
    .url()
    .default("https://api.tambo.co")
    .describe("Tambo Cloud API endpoint"),

  /** Default project ID for CLI commands */
  defaultProjectId: z
    .string()
    .optional()
    .describe("Default project ID to use for commands"),

  /** Component installation preferences */
  components: componentsSchema
    .default({})
    .describe("Component installation settings"),

  /** Output preferences */
  output: outputSchema.default({}).describe("Output settings"),
});

export type CliConfig = z.infer<typeof cliSchema>;
