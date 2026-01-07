/**
 * Session source types for tracking authentication sessions.
 *
 * - Browser: Created via NextAuth signIn (audit entry only, not revocable - JWT controls auth)
 * - CLI: Created via device auth flow (revocable, stored credential)
 */
export enum SessionSource {
  Browser = "browser",
  CLI = "cli",
}
