/**
 * Utilities for handling email strings in logs and UI.
 */

/**
 * Mask an email address for safe logging by preserving the first character of the
 * local part and the full domain, replacing the remainder of the local part with
 * a fixed mask ("***").
 *
 * Examples:
 * - "alice@example.com" -> "a***@example.com"
 * - "A.LONG+tag@sub.example.co.uk" -> "A***@sub.example.co.uk"
 * - " a@b.com " -> "a***@b.com"
 * - "nonsense" -> "n***"
 *
 * Notes:
 * - Trims surrounding whitespace.
 * - If the string doesn't contain an '@', returns the first character followed by
 *   the mask (or just the mask if empty).
 */
export function maskEmail(input: string): string {
  const s = input.trim();
  if (s.length === 0) return "***";
  const at = s.indexOf("@");
  if (at <= 0) {
    return s[0] + "***";
  }
  return s[0] + "***" + s.slice(at);
}
