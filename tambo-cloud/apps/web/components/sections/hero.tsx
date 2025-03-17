"use client";

import { CLI } from "@/components/cli";
import { Section } from "@/components/section";
import { motion } from "framer-motion";
import Link from "next/link";
import React from "react";
import { Button } from "../ui/button";

const ease = [0.16, 1, 0.3, 1];

// Hero content moved directly into this file
const heroContent = {
  pill: {
    label: "⚡️ Launching Soon",
    text: "v1.0.0",
    link: "http://localhost:3000/blog/0-1-0-announcement",
  },
  title: "An AI powered Interface in a few lines of code.",
  subtitle: "A React package for interfaces that think.",
  cta: {
    buttonText: "Request Early Access",
  },
};

function HeroPill() {
  return (
    <motion.a
      href={heroContent.pill.link}
      className="flex w-auto items-center space-x-2 rounded-full bg-[#5C94F7]/10 px-2 py-1 ring-1 ring-[#5C94F7] whitespace-pre"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease }}
    >
      <div className="w-fit rounded-full bg-[#5C94F7] px-2 py-0.5 text-left text-xs font-medium text-white sm:text-sm">
        {heroContent.pill.label}
      </div>
      <p className="text-xs font-medium text-[#5C94F7] sm:text-sm">
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
          fill="#5C94F7"
        />
      </svg>
    </motion.a>
  );
}

function HeroTitles() {
  return (
    <div className="flex flex-col items-center lg:items-start overflow-hidden pt-2 sm:pt-4 md:pt-6 lg:pt-8">
      <motion.h1
        className="text-center lg:text-left text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl font-heading leading-tight tracking-tighter text-foreground"
        initial={{ filter: "blur(10px)", opacity: 0, y: 50 }}
        animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
        transition={{
          duration: 1,
          ease,
          staggerChildren: 0.2,
        }}
      >
        {heroContent.title}
      </motion.h1>
      <motion.p
        className="text-center lg:text-left max-w-xl leading-normal text-muted-foreground text-base sm:text-lg md:text-xl sm:leading-normal mt-2 sm:mt-4"
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
  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.8, ease }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="w-full"
      >
        <CLI
          title="Bash"
          command="npx tambo --full-send"
          className="w-full max-w-full overflow-x-auto"
        />
      </motion.div>
    </motion.div>
  );
}

// Replace with SVG if GIF is annoying
function HeroIllustration() {
  // Add a component to detect Safari and render appropriate content
  const [isSafari, setIsSafari] = React.useState(false);

  React.useEffect(() => {
    // Simple Safari detection
    const isSafariBrowser =
      /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
      /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsSafari(isSafariBrowser);
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-full h-full relative scale-90 md:scale-100 lg:scale-125">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease }}
          className="w-full h-full"
        >
          {isSafari ? (
            // Safari fallback - use optimized GIF
            <img
              src="/assets/landing/hero/Octo-5-transparent-lossy.gif"
              alt="Tambo Octopus Animation"
              className="w-full h-full object-contain max-w-full scale-90 md:scale-100 lg:scale-125"
            />
          ) : (
            // Chrome, Firefox, Edge - use WebM
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-contain max-w-full scale-90 md:scale-100 lg:scale-125"
              aria-label="Tambo Octopus Animation"
            >
              <source
                src="/assets/landing/hero/webp/Octo-5-animated-vp9-small.webm"
                type="video/webm"
              />
            </video>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function HeroCTAButton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.6, ease: "easeOut" }}
    >
      <Button asChild className="mt-4 hover:scale-105 transition-transform">
        <Link href="#interactive-demo">Take Tambo for a Spin</Link>
      </Button>
    </motion.div>
  );
}

export function Hero() {
  return (
    <Section id="hero">
      {/* Main content area with titles and illustration */}
      <div className="flex flex-col lg:flex-row items-center w-full lg:gap-8 xl:gap-16 mb-4 lg:mb-8">
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left w-full lg:max-w-[50%]">
          <HeroPill />
          <HeroTitles />
          <HeroCTAButton />
        </div>

        {/* Hero illustration */}
        <div className="w-full lg:w-1/2 aspect-square mt-4 lg:mt-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="w-full h-full"
          >
            <HeroIllustration />
          </motion.div>
        </div>
      </div>

      {/* CTA section centered below 
      // Todo: Add back later?
      <div className="w-full flex justify-center mt-2 sm:mt-4 lg:mt-6">
        <div className="w-full max-w-full sm:max-w-3xl">
          <HeroCTA />
        </div>
      </div>
      */}
    </Section>
  );
}
