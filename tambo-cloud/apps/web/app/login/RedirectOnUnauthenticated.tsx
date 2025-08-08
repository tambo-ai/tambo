"use client";
import { Session } from "next-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

function useRedirectOnUnauthenticated(session: Session | null) {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";
  const router = useRouter();
  useEffect(() => {
    // If the user is already authenticated, redirect to the return URL
    if (session) {
      router.push(returnUrl);
    }
  }, [session, router, returnUrl]);
}

export function RedirectOnUnauthenticated({
  session,
}: {
  session: Session | null;
}) {
  useRedirectOnUnauthenticated(session);
  return null;
}
