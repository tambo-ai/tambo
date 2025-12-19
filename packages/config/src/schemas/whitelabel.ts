import { z } from "zod";

/**
 * Whitelabel configuration schema.
 * For customizing the Tambo Cloud UI for self-hosted deployments.
 */
export const whitelabelSchema = z.object({
  /** Organization name to display */
  orgName: z.string().optional().describe("Organization name for branding"),
  /** Organization logo URL */
  orgLogo: z.string().url().optional().describe("Organization logo URL"),
  /** Terms of Service URL */
  termsUrl: z.string().url().optional().describe("Terms of Service URL"),
  /** Privacy Policy URL */
  privacyUrl: z.string().url().optional().describe("Privacy Policy URL"),
  /** License URL */
  licenseUrl: z.string().url().optional().describe("License URL"),
});

export type WhitelabelConfig = z.infer<typeof whitelabelSchema>;
