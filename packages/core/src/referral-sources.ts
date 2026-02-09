/**
 * Single source of truth for the "How did you hear about us?" options.
 * Used by the onboarding UI, tRPC validation, and DB operations.
 */
export const REFERRAL_SOURCES = [
  "Word of mouth",
  "GitHub",
  "X",
  "LinkedIn",
  "Reddit",
  "Slack/Discord",
  "Meetup/Conference",
  "ChatGPT/Claude",
  "Newsletter",
  "Other",
] as const;

export type ReferralSource = (typeof REFERRAL_SOURCES)[number];
