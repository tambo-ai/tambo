import type { Account } from "next-auth";
import type { Adapter } from "next-auth/adapters";

interface ExistingUserLookup {
  email?: string | null;
  account?: Pick<Account, "provider" | "providerAccountId"> | null;
}

/**
 * Determine whether a sign-in attempt belongs to an account that already
 * exists. NextAuth runs the `signIn` callback before it creates the user, so
 * this is the point where new signups can be told apart from returning users.
 *
 * A user counts as existing when the provider account is already linked, or
 * when a user with the same email exists (NextAuth links the new provider to
 * that user because `allowDangerousEmailAccountLinking` is enabled).
 * @returns true when the user already has a Tambo Cloud account
 */
export async function isExistingUser(
  adapter: Adapter,
  { email, account }: ExistingUserLookup,
): Promise<boolean> {
  const { getUserByAccount, getUserByEmail } = adapter;
  if (!getUserByAccount || !getUserByEmail) {
    throw new Error(
      "Auth adapter must implement getUserByAccount and getUserByEmail",
    );
  }

  if (account) {
    const userByAccount = await getUserByAccount({
      provider: account.provider,
      providerAccountId: account.providerAccountId,
    });
    if (userByAccount) {
      return true;
    }
  }

  if (!email) {
    return false;
  }

  const userByEmail = await getUserByEmail(email);
  return !!userByEmail;
}
