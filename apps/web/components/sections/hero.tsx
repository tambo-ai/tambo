"use client";

import { Section } from "@/components/section";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useClipboard } from "@/hooks/use-clipboard";
import { AnimatePresence, Easing, motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import Image from "next/image";
import React from "react";
import { Button } from "../ui/button";
import { AddToIdeDropdown } from "./add-to-ide-dropdown";

const ease: Easing = [0.16, 1, 0.3, 1];

function HeroPill() {
  const [stars, setStars] = React.useState<number | null>(null);

  React.useEffect(() => {
    const fetchStars = async () => {
      try {
        const response = await fetch("/api/github-stars");
        const data = await response.json();
        setStars(data.stars);
      } catch (error) {
        console.error("Error fetching GitHub stars:", error);
        setStars(468); // Fallback value
      }
    };

    fetchStars().catch(console.error);
  }, []);

  return (
    <motion.a
      href="https://github.com/tambo-ai/tambo"
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-auto items-center space-x-2 rounded-full bg-[#5C94F7]/10 px-4 py-2 ring-1 ring-[#5C94F7]/20 hover:bg-[#5C94F7]/15 hover:ring-[#5C94F7]/30 transition-all duration-300 group shimmer-animation"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.8, ease }}
    >
      {/* Star icon */}
      <span className="text-[#5C94F7] group-hover:text-[#4A7BD6] transition-colors">
        ⭐
      </span>
      {/* Star count */}
      <span className="font-semibold text-[#5C94F7] group-hover:text-[#4A7BD6] transition-colors">
        <AnimatedCounter target={stars || 0} />
      </span>

      {/* "on GitHub" text */}
      <span className="text-[#5C94F7]/80 group-hover:text-[#4A7BD6] transition-colors font-medium">
        give us a star
      </span>

      {/* Arrow icon */}
      <svg
        width="12"
        height="12"
        className="text-[#5C94F7]/60 group-hover:text-[#4A7BD6] group-hover:translate-x-0.5 transition-all duration-300"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8.78141 5.33312L5.20541 1.75712L6.14808 0.814453L11.3334 5.99979L6.14808 11.1851L5.20541 10.2425L8.78141 6.66645H0.666748V5.33312H8.78141Z"
          fill="currentColor"
        />
      </svg>
    </motion.a>
  );
}

const words = ["assistant", "copilot", "agent"];
function HeroTitles() {
  const [currentWordIndex, setCurrentWordIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % words.length);
    }, 2000); // Change every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const wordVariants = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
  };

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
        Add React UI components to your AI{" "}
        <span className="inline-block relative align-baseline">
          <AnimatePresence mode="wait">
            <motion.span
              key={words[currentWordIndex]}
              variants={wordVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className="text-[#5C94F7]"
            >
              {words[currentWordIndex]}
            </motion.span>
          </AnimatePresence>
        </span>
      </motion.h1>
      <motion.p
        className="text-center lg:text-left max-w-xl leading-normal text-muted-foreground text-xs sm:text-sm md:text-base lg:text-lg sm:leading-normal mt-2 sm:mt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.6,
          duration: 0.8,
          ease,
        }}
      >
        An open-source AI orchestration framework for your React front end.
      </motion.p>
    </div>
  );
}

// Replace with SVG if GIF is annoying
function HeroIllustration() {
  // Add a component to detect Safari and render appropriate content
  const [isSafari, setIsSafari] = React.useState(false);
  const [videoError, setVideoError] = React.useState(false);

  React.useEffect(() => {
    // Simple Safari detection - must run in browser, so must be in useEffect
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

// New command box component
function HeroCommandBox() {
  const command = "npm create tambo-app";
  const [copied, copy] = useClipboard(command);

  const handleCopy = async () => {
    try {
      await copy();
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.6, ease: "easeOut" }}
    >
      <div
        onClick={handleCopy}
        className="flex items-center rounded-xl bg-slate-50 dark:bg-slate-900 p-3 sm:p-4 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer"
      >
        <code className="font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-200 mr-3 sm:mr-4 select-all">
          {command}
        </code>
        {/* Vertical separator line */}
        <div className="w-px h-4 sm:h-5 bg-slate-300 dark:bg-slate-600 mr-3 sm:mr-4"></div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            void handleCopy();
          }}
          className="h-auto transition-transform active:scale-95 p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.span
                key="check"
                initial={{ opacity: 0, filter: "blur(2px)", y: 4 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                exit={{ opacity: 0, filter: "blur(2px)", y: -4 }}
                transition={{ duration: 0.18, ease: "easeInOut" }}
                className="flex items-center"
              >
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ opacity: 0, filter: "blur(2px)", y: 4 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                exit={{ opacity: 0, filter: "blur(2px)", y: -4 }}
                transition={{ duration: 0.18, ease: "easeInOut" }}
                className="flex items-center"
              >
                <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-600 dark:text-slate-400" />
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </div>
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
          {/* HeroCommandBox and AddToIdeDropdown side by side on desktop, stacked on mobile */}
          <div className="flex flex-row gap-4 items-center justify-center lg:justify-start w-full">
            <HeroCommandBox />
            <AddToIdeDropdown />
          </div>
        </div>

        {/* Hero illustration */}
        <div className="w-full lg:w-1/2 aspect-square mt-2 lg:mt-0 overflow-hidden">
          <HeroIllustration />
        </div>
      </div>
    </Section>
  );
}
