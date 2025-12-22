import { z } from "zod";

/**
 * Slack integration configuration.
 */
const slackSchema = z.object({
  oauthToken: z
    .string()
    .optional()
    .describe(
      "Slack bot OAuth token (requires conversations.connect:write scope)",
    ),
  internalUserId: z
    .string()
    .optional()
    .describe("Slack user ID for internal notifications"),
});

/**
 * Resend email service configuration.
 */
const resendSchema = z.object({
  apiKey: z.string().optional().describe("Resend API key"),
  audienceId: z
    .string()
    .optional()
    .describe("Resend audience ID for newsletter/marketing emails"),
  fromEmail: z
    .string()
    .email()
    .optional()
    .describe("Default sender email address"),
});

/**
 * GitHub integration configuration (non-OAuth, for API calls).
 */
const githubSchema = z.object({
  token: z
    .string()
    .optional()
    .describe("GitHub personal access token for API calls"),
});

/**
 * PostHog analytics configuration.
 */
const posthogSchema = z.object({
  key: z.string().optional().describe("PostHog project API key"),
  host: z
    .string()
    .url()
    .default("https://app.posthog.com")
    .describe("PostHog host URL"),
});

/**
 * Sentry error tracking configuration.
 */
const sentrySchema = z.object({
  dsn: z.string().optional().describe("Sentry DSN for error tracking"),
  org: z.string().optional().describe("Sentry organization slug"),
  project: z.string().optional().describe("Sentry project slug"),
});

/**
 * Integrations configuration schema.
 */
export const integrationsSchema = z.object({
  slack: slackSchema.optional().describe("Slack integration settings"),
  resend: resendSchema.optional().describe("Resend email service settings"),
  github: githubSchema.optional().describe("GitHub API settings"),
  posthog: posthogSchema.optional().describe("PostHog analytics settings"),
  sentry: sentrySchema.optional().describe("Sentry error tracking settings"),
});

export type IntegrationsConfig = z.infer<typeof integrationsSchema>;
