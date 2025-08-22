"use client";

import { track } from "@vercel/analytics";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type AnimationStyle =
  | "from-bottom"
  | "from-center"
  | "from-top"
  | "from-left"
  | "from-right"
  | "fade"
  | "top-in-bottom-out"
  | "left-in-right-out";

interface HeroVideoProps {
  animationStyle?: AnimationStyle;
  videoSrc: string;
  darkModeVideoSrc?: string;
  className?: string;
  theme?: "light" | "dark" | "system";
}

const animationVariants = {
  "from-bottom": {
    initial: { y: "100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0 },
  },
  "from-center": {
    initial: { scale: 0.5, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.5, opacity: 0 },
  },
  "from-top": {
    initial: { y: "-100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "-100%", opacity: 0 },
  },
  "from-left": {
    initial: { x: "-100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "-100%", opacity: 0 },
  },
  "from-right": {
    initial: { x: "100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  "top-in-bottom-out": {
    initial: { y: "-100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0 },
  },
  "left-in-right-out": {
    initial: { x: "-100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
  },
};

export default function HeroVideoDialog({
  animationStyle = "from-center",
  videoSrc,
  darkModeVideoSrc,
  className,
  theme = "system",
}: HeroVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const selectedAnimation = animationVariants[animationStyle];
  const { theme: systemTheme } = useTheme();

  const effectiveTheme = theme === "system" ? systemTheme : theme;
  const currentVideoSrc =
    effectiveTheme === "dark" && darkModeVideoSrc ? darkModeVideoSrc : videoSrc;

  // Auto-play muted on mount
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.error("Failed to autoplay video:", error);
        // Don't set video error here, just log it
      });
    }
  }, [currentVideoSrc]);

  const handlePlayClick = async () => {
    if (!videoRef.current) return;

    try {
      videoRef.current.currentTime = 0;
      videoRef.current.muted = false;
      await videoRef.current.play();
      setIsPlaying(true);
      setShowControls(true);
      track("Video Play", { src: currentVideoSrc });
    } catch (error) {
      console.error("Failed to play video:", error);
      setVideoError(true);
    }
  };

  const handleVideoClick = async () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      setShowControls(!showControls);
    } else {
      await handlePlayClick();
    }
  };

  const handleVideoError = () => {
    setVideoError(true);
    console.error(`Failed to load video: ${currentVideoSrc}`);
  };

  if (videoError) {
    return (
      <div
        className={cn(
          "relative bg-muted rounded-2xl p-8 text-center",
          className,
        )}
      >
        <p className="text-muted-foreground">Failed to load video</p>
      </div>
    );
  }

  return (
    <div className={cn("relative group w-full", className)}>
      <motion.div
        {...selectedAnimation}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="overflow-hidden relative rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 w-full aspect-[1.44/1] bg-background"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-transparent pointer-events-none z-10" />
        <video
          ref={videoRef}
          onClick={handleVideoClick}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
            isPlaying ? "opacity-100" : "opacity-90",
          )}
          muted
          loop
          playsInline
          controls={showControls}
          onError={handleVideoError}
          preload="auto"
          autoPlay
        >
          <source src={currentVideoSrc} type="video/mp4" />
        </video>
        {!isPlaying && (
          <button
            onClick={handlePlayClick}
            className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/20 hover:bg-black/10 transition-colors duration-300 z-20"
            aria-label="Play video"
          >
            <div className="flex items-center justify-center animate-pulse">
              <svg
                className="w-16 h-16 text-primary"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </button>
        )}
      </motion.div>
    </div>
  );
}
