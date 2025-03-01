"use client";

import { AuroraText } from "@/components/aurora-text";
import { EmailDialog } from "@/components/email-dialog";
import { Icons } from "@/components/icons";
import { Section } from "@/components/section";
import { Button, buttonVariants } from "@/components/ui/button";
import { copy } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { lazy, Suspense, useEffect, useState } from "react";

const ease = [0.16, 1, 0.3, 1];

const heroContent = copy.hero;

function HeroPill() {
  return (
    <motion.a
      href={heroContent.pill.link}
      className="flex w-auto items-center space-x-2 rounded-full bg-primary/20 px-2 py-1 ring-1 ring-accent whitespace-pre"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease }}
    >
      <div className="w-fit rounded-full bg-accent px-2 py-0.5 text-left text-xs font-medium text-primary sm:text-sm">
        {heroContent.pill.label}
      </div>
      <p className="text-xs font-medium text-primary sm:text-sm">
        {heroContent.pill.text}
      </p>
      <svg
        width="12"
        height="12"
        className="ml-1"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8.78141 5.33312L5.20541 1.75712L6.14808 0.814453L11.3334 5.99979L6.14808 11.1851L5.20541 10.2425L8.78141 6.66645H0.666748V5.33312H8.78141Z"
          fill="hsl(var(--primary))"
        />
      </svg>
    </motion.a>
  );
}

function HeroTitles() {
  return (
    <div className="flex flex-col items-center lg:items-start overflow-hidden pt-4 sm:pt-8 lg:pt-12">
      <motion.h1
        className="text-center lg:text-left text-3xl sm:text-4xl font-semibold leading-tight sm:leading-tighter text-foreground md:text-5xl lg:text-6xl tracking-tighter"
        initial={{ filter: "blur(10px)", opacity: 0, y: 50 }}
        animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
        transition={{
          duration: 1,
          ease,
          staggerChildren: 0.2,
        }}
      >
        <motion.span
          className="inline-block text-balance"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.5,
            ease,
          }}
        >
          <AuroraText className="leading-tight sm:leading-normal">
            {heroContent.title}
          </AuroraText>
        </motion.span>
      </motion.h1>
      <motion.p
        className="text-center lg:text-left max-w-xl leading-normal text-muted-foreground text-base sm:text-lg sm:leading-normal text-balance mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.6,
          duration: 0.8,
          ease,
        }}
      >
        {heroContent.subtitle}
      </motion.p>
    </div>
  );
}

function HeroCTA() {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <div className="flex flex-col items-center lg:items-start w-full mt-8 lg:mt-12">
      <motion.div
        className="flex flex-col items-center lg:items-start w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8, ease }}
      >
        <Button
          onClick={() => setShowDialog(true)}
          className={cn(
            buttonVariants({ variant: "default" }),
            "w-full sm:w-auto text-background flex gap-2 rounded-lg py-6 sm:py-4",
          )}
        >
          <Icons.logo className="h-5 w-5 sm:h-6 sm:w-6" />
          {heroContent.cta.buttonText}
        </Button>
      </motion.div>
      <EmailDialog open={showDialog} onOpenChange={setShowDialog} />
    </div>
  );
}
const LazySpline = lazy(async () => await import("@splinetool/react-spline"));

function SplineAnimation() {
  return (
    <div className="w-full h-full">
      <LazySpline
        scene="https://prod.spline.design/mZBrYNcnoESGlTUG/scene.splinecode"
        className="w-full h-full"
      />
    </div>
  );
}

export function Hero() {
  const [_isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Use a more reliable way to detect mobile devices
    const mediaQuery = window.matchMedia("(max-width: 768px)");

    const updateIsMobile = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };

    // Initial check
    updateIsMobile(mediaQuery);

    // Add listener for changes
    mediaQuery.addEventListener("change", updateIsMobile);

    return () => mediaQuery.removeEventListener("change", updateIsMobile);
  }, []);

  return (
    <Section id="hero" className="py-8 sm:py-12 lg:py-24">
      <div className="flex flex-col lg:flex-row items-center w-full lg:gap-16">
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left lg:max-w-[640px]">
          <HeroPill />
          <HeroTitles />
          <HeroCTA />
        </div>

        {/* Hero animation */}
        <div className="hidden lg:block w-full lg:w-1/2 aspect-square mt-8 lg:mt-0">
          <Suspense
            fallback={
              <div className="w-full h-full bg-muted/10 animate-pulse rounded-lg" />
            }
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="w-full h-full"
            >
              <SplineAnimation />
            </motion.div>
          </Suspense>
        </div>
      </div>
    </Section>
  );
}
