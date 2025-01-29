// src/env.mjs
import { vercel } from "@t3-oss/env-core/presets";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

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
    DISALLOWED_EMAIL_DOMAINS: z.string().min(1).optional(),
    INTERNAL_SLACK_USER_ID: z.string().min(1).optional(),
    SLACK_OAUTH_TOKEN: z.string().min(1).optional(),
    PORT: z.string().min(1).optional(),
    DATABASE_URL: z.string().min(1),
    API_KEY_SECRET: z.string().min(1),
    PROVIDER_KEY_SECRET: z.string().min(1),
    RESEND_API_KEY: z.string().min(1).optional(),
    // for smoketesting
    WEATHER_API_KEY: z.string().min(1).optional(),
  },
  /*
   * Environment variables available on the client (and server).
   *
   * 💡 You'll get type errors if these are not prefixed with NEXT_PUBLIC_.
   */
  client: {
    NEXT_PUBLIC_APP_URL: z.string().min(1).optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().min(1).optional(),
    // for dogfooding our own API
    NEXT_PUBLIC_HYDRA_API_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_HYDRA_API_URL: z.string().min(1).optional(),
  },
  /*
   * Due to how Next.js bundles environment variables on Edge and Client,
   * we need to manually destructure them to make sure all are included in bundle.
   *
   * 💡 You'll get type errors if not all variables from `server` & `client` are included here.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DISALLOWED_EMAIL_DOMAINS: process.env.DISALLOWED_EMAIL_DOMAINS,
    INTERNAL_SLACK_USER_ID: process.env.INTERNAL_SLACK_USER_ID,
    SLACK_OAUTH_TOKEN: process.env.SLACK_OAUTH_TOKEN,
    PORT: process.env.PORT,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    API_KEY_SECRET: process.env.API_KEY_SECRET,
    PROVIDER_KEY_SECRET: process.env.PROVIDER_KEY_SECRET,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    WEATHER_API_KEY: process.env.WEATHER_API_KEY,
    NEXT_PUBLIC_HYDRA_API_KEY: process.env.NEXT_PUBLIC_HYDRA_API_KEY,
    NEXT_PUBLIC_HYDRA_API_URL: process.env.NEXT_PUBLIC_HYDRA_API_URL,
  },
});
