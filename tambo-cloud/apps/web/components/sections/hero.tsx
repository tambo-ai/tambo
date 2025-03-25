"use client";

import { CLI } from "@/components/cli";
import { Section } from "@/components/section";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Button } from "../ui/button";

const ease = [0.16, 1, 0.3, 1];

// Hero content moved directly into this file
const heroContent = {
  pill: {
    label: "⭐ Star us on",
    text: "Github",
    link: "https://github.com/tambo-ai/tambo",
  },
  title: "An AI powered Interface in a few lines of code.",
  subtitle: "Bring AI intelligence to your React stack.",
  cta: {
    buttonText: "Take tambo for a spin",
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
    <div className="flex flex-col items-center lg:items-start">
      <motion.h1
        className="text-center lg:text-left text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-heading leading-tight tracking-tighter text-foreground"
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
        className="text-center lg:text-left max-w-xl leading-normal text-muted-foreground text-sm sm:text-base md:text-lg lg:text-xl sm:leading-normal mt-2 sm:mt-4"
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
  const [videoError, setVideoError] = React.useState(false);

  React.useEffect(() => {
    // Simple Safari detection
    const isSafariBrowser =
      /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
      /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsSafari(isSafariBrowser);
  }, []);

  const handleVideoError = () => {
    setVideoError(true);
  };

  // Use the GIF fallback in case of Safari or video error
  const shouldUseGif = isSafari || videoError;

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <div className="w-full h-full relative">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease }}
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
            // Chrome, Firefox, Edge - use WebM
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

function HeroCTAButton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.6, ease: "easeOut" }}
    >
      <Button asChild className="mt-4 hover:scale-105 transition-transform">
        <Link href="#interactive-demo">{heroContent.cta.buttonText}</Link>
      </Button>
    </motion.div>
  );
}

export function Hero() {
  return (
    <Section id="hero" className="pb-8 sm:pb-4 mt-[var(--header-height)]">
      {/* Main content area with titles and illustration */}
      <div className="flex flex-col lg:flex-row items-center w-full lg:gap-6 xl:gap-12 mb-2 lg:mb-4">
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left w-full lg:max-w-[50%] space-y-4 sm:space-y-6">
          <HeroPill />
          <HeroTitles />
          <HeroCTAButton />
        </div>

        {/* Hero illustration */}
        <div className="w-full lg:w-1/2 aspect-square mt-2 lg:mt-0 overflow-hidden">
          <HeroIllustration />
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
