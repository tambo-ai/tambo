"use client";

import HeaderSearch from "@/components/header-search";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatedCounter } from "./animated-counter";

export default function HeaderBar() {
  const [stars, setStars] = useState(0);

  useEffect(() => {
    async function fetchStars() {
      const res = await fetch("/api/github-stars");
      const data = await res.json();
      setStars(data.stars);
    }
    fetchStars();
  }, []);

  return (
    <div className="sticky top-0 z-[60] w-full border-b border-neutral-100 bg-transparent backdrop-blur hidden md:block">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center px-4">
        {/* Desktop Layout */}
        <div className="flex w-full items-center">
          {/* Left section - Logo */}
          <div className="flex-1 flex justify-start">
            <Link href="/" aria-label="Tambo">
              <Image
                src="/logo/lockup/Tambo-Lockup.svg"
                alt="Tambo Lockup"
                width={100}
                height={26}
                className="h-7 w-auto"
              />
            </Link>
          </div>

          {/* Center section - Search */}
          <div className="flex-1 flex justify-center">
            <div className="w-full max-w-md">
              <HeaderSearch />
            </div>
          </div>

          {/* Right section - Navigation */}
          <div className="flex-1 flex justify-end">
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="https://tambo.co/discord"
                className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                Discord
              </Link>
              <Link
                href="https://tambo.co/gh"
                className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                GitHub{" "}
                <span className="ml-1 text-sm">
                  ⭐ <AnimatedCounter target={stars} />
                </span>
              </Link>
              <Link
                href="https://tambo.co/dashboard"
                className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
