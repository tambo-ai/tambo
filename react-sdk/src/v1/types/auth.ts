/**
 * Authentication state for the v1 SDK.
 *
 * Discriminated union tracking the current auth lifecycle:
 * - `identified`: ready to make API calls (via userKey or successful token exchange)
 * - `exchanging`: userToken provided, exchange in-flight
 * - `error`: token exchange failed
 * - `invalid`: both userKey AND userToken provided (must choose one)
 * - `unauthenticated`: neither userKey nor userToken provided
 */
export type TamboAuthState =
  | { status: "identified"; source: "userKey" | "tokenExchange" }
  | { status: "exchanging" }
  | { status: "error"; error: Error }
  | { status: "invalid" }
  | { status: "unauthenticated" };
