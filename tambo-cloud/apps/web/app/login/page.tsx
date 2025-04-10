"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { useSession } from "@/hooks/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { Header } from "@/components/sections/header";

// Separate component that uses the useSearchParams hook
function LoginContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams?.get("returnUrl") || "/dashboard";

  useEffect(() => {
    // If the user is already authenticated, redirect to the return URL
    if (session) {
      router.push(returnUrl);
    }
  }, [session, router, returnUrl]);

  return (
    <div className="container max-w-md py-8">
      <AuthForm routeOnSuccess={returnUrl} />
    </div>
  );
}

// Main component with Suspense boundary
export default function LoginPage() {
  return (
    <div className="container">
      <Header showDashboardButton={false} showLogoutButton={false} />
      <Suspense
        fallback={<div className="container max-w-md py-8">Loading...</div>}
      >
        <LoginContent />
      </Suspense>
    </div>
  );
}
