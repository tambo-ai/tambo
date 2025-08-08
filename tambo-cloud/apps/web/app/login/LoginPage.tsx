"use client";
import { NextAuthAuthForm } from "@/components/auth/nextauth-auth-form";
import { DashboardHeader } from "@/components/sections/dashboard-header";
import { useNextAuthSession } from "@/hooks/nextauth";
import { AuthProviderConfig } from "@/lib/auth-providers";
import { DashboardThemeProvider } from "@/providers/dashboard-theme-provider";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { RedirectOnUnauthenticated } from "./RedirectOnUnauthenticated";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      duration: 0.3,
    },
  },
};

const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

// Separate component that uses the useSearchParams hook
function LoginContent({ providers }: { providers: AuthProviderConfig[] }) {
  const { data: session } = useNextAuthSession();
  const returnUrl = useSearchParams().get("returnUrl") || "/dashboard";

  return (
    <motion.div
      className="container max-w-md py-8 flex items-center justify-center"
      variants={contentVariants}
    >
      <RedirectOnUnauthenticated session={session} />
      <NextAuthAuthForm routeOnSuccess={returnUrl} providers={providers} />
    </motion.div>
  );
}

// Main component with Suspense boundary
export function LoginPageBody({
  providers,
}: {
  providers: AuthProviderConfig[];
}) {
  return (
    <DashboardThemeProvider defaultTheme="light">
      <motion.div
        className="container flex flex-col min-h-screen"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <DashboardHeader />
        <motion.div className="flex-1 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <Suspense
              fallback={
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="container max-w-md py-8 flex items-center justify-center"
                >
                  Loading...
                </motion.div>
              }
            >
              <LoginContent providers={providers} />
            </Suspense>
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </DashboardThemeProvider>
  );
}
