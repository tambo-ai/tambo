/**
 * Minimal helper for working with Resend Audience contacts using the SDK's
 * native types. Callers should pass the real `resend.contacts` client.
 */
import type { Resend } from "resend";

/**
 * Best‑effort unsubscribe check using Resend `contacts.get({ audienceId, email })`.
 *
 * Behavior:
 * - Trims the email; does not change case before lookup.
 * - Returns `true` only when the API clearly indicates `unsubscribed === true`.
 * - Returns `false` on not‑found or any indeterminate condition; callers should
 *   treat this as non‑blocking.
 */
export async function isResendEmailUnsubscribed(
  contacts: Resend["contacts"],
  audienceId: string,
  email: string,
): Promise<boolean> {
  const trimmed = email.trim();
  if (!trimmed) return false;
  try {
    const res = await contacts.get({ audienceId, email: trimmed });
    return res.data?.unsubscribed === true;
  } catch {
    // Non‑blocking on API error or network failure
    return false;
  }
}
