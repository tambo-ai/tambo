/**
 * Single source of truth for the "How did you hear about us?" dropdown options.
 * Used by both the auth form UI and the tRPC validation schema.
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
