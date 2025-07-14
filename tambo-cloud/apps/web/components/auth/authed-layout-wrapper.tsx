"use client";

import { getSupabaseClient } from "@/app/utils/supabase";
import { useSession } from "@/hooks/auth";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function AuthedLayoutWrapper({
  children,
  hasSession: initialHasSession,
}: {
  children: React.ReactNode;
  hasSession: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code");
  const { data: session, isLoading: isSessionLoading } = useSession();

  // Use client-side session info when available, fallback to server-provided status when loading
  const hasValidSession =
    session !== null || (initialHasSession && isSessionLoading);

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const loginParams = useLoginParams(pathname);

  useEffect(() => {
    async function handleAuth() {
      // If there's an auth code in the URL, exchange it for a session
      if (code) {
        try {
          await getSupabaseClient().auth.exchangeCodeForSession(code);
          // Refresh the page without the code parameter to load with the new session
          router.replace(pathname);
        } catch (error) {
          console.error("Failed to exchange code for session:", error);
          setAuthError("Authentication failed. Please try logging in again.");
          router.replace(`/login${loginParams}`);
        }
        return;
      }

      // If no session, redirect to login
      if (!hasValidSession) {
        router.replace(`/login${loginParams}`);
      } else {
        // Auth check complete, we can render the content
        setIsCheckingAuth(false);
      }
    }

    handleAuth();

    // Setup auth state listener
    const {
      data: { subscription },
    } = getSupabaseClient().auth.onAuthStateChange((_event, session) => {
      // If user signs out, redirect to login
      if (!session) {
        router.replace(`/login${loginParams}`);
      }
    });

    return () => subscription.unsubscribe();
  }, [hasValidSession, pathname, code, router, isSessionLoading, loginParams]);

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse h-8 w-8 rounded-full bg-background" />
      </div>
    );
  }

  // Show error message if authentication failed
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          {authError}
        </div>
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
  const searchParams = useSearchParams();
  if (
    searchParams.get("error") &&
    searchParams.get("error_code") &&
    searchParams.get("error_description")
  ) {
    return [
      ["error", searchParams.get("error")!],
      ["error_code", searchParams.get("error_code")!],
      ["error_description", searchParams.get("error_description")!],
    ];
  }
  return [];
}
