"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import React from "react";

// HeroIllustration component based on apps/web/components/sections/hero.tsx
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
        <div className="w-full h-full scale-75 sm:scale-90 md:scale-100 lg:scale-110">
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
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="components-theme min-h-screen bg-background text-foreground">
      {/* Main Hero Section */}
      <main className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <section className="pt-16 pb-24 lg:pt-24 lg:pb-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column: Text Content */}
            <div className="flex flex-col items-start text-left">
              {/* Tambo Wordmark SVG */}
              <div className="mb-8">
                <Image
                  src="/logo/wordmark/Tambo-Lockup.svg"
                  alt="Tambo Wordmark"
                  width={300}
                  height={82}
                  priority
                />
              </div>

              {/* Description */}
              <div className="mb-7 max-w-xl leading-relaxed font-heading text-foreground">
                <h2 className="mb-3 text-2xl font-bold tracking-tight">
                  The <span className="text-primary">Ultimate</span> Full-Stack
                  Tambo Starter
                </h2>
                <p className="mb-4 text-base">
                  Production-ready template with{" "}
                  <span className="text-primary font-semibold">Tambo AI</span>,{" "}
                  <span className="text-primary font-semibold">
                    Google OAuth
                  </span>
                  , and{" "}
                  <span className="text-primary font-semibold">PostgreSQL</span>
                  .
                </p>
                <ul className="space-y-2 text-sm">
                  <li>
                    <span className="font-semibold text-primary">Next.js</span>{" "}
                    • TypeScript • App Router
                  </li>
                  <li>
                    <span className="font-semibold text-primary">
                      shadcn/ui
                    </span>{" "}
                    • Tailwind CSS
                  </li>
                  <li>
                    <span className="font-semibold text-primary">Prisma</span> •
                    PostgreSQL
                  </li>
                </ul>
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-4 sm:flex-row mt-4">
                <Button
                  size="lg"
                  className="rounded-full"
                  onClick={() =>
                    signIn("google", { callbackUrl: "/dashboard" })
                  }
                >
                  Get Started
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-full"
                >
                  <Link
                    href="https://docs.tambo.co"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Documentation
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right Column: Hero Illustration */}
            <div className="relative w-full lg:w-auto">
              <div className="relative w-full aspect-square max-w-[520px] mx-auto">
                <HeroIllustration />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
