"use client";

import HeaderSearch from "@/components/header-search";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatedCounter } from "./animated-counter";

export default function HeaderBar() {
  const [stars, setStars] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchStars() {
      const res = await fetch("/api/github-stars");
      const data = await res.json();
      setStars(data.stars);
    }
    fetchStars();
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (mobileMenuOpen) {
      const handleClick = () => setMobileMenuOpen(false);
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [mobileMenuOpen]);

  return (
    <div className="sticky top-0 z-[60] w-full border-b border-neutral-100 bg-transparent backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center px-4">
        {/* Mobile Layout */}
        <div className="flex md:hidden w-full items-center justify-between">
          {/* Logo */}
          <Link href="/" aria-label="Tambo">
            <Image
              src="/logo/lockup/Tambo-Lockup.svg"
              alt="Tambo Lockup"
              width={80}
              height={21}
              className="h-6 w-auto"
            />
          </Link>

          {/* Menu Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Desktop Layout - unchanged */}
        <div className="hidden md:flex w-full items-center">
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

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-100">
          <nav className="flex flex-col py-2">
            <Link
              href="https://tambo.co/discord"
              className="px-4 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Discord
            </Link>
            <Link
              href="https://tambo.co/gh"
              className="px-4 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground flex items-center justify-between"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>GitHub</span>
              {/* Show static number on mobile to avoid animation issues */}
              <span className="text-sm">⭐ {stars.toLocaleString()}</span>
            </Link>
            <Link
              href="https://tambo.co/dashboard"
              className="px-4 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
