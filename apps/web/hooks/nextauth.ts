import { env } from "@/lib/env";
import { signIn, signOut, useSession } from "next-auth/react";
import posthog from "posthog-js";
import { useCallback } from "react";

/** Get the logged in user's session */
export function useNextAuthSession() {
  return useSession();
}

/** Sign in with a provider */
export function useSignIn() {
  return signIn;
}

/**
 * Sign out the current user with PostHog reset.
 * Resets PostHog identity before signing out to ensure accurate analytics attribution.
 * Gracefully skips PostHog reset if not configured.
 * @returns A function that accepts signOut options and returns a Promise
 */
export function useSignOut() {
  return useCallback(async (options?: Parameters<typeof signOut>[0]) => {
    if (env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.reset();
    }
    return await signOut(options);
  }, []);
}
