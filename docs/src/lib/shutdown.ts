/**
 * Tambo Cloud shutdown links and wording shared across the docs site chrome.
 * The MDX callout lives in content/shared/shutdown-callout.mdx.
 */
export const SHUTDOWN_ANNOUNCEMENT_URL =
  "https://tambo.co/blog/posts/tambo-is-shutting-down";

export const SELF_HOSTING_URL =
  "https://github.com/tambo-ai/tambo/blob/main/SELF-HOSTING.md";

export const CHARMING_URL = "https://usecharming.com";

export const CHARMING_DESCRIPTION =
  "a collaborative cloud for apps built with any AI agent";

/** Markdown notice placed at the top of /llms.txt and /llms-full.txt. */
export const LLMS_SHUTDOWN_NOTICE = `> **Tambo Cloud is shutting down.** New signups are closed. Tambo Cloud keeps running until October 31, 2026, after which the hosted API stops responding; user data is deleted November 30, 2026. Announcement: ${SHUTDOWN_ANNOUNCEMENT_URL}. Tambo is open source: self-host it instead of using a Tambo Cloud API key (${SELF_HOSTING_URL}).`;
