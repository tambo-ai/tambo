"use client";

import { env } from "@/lib/env";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { useEffect } from "react";

/**
 * Client component that identifies users in PostHog when they log in.
 * Resets identity when they log out for accurate analytics attribution.
 * Gracefully skips if PostHog is not configured.
 */
export function PostHogIdentify() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Skip if PostHog is not configured
    if (!env.NEXT_PUBLIC_POSTHOG_KEY) return;

    if (status === "authenticated" && session?.user?.id) {
      posthog.identify(session.user.id, {
        email: session.user.email ?? undefined,
        name: session.user.name ?? undefined,
      });
    } else if (status === "unauthenticated") {
      posthog.reset();
    }
  }, [session, status]);

  return null;
}
