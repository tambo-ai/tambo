"use client";

import { useNextAuthSession } from "@/hooks/nextauth";
import { useAutoAcceptLegal } from "@/hooks/use-auto-accept-legal";
import {
  getAcceptedLegalVersion,
  setLegalAcceptedInBrowser,
} from "@/lib/auth-preferences";
import { api } from "@/trpc/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FC, useEffect } from "react";

interface NextAuthLayoutWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const NextAuthLayoutWrapper: FC<NextAuthLayoutWrapperProps> = ({
  children,
  fallback,
}): React.ReactNode => {
  const { data: session, status } = useNextAuthSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  // Compute return URL once for redirects
  const fullPath = search ? `${pathname}?${search}` : pathname;
  const returnUrl = encodeURIComponent(fullPath || "/dashboard");

  // Check legal acceptance status
  const { data: legalStatus } = api.user.hasAcceptedLegal.useQuery(undefined, {
    enabled: !!session && pathname !== "/legal-acceptance",
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

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.replace(`/login?returnUrl=${returnUrl}`);
      return;
    }

    // Try auto-accept if user checked checkbox before auth
    if (triggerAutoAccept()) {
      return;
    }

    // Redirect to legal acceptance if not accepted and no pending cookie
    if (shouldRedirectToLegalPage() && pathname !== "/legal-acceptance") {
      router.push(`/legal-acceptance?returnUrl=${returnUrl}`);
    }
  }, [
    session,
    status,
    router,
    pathname,
    returnUrl,
    triggerAutoAccept,
    shouldRedirectToLegalPage,
  ]);

  // Show loading state while checking session or auto-accepting legal
  if (status === "loading" || (session && !legalStatus) || isAutoAccepting) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      )
    );
  }

  // Show children if authenticated and legal accepted
  if (session && legalStatus?.accepted) {
    return <>{children}</>;
  }

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>
  );
};
