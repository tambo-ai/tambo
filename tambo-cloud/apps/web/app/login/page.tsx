"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { Header } from "@/components/sections/header";
import { useSession } from "@/hooks/auth";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

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
    <motion.div
      className="container max-w-md py-8 flex items-center justify-center"
      variants={contentVariants}
    >
      <AuthForm routeOnSuccess={returnUrl} />
    </motion.div>
  );
}

// Main component with Suspense boundary
export default function LoginPage() {
  return (
    <motion.div
      className="container flex flex-col min-h-screen"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Header showDashboardButton={false} showLogoutButton={false} />
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
            <LoginContent />
          </Suspense>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
