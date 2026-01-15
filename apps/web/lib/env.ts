// src/env.mjs
import { createEnv } from "@t3-oss/env-nextjs";
import { vercel } from "@t3-oss/env-nextjs/presets-zod";
import { z } from "zod/v3";

function allowEmptyString(value: string) {
  return value === "" ? undefined : value;
}
export const env = createEnv({
  extends: [vercel()],
  /*
   * Serverside Environment variables, not available on the client.
   * Will throw if you access these variables on the client.
   */
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.string().min(1).optional(),
    // For newsletter and contact forms
    RESEND_API_KEY: z.string().min(1).optional(),
    RESEND_AUDIENCE_ID: z.string().min(1).optional(),
    // For Slack notifications
    INTERNAL_SLACK_USER_ID: z.string().min(1).optional(),
    SLACK_OAUTH_TOKEN: z.string().min(1).optional(),
    // For email domain validation
    DISALLOWED_EMAIL_DOMAINS: z.string().min(1).optional(),
    // For GitHub stars display
    GITHUB_TOKEN: z.string().min(1).optional(),
    // For contacts database
    DATABASE_URL: z.string().min(1).optional(),
  },
  /*
   * Environment variables available on the client (and server).
   *
   * 💡 You'll get type errors if these are not prefixed with NEXT_PUBLIC_.
   */
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().min(1).optional(),
    // For demo page using Tambo API
    NEXT_PUBLIC_TAMBO_API_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_TAMBO_API_URL: z.string().min(1).optional(),
    // Sentry
    NEXT_PUBLIC_SENTRY_DSN: z.string().transform(allowEmptyString).optional(),
    NEXT_PUBLIC_SENTRY_ORG: z.string().transform(allowEmptyString).optional(),
    NEXT_PUBLIC_SENTRY_PROJECT: z
      .string()
      .transform(allowEmptyString)
      .optional(),
    // Legal redirects
    NEXT_PUBLIC_TERMS_URL: z.string().url().optional(),
    NEXT_PUBLIC_PRIVACY_URL: z.string().url().optional(),
    NEXT_PUBLIC_LICENSE_URL: z.string().url().optional(),
    // Dashboard URL for redirects
    NEXT_PUBLIC_DASHBOARD_URL: z.string().url().optional(),
    // Docs URL for redirects
    NEXT_PUBLIC_DOCS_URL: z.string().url().optional(),
    // Whitelabeling vars
    NEXT_PUBLIC_TAMBO_WHITELABEL_ORG_NAME: z
      .string()
      .min(1)
      .optional()
      .or(z.literal("")),
    NEXT_PUBLIC_TAMBO_WHITELABEL_ORG_LOGO: z
      .string()
      .url()
      .optional()
      .or(z.literal("")),
  },
  /*
   * Due to how Next.js bundles environment variables on Edge and Client,
   * we need to manually destructure them to make sure all are included in bundle.
   *
   * 💡 You'll get type errors if not all variables from `server` & `client` are included here.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_AUDIENCE_ID: process.env.RESEND_AUDIENCE_ID,
    INTERNAL_SLACK_USER_ID: process.env.INTERNAL_SLACK_USER_ID,
    SLACK_OAUTH_TOKEN: process.env.SLACK_OAUTH_TOKEN,
    DISALLOWED_EMAIL_DOMAINS: process.env.DISALLOWED_EMAIL_DOMAINS,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_TAMBO_API_KEY: process.env.NEXT_PUBLIC_TAMBO_API_KEY,
    NEXT_PUBLIC_TAMBO_API_URL: process.env.NEXT_PUBLIC_TAMBO_API_URL,
    // Sentry
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_ORG: process.env.NEXT_PUBLIC_SENTRY_ORG,
    NEXT_PUBLIC_SENTRY_PROJECT: process.env.NEXT_PUBLIC_SENTRY_PROJECT,
    // Legal redirects
    NEXT_PUBLIC_TERMS_URL: process.env.NEXT_PUBLIC_TERMS_URL,
    NEXT_PUBLIC_PRIVACY_URL: process.env.NEXT_PUBLIC_PRIVACY_URL,
    NEXT_PUBLIC_LICENSE_URL: process.env.NEXT_PUBLIC_LICENSE_URL,
    // Dashboard URL for redirects
    NEXT_PUBLIC_DASHBOARD_URL: process.env.NEXT_PUBLIC_DASHBOARD_URL,
    // Docs URL for redirects
    NEXT_PUBLIC_DOCS_URL: process.env.NEXT_PUBLIC_DOCS_URL,
    // Whitelabeling vars
    NEXT_PUBLIC_TAMBO_WHITELABEL_ORG_NAME:
      process.env.NEXT_PUBLIC_TAMBO_WHITELABEL_ORG_NAME,
    NEXT_PUBLIC_TAMBO_WHITELABEL_ORG_LOGO:
      process.env.NEXT_PUBLIC_TAMBO_WHITELABEL_ORG_LOGO,
  },
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});
