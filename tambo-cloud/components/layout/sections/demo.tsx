"use client";

import React, { useState, useRef, useEffect } from "react";
import { track } from "@vercel/analytics";
import { motion } from "framer-motion";

export const DemoSection: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [animationStarted, setAnimationStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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
    <section className="container w-full">
      <div className="flex flex-col items-center mx-auto py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={animationStarted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-5xl rounded-3xl overflow-hidden relative pointer-events-auto shadow-[0_0_30px_rgba(210,71,191,0.3)] transition-shadow duration-300 hover:shadow-[0_0_40px_rgba(210,71,191,0.5)]"
        >
          <video
            onClick={handleVideoClick}
            ref={videoRef}
            className={`w-full ${
              isPlaying ? "opacity-100" : "opacity-50"
            } transition-opacity duration-300`}
            autoPlay
            muted
            loop
            playsInline
            controls={showControls}
          >
            <source
              src="/videos/2024-08-26-hydra-ai-yc-demo.mp4"
              type="video/mp4"
            />
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
    </section>
  );
};
