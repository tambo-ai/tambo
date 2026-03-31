"use client";

import { useNextAuthSession, useSignOut } from "@/hooks/nextauth";
import { useAutoAcceptLegal } from "@/hooks/use-auto-accept-legal";
import {
  getAcceptedLegalVersion,
  setLegalAcceptedInBrowser,
} from "@/lib/auth-preferences";
import { api } from "@/trpc/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FC, useEffect, useRef } from "react";

interface NextAuthLayoutWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const NextAuthLayoutWrapper: FC<NextAuthLayoutWrapperProps> = ({
  children,
  fallback,
}): React.ReactNode => {
  const { data: session, status } = useNextAuthSession();
  const signOut = useSignOut();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const isSigningOut = useRef(false);

  // Compute return URL once for redirects
  const fullPath = search ? `${pathname}?${search}` : pathname;
  const returnUrl = encodeURIComponent(fullPath || "/");

  // Detect legacy sessions missing the userToken (added during the
  // userToken auth migration). These sessions are valid NextAuth JWTs but
  // lack the token the SDK needs for API calls. Force re-auth so the JWT
  // callback can populate it on the next sign-in.
  const isLegacySession = !!session && !session.user?.userToken;

  // Check legal acceptance status
  const { data: legalStatus } = api.user.hasAcceptedLegal.useQuery(undefined, {
    enabled: !!session && !isLegacySession && pathname !== "/legal-acceptance",
  });

  // Check onboarding completion status
  const { data: hasCompletedOnboarding } =
    api.user.hasCompletedOnboarding.useQuery(undefined, {
      enabled:
        !!session &&
        !isLegacySession &&
        !!legalStatus?.accepted &&
        pathname !== "/onboarding",
    });

  // Hook for auto-accepting legal terms from pre-auth checkbox
  const { isAutoAccepting, triggerAutoAccept, shouldRedirectToLegalPage } =
    useAutoAcceptLegal(legalStatus);

  // Sync localStorage for existing users who already accepted legal in DB
  // This ensures returning users don't see the checkbox on future logins
  // Also updates stored version when user accepts a newer version
  useEffect(() => {
    if (legalStatus?.accepted && legalStatus.version) {
      const storedVersion = getAcceptedLegalVersion();
      // Sync when no version stored or when server has newer version
      if (!storedVersion || storedVersion < legalStatus.version) {
        setLegalAcceptedInBrowser();
      }
    }
  }, [legalStatus?.accepted, legalStatus?.version]);

  // Sign out legacy sessions and redirect to login with an explanatory error
  useEffect(() => {
    if (!isLegacySession || isSigningOut.current) {
      return;
    }
    isSigningOut.current = true;
    void signOut({
      callbackUrl: `/login?returnUrl=${returnUrl}&error=SessionExpired`,
    });
  }, [isLegacySession, signOut, returnUrl]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.replace(`/login?returnUrl=${returnUrl}`);
      return;
    }

    if (isLegacySession) return;

    // Try auto-accept if user checked checkbox before auth
    if (triggerAutoAccept()) {
      return;
    }

    // Redirect to legal acceptance if not accepted and no pending cookie
    if (shouldRedirectToLegalPage() && pathname !== "/legal-acceptance") {
      router.push(`/legal-acceptance?returnUrl=${returnUrl}`);
      return;
    }

    // Redirect to onboarding if not completed
    if (
      legalStatus?.accepted &&
      hasCompletedOnboarding === false &&
      pathname !== "/onboarding"
    ) {
      router.push("/onboarding");
    }
  }, [
    session,
    status,
    router,
    pathname,
    returnUrl,
    isLegacySession,
    triggerAutoAccept,
    shouldRedirectToLegalPage,
    legalStatus?.accepted,
    hasCompletedOnboarding,
  ]);

  // Show loading state while checking session or auto-accepting legal
  if (
    status === "loading" ||
    (session && !legalStatus) ||
    isAutoAccepting ||
    (session &&
      legalStatus?.accepted &&
      hasCompletedOnboarding === undefined &&
      pathname !== "/onboarding")
  ) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      )
    );
  }

  // Show children if authenticated, legal accepted, and onboarding completed
  if (
    session &&
    legalStatus?.accepted &&
    (hasCompletedOnboarding === true || pathname === "/onboarding")
  ) {
    return <>{children}</>;
  }

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>
  );
};
