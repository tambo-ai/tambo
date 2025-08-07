import { env } from "@/lib/env";
import { SupabaseAdapter } from "@/lib/nextauth-supabase-adapter";
import { refreshOidcToken } from "@tambo-ai-cloud/core";
import { decodeJwt } from "jose";
import NextAuth, { Account, NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

// Domain restriction helper
import { isEmailAllowed } from "@tambo-ai-cloud/core";

const ProviderConfig = {
  google: {
    clientId: env.GOOGLE_CLIENT_ID!,
    clientSecret: env.GOOGLE_CLIENT_SECRET!,
    idToken: true,
    allowDangerousEmailAccountLinking: true,
    authorization: {
      params: {
        prompt: "consent", // force refresh_token on every login
        access_type: "offline", // ask for a refresh_token
        response_type: "code",
      },
    },
  },
  github: {
    clientId: env.GITHUB_CLIENT_ID!,
    clientSecret: env.GITHUB_CLIENT_SECRET!,
    allowDangerousEmailAccountLinking: true,
  },
};

export const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter(),
  providers: [GitHub(ProviderConfig.github), Google(ProviderConfig.google)],
  session: {
    strategy: "jwt",
  },

  callbacks: {
    /**
     * Restrict sign-in to verified emails belonging to the configured domain
     * when `ALLOWED_LOGIN_DOMAIN` is set.
     */
    async signIn({ user, account, profile }) {
      const allowedDomain = env.ALLOWED_LOGIN_DOMAIN;

      // Attempt to determine verification status. Google returns
      // `email_verified`, GitHub does not (but GitHub emails are always
      // verified via their API). For safety, fallback to `user.emailVerified`
      // (Date) which is set by NextAuth when the adapter indicates the email
      // has been verified.

      const email = user?.email ?? (profile as any)?.email;

      // Google: `profile.email_verified` or `profile.verified_email`
      let emailVerified = false;
      if ((user as any)?.emailVerified) {
        emailVerified = true;
      } else if (profile) {
        const p: any = profile;
        emailVerified = Boolean(
          p.email_verified ?? p.verified_email ?? p.verified ?? false,
        );
      }

      const allowed = isEmailAllowed({
        email,
        emailVerified,
        allowedDomain,
      });

      if (allowed) {
        return true;
      }

      // Mask the email for logs – keep first three characters of the local
      // part, then obfuscate the rest.
      const maskEmail = (e?: string | null) => {
        if (!e) return "<no-email>";
        const [local, domain] = e.split("@");
        if (!domain) return "<invalid-email>";
        const visible = local.slice(0, 3);
        return `${visible}***@${domain}`;
      };

      console.error(
        `Unauthorized login attempt: user ${maskEmail(email)} tried to login but logins are restricted to *@${allowedDomain}`,
      );

      // Redirect to a generic unauthorized page. We MUST NOT leak the
      // restricted domain or full incoming email in the response.
      return "/unauthorized";
    },
    async jwt({ token, account, user }) {
      // console.log("AUTH ROUTE: jwt callback with", token, account, user);
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
        token.idToken = account.id_token;
      }

      const refreshedToken = await refreshTokenIfNecessary(account, token);
      // Add user ID to token
      if (user) {
        refreshedToken.id = user.id;
      }
      return refreshedToken;
    },
    async session({ session, token, user }) {
      // console.log("AUTH ROUTE: session callback with", session, token, user);
      if (user) {
        session.user = user;
      } else if (token) {
        session.user = token;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

/**
 * Refresh the token if it is expired, otherwise return the token as is
 * @param account - The account object
 * @param token - The token to refresh
 * @returns The refreshed token
 */
async function refreshTokenIfNecessary(
  account: Account | null,
  token: JWT,
): Promise<JWT> {
  if (!token.idToken) {
    return token;
  }
  const refreshToken = account?.refresh_token;
  const idToken = decodeJwt(token.idToken as string);

  // Extract expiration and issued-at times (in seconds)
  const exp = idToken.exp;
  const iat = idToken.iat;
  const now = Date.now();

  // If missing exp or iat, skip refresh logic
  if (!exp || !iat) {
    return token;
  }

  // Calculate time windows (all in milliseconds)
  const expMs = exp * 1000;
  const iatMs = iat * 1000;
  const totalLifetime = expMs - iatMs;
  const timeLeft = expMs - now;
  const tenPercentWindow = 0.1 * totalLifetime;
  const oneMinute = 60_000;
  const refreshThreshold = Math.min(tenPercentWindow, oneMinute);

  // Refresh if expiring in next 30 seconds, or within threshold
  const shouldRefresh =
    timeLeft < 30_000 || // less than 30 seconds left
    timeLeft < refreshThreshold; // within 10% of window or 1 min, whichever is smaller

  const provider =
    ProviderConfig[token.provider as keyof typeof ProviderConfig];

  if (!shouldRefresh || !refreshToken || typeof token.idToken !== "string") {
    // Just leave the token as is - this will likely throw an error somewhere else
    return token;
  }

  // Proactively refresh the token
  const refreshedToken = await refreshOidcToken(
    idToken,
    refreshToken,
    provider.clientId,
    provider.clientSecret,
  );
  return {
    ...token,
    accessToken: refreshedToken.accessToken,
    idToken: refreshedToken.idToken,
    refreshToken: refreshedToken.refreshToken,
    expiresAt: refreshedToken.expiresAt,
    scope: refreshedToken.scope,
    tokenType: refreshedToken.tokenType,
  };
}
