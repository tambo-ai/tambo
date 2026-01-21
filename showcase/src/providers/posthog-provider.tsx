"use client";

import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";

if (typeof window !== "undefined") {
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
      cross_subdomain_cookie: true,
      persistence: "localStorage+cookie",
    });
  } else {
    console.warn(
      "PostHog: NEXT_PUBLIC_POSTHOG_KEY is not set, analytics disabled",
    );
  }
}

export function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Skip if PostHog is not configured
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

    if (pathname) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthog.capture("$pageview", {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}

export function PostHogRootProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return <>{children}</>;
  }
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
