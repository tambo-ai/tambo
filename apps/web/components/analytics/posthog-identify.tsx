"use client";

import { env } from "@/lib/env";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { useEffect } from "react";

/**
 * Client component that identifies users in PostHog when they log in.
 * Only handles identification - reset is handled by useSignOut hook on logout.
 * Gracefully skips if PostHog is not configured.
 */
export function PostHogIdentify() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Skip if PostHog is not configured
    if (!env.NEXT_PUBLIC_POSTHOG_KEY) return;

    // Only identify when fully authenticated with a user ID
    if (status === "authenticated" && session?.user?.id) {
      posthog.identify(session.user.id, {
        email: session.user.email ?? undefined,
        name: session.user.name ?? undefined,
      });
    }
    // Note: reset() is intentionally NOT called here on unauthenticated status
    // because that would reset during normal session loading/transitions.
    // Reset is handled by useSignOut hook on explicit logout.
  }, [session, status]);

  return null;
}
