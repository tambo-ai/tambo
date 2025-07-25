"use client";

import { useNextAuthSession } from "@/hooks/nextauth";
import { useRouter } from "next/navigation";
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

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (!session) {
      // No session, redirect to login
      router.push("/login");
    }
  }, [session, status, router]);

  // Show loading state while checking session
  if (status === "loading") {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      )
    );
  }

  // Show children if authenticated
  if (session) {
    return <>{children}</>;
  }

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>
  );
};
