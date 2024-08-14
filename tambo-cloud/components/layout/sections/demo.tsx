"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const DemoSection: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlayClick = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
      setShowControls(true);
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
      <div className="flex flex-col lg:flex-row items-center lg:items-start lg:w-[75%] lg:max-w-screen-xl gap-8 mx-auto py-12 md:py-20">
        <div className="lg:w-1/2 lg:sticky lg:top-24">
          <div className="w-full max-w-3xl rounded-3xl overflow-hidden relative pointer-events-auto shadow-[0_0_30px_rgba(210,71,191,0.3)] transition-shadow duration-300 hover:shadow-[0_0_40px_rgba(210,71,191,0.5)]">
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
                src="/videos/2024-08-09-hydra-chat-ai-grant-v2.mp4"
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
          </div>
        </div>
        <div className="lg:w-1/2 space-y-8">
          <div className="text-center lg:text-left space-y-6">
            <h2 className="text-2xl md:text-4xl font-bold">
              Curious what you can do with
              <span className="text-transparent px-2 bg-gradient-to-r from-[#D247BF] to-primary bg-clip-text">
                hydra-ai
              </span>
              ?
            </h2>
            <p className="max-w-screen-sm lg:max-w-none mx-auto text-lg text-muted-foreground">
              We&apos;re building Origin (formerly Hydra Chat) with Hydra AI,
              bringing intelligent conversations to your UI.
            </p>
          </div>
          <div className="flex justify-center lg:justify-start">
            <Button asChild className="font-bold">
              <Link href="https://useorigin.dev" target="_blank">
                Sign up for Origin
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
