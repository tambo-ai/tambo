"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AuthedLayoutWrapper({
  children,
  hasSession: initialHasSession,
}: {
  children: React.ReactNode;
  hasSession: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const isSessionLoading = status === "loading";

  // Use client-side session info when available, fallback to server-provided status when loading
  const hasValidSession =
    session !== null || (initialHasSession && isSessionLoading);

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const loginParams = useLoginParams(pathname);

  useEffect(() => {
    async function handleAuth() {
      // If no session, redirect to login
      if (!hasValidSession && !isSessionLoading) {
        router.replace(`/login${loginParams}`);
      } else if (hasValidSession) {
        // Auth check complete, we can render the content
        setIsCheckingAuth(false);
      }
    }

    handleAuth().catch(console.error);
  }, [hasValidSession, pathname, router, isSessionLoading, loginParams]);

  // Show loading state while checking authentication
  if (isCheckingAuth || isSessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse h-8 w-8 rounded-full bg-background" />
      </div>
    );
  }

  // Only render children if we have a valid session
  return hasValidSession ? <>{children}</> : null;
}

/**
 * Helper hook to generate login parameters based on current path and auth errors
 * Makes sure to forward auth errors to wherever the redirect is going to.
 */
function useLoginParams(pathname: string) {
  const authErrorArgs = useAuthErrorArgs();
  const redirectPathname = pathname === "/login" ? "" : pathname;
  const urlParams = new URLSearchParams();
  if (redirectPathname) {
    urlParams.set("returnUrl", redirectPathname);
  }
  authErrorArgs.forEach(([key, value]) => {
    urlParams.set(key, value);
  });
  const loginParams = urlParams.size ? `?${urlParams.toString()}` : "";
  return loginParams;
}

function useAuthErrorArgs(): [string, string][] {
  // For NextAuth, we don't need to handle auth errors in the same way
  // as Supabase, so we can simplify this
  return [];
}
