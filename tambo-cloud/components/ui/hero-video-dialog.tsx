"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play } from "lucide-react";
import { track } from "@vercel/analytics";

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
  className?: string;
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
  className,
}: HeroVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [animationStarted, setAnimationStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const selectedAnimation = animationVariants[animationStyle];

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationStarted(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handlePlayClick = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      videoRef.current.muted = false;
      setIsPlaying(true);
      setShowControls(true);
      track("Video Play");
    }
  };

  const handleVideoClick = () => {
    if (isPlaying) {
      setShowControls(!showControls);
    } else {
      handlePlayClick();
    }
  };

  return (
    <div className={cn("relative", className)}>
      <motion.div
        {...selectedAnimation}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="rounded-3xl overflow-hidden relative pointer-events-auto shadow-[0_0_30px_rgba(210,71,191,0.3)] transition-shadow duration-300 hover:shadow-[0_0_40px_rgba(210,71,191,0.5)]"
      >
        <video
          ref={videoRef}
          onClick={handleVideoClick}
          className={`w-full ${
            isPlaying ? "opacity-100" : "opacity-50"
          } transition-opacity duration-300`}
          autoPlay
          muted
          loop
          playsInline
          controls={showControls}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
        {!isPlaying && (
          <button
            onClick={handlePlayClick}
            className={`absolute inset-0 w-full h-full flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-20 transition-all duration-300 ${
              isPlaying ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            <svg
              className="w-20 h-20 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </motion.div>
    </div>
  );
}
