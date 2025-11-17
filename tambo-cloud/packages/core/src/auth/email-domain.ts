/**
 * Determine whether an email is allowed to sign in based on a configured
 * domain restriction and whether the email has been verified by the identity
 * provider.
 *
 * The rules are:
 * 1. If `allowedDomain` is _undefined_ or an empty string, **all** verified
 *    emails are allowed (i.e. the check is disabled).
 * 2. The email _must_ be verified (`emailVerified === true`).
 * 3. The email address (case-insensitive) must end with
 *    `@${allowedDomain}`.
 *
 * @param params.email          The email address returned by the provider.
 * @param params.emailVerified  Whether the provider asserts that the email is
 *                              verified.
 * @param params.allowedDomain  The configured domain (without leading
 *                              `@`). If omitted/empty the restriction is
 *                              disabled.
 *
 * @returns `true` if the email passes all checks, `false` otherwise.
 */
export function isEmailAllowed({
  email,
  emailVerified,
  allowedDomain,
}: {
  email: string | null | undefined;
  emailVerified: boolean;
  allowedDomain?: string | null;
}): boolean {
  if (!allowedDomain) {
    // No configured restriction – allow all  emails
    return true;
  }

  // No configured restriction – allow all verified emails
  if (!allowedDomain || allowedDomain.trim() === "") {
    return emailVerified;
  }

  if (!emailVerified || !email) {
    return false;
  }

  const domain = allowedDomain.trim().toLowerCase();
  const emailLower = email.toLowerCase();

  return emailLower.endsWith(`@${domain}`);
}
