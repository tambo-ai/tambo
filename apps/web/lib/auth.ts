import { env } from "@/lib/env";
import { SupabaseAdapter } from "@/lib/nextauth-supabase-adapter";
import * as Sentry from "@sentry/nextjs";
import {
  isEmailAllowed,
  refreshOidcToken,
  SessionSource,
} from "@tambo-ai-cloud/core";
import { getDb, schema } from "@tambo-ai-cloud/db";
import { decodeJwt } from "jose";
import { Account, AuthOptions as NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import Email from "next-auth/providers/email";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { Provider } from "next-auth/providers/index";
import { Resend } from "resend";
import {
  AuthProviderConfig,
  getAvailableProviderConfigs,
} from "./auth-providers";

// Module-level Resend client to avoid re-instantiation on each signup
const resend =
  env.RESEND_API_KEY && env.RESEND_AUDIENCE_ID
    ? new Resend(env.RESEND_API_KEY)
    : null;

const RESEND_SUBSCRIPTION_TIMEOUT_MS = 1500;

class TimeoutError extends Error {
  readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`Operation timed out after ${timeoutMs}ms`);
    this.name = "TimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  return await new Promise((resolve, reject) => {
    const timeoutId: ReturnType<typeof setTimeout> = setTimeout(() => {
      reject(new TimeoutError(timeoutMs));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}

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
function getProviders(): Provider[] {
  const providers: Provider[] = [];
  if (env.GITHUB_CLIENT_ID) {
    providers.push(GitHub(ProviderConfig.github));
  }
  if (env.GOOGLE_CLIENT_ID) {
    providers.push(Google(ProviderConfig.google));
  }
  if (!providers.length) {
    // Right now only fall back to email if no providers are configured
    if (env.RESEND_API_KEY) {
      providers.push(
        Email({
          server: {
            host: "smtp.resend.com",
            port: 587,
            auth: {
              user: "resend",
              pass: env.RESEND_API_KEY,
            },
          },
          from: env.EMAIL_FROM_DEFAULT,
        }),
      );
    } else {
      console.error(
        "No email provider configured, but RESEND_API_KEY is not set. Please set RESEND_API_KEY to use email authentication.",
      );
    }
  }
  return providers;
}

export const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter(),
  providers: getProviders(),
  session: {
    strategy: "jwt",
  },

  callbacks: {
    /**
     * Restrict sign-in to verified emails belonging to the configured domain
     * when `ALLOWED_LOGIN_DOMAIN` is set.
     *
     * Also creates an audit entry in the unified sessions table for browser logins.
     * Note: With JWT strategy, actual auth is controlled by JWT - this is just audit.
     */
    async signIn({ user, profile }) {
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

      if (!allowed) {
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
      }

      // Create audit entry for browser session
      // This is just a log - with JWT strategy, the JWT controls actual auth
      // ID and expiresAt are generated by Postgres
      try {
        const db = getDb(env.DATABASE_URL);
        await db.insert(schema.sessions).values({
          userId: user.id,
          source: SessionSource.Browser,
        });
      } catch (error) {
        // Don't fail the login if audit entry fails - log and continue.
        // This is safe because:
        // 1. The user MUST exist at this point - the adapter creates/finds
        //    the database user before this signIn callback runs. user.id is the database UUID.
        // 2. With JWT strategy, the JWT itself controls auth, not the sessions table
        // 3. The sessions table is purely for audit/tracking purposes
        // 4. If this fails, it's likely a transient DB issue, not a missing user
        console.error("Failed to create browser session audit entry:", error);
      }

      return true;
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
    async redirect({ url, baseUrl }) {
      // Allow relative URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // Allow URLs on the same origin
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      // Default to dashboard
      return `${baseUrl}/dashboard`;
    },
  },
  pages: {
    signIn: "/login",
  },
  events: {
    // Subscribe new users to Resend audience (fires only on signup, not existing user login)
    async createUser({ user }) {
      if (!resend || !env.RESEND_AUDIENCE_ID || !user.email) {
        return;
      }

      try {
        await withTimeout(
          resend.contacts.create({
            audienceId: env.RESEND_AUDIENCE_ID,
            email: user.email,
            ...(user.name && { firstName: user.name }),
          }),
          RESEND_SUBSCRIPTION_TIMEOUT_MS,
        );
      } catch (error) {
        const isTimeoutError = error instanceof TimeoutError;
        Sentry.captureException(error, {
          tags: {
            operation: "resend_subscription",
            ...(isTimeoutError ? { timeout: "true" } : {}),
          },
          extra: {
            userId: user.id,
            ...(isTimeoutError
              ? { timeoutMs: RESEND_SUBSCRIPTION_TIMEOUT_MS }
              : {}),
          },
        });
      }
    },
  },
  secret: env.NEXTAUTH_SECRET,
};
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
  const idToken = decodeJwt(token.idToken);

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
  const oneMinute = 60000;
  const refreshThreshold = Math.min(tenPercentWindow, oneMinute);

  // Refresh if expiring in next 30 seconds, or within threshold
  const shouldRefresh =
    timeLeft < 30000 || // less than 30 seconds left
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
    accessToken: refreshedToken.accessToken as string,
    idToken: refreshedToken.idToken as string,
    expiresAt: refreshedToken.expiresAt,
    scope: refreshedToken.scope,
    tokenType: refreshedToken.tokenType,
  };
}

/**
 * Get the auth providers configured in the environment and other metadata
 * needed for the login page.
 * @returns The auth providers configured in the environment.
 */
export function getAuthProviders(): AuthProviderConfig[] {
  const providers = getProviders();

  // Get provider IDs from NextAuth
  const providerIds = providers.map((provider) => provider.id);

  // Get provider configurations with metadata
  const providerConfigs = getAvailableProviderConfigs(providerIds);

  return providerConfigs;
}
