"use client";
import { NextAuthAuthForm } from "@/components/auth/nextauth-auth-form";
import { DashboardHeader } from "@/components/sections/dashboard-header";
import { useNextAuthSession } from "@/hooks/nextauth";
import { AuthProviderConfig } from "@/lib/auth-providers";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import React, { Suspense } from "react";
import { RedirectOnUnauthenticated } from "./RedirectOnUnauthenticated";

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

function LoginContent({ providers }: { providers: AuthProviderConfig[] }) {
  const { data: session } = useNextAuthSession();
  const returnUrl = useSearchParams().get("returnUrl") || "/dashboard";

  return (
    <>
      <RedirectOnUnauthenticated session={session} />
      <NextAuthAuthForm routeOnSuccess={returnUrl} providers={providers} />
    </>
  );
}

function HeroIllustration() {
  const [isSafari, setIsSafari] = React.useState(false);
  const [videoError, setVideoError] = React.useState(false);

  React.useEffect(() => {
    const isSafariBrowser =
      /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
      /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsSafari(isSafariBrowser);
  }, []);

  const handleVideoError = () => {
    setVideoError(true);
  };

  const shouldUseGif = isSafari || videoError;

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <div className="w-full h-full relative">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full h-full scale-75 sm:scale-90 md:scale-100 lg:scale-110"
        >
          {shouldUseGif ? (
            <Image
              src="/assets/landing/hero/Octo-5-transparent-lossy.gif"
              alt="Tambo Octopus Animation"
              unoptimized={true}
              className="w-full h-full object-contain"
              width={1000}
              height={1000}
            />
          ) : (
            <video
              autoPlay
              loop
              muted
              playsInline
              onError={handleVideoError}
              className="w-full h-full object-contain"
              aria-label="Tambo Octopus Animation"
            >
              <source
                src="/assets/landing/hero/Octo-5-animated-vp9-small.webm"
                type="video/webm"
              />
            </video>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export function LoginPageBody({
  providers,
}: {
  providers: AuthProviderConfig[];
}) {
  return (
    <motion.div
      className="flex flex-col min-h-screen w-full bg-background"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <DashboardHeader />

      {/* Main content matching hero layout */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center w-full max-w-7xl lg:gap-6 xl:gap-12">
          {/* Left side - Auth form (matches hero text side) */}
          <motion.div
            className="flex flex-col items-center lg:items-start w-full lg:max-w-[50%]"
            variants={contentVariants}
          >
            <AnimatePresence mode="wait">
              <Suspense
                fallback={
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Loading...
                  </motion.div>
                }
              >
                <LoginContent providers={providers} />
              </Suspense>
            </AnimatePresence>
          </motion.div>

          {/* Right side - Illustration (matches hero illustration) */}
          <div className="hidden md:block w-full lg:w-1/2 aspect-square mt-8 lg:mt-0 overflow-hidden">
            <HeroIllustration />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
