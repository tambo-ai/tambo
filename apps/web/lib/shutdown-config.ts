import { env } from "@/lib/env";

/**
 * Single source of truth for Tambo Cloud shutdown messaging.
 */
export const SHUTDOWN_CONFIG = {
  // Tambo Cloud keeps running until this date; the API stops responding after it.
  SERVICE_END_DATE: "October 31, 2026",

  // User data is deleted on this date.
  DATA_DELETION_DATE: "November 30, 2026",

  // In-app page new visitors land on when they try to create an account.
  SIGNUPS_CLOSED_PATH: "/signups-closed",

  URLS: {
    ANNOUNCEMENT: "https://tambo.co/blog/posts/tambo-is-shutting-down",
    CHARMING: "https://usecharming.com",
    GITHUB: "https://github.com/tambo-ai/tambo",
    SELF_HOSTING: "https://github.com/tambo-ai/tambo/blob/main/SELF-HOSTING.md",
  },

  CHARMING_DESCRIPTION:
    "a collaborative cloud for apps built with any AI agent",
} as const;

/**
 * Identify managed Tambo Cloud deployments from the existing authentication
 * URL. Shutdown notices apply automatically on Tambo-owned hosts; self-hosted
 * deployments don't show them. Server-side only.
 * @returns true when the authentication URL uses the Tambo Cloud domain
 */
export function isTamboCloud(): boolean {
  const hostname = new URL(env.NEXTAUTH_URL).hostname;
  return hostname === "tambo.co" || hostname.endsWith(".tambo.co");
}
