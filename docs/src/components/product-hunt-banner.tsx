"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, X } from "lucide-react";
import Image from "next/image";
import { FC, useEffect, useRef, useState } from "react";
import {
  PRODUCT_HUNT_BANNER_DISMISS_KEY,
  getProductHuntUrl,
} from "@/lib/product-hunt";

export const ProductHuntBanner: FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  const productHuntUrl = getProductHuntUrl();

  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const update = () => {
      const h = isVisible ? (bannerRef.current?.offsetHeight ?? 48) : 0;
      root.style.setProperty("--banner-height", `${h}px`);
    };

    update();

    const ro = bannerRef.current ? new ResizeObserver(update) : undefined;
    if (bannerRef.current && ro) ro.observe(bannerRef.current);
    window.addEventListener("resize", update);

    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", update);
      root.style.setProperty("--banner-height", "0px");
    };
  }, [isVisible]);

  useEffect(() => {
    // Only check on client side
    if (typeof window === "undefined") return;

    try {
      const dismissed =
        window.sessionStorage.getItem(PRODUCT_HUNT_BANNER_DISMISS_KEY) === "1";
      setIsVisible(!dismissed);
    } catch {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(PRODUCT_HUNT_BANNER_DISMISS_KEY, "1");
      }
    } catch {
      // SessionStorage might be blocked - continue anyway
    }
    setIsVisible(false);
  };

  const handleUpvote = () => {
    window.open(productHuntUrl, "_blank", "noopener,noreferrer");
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full relative z-[70]"
        role="banner"
        aria-label="Product Hunt launch announcement"
      >
        <div className="w-full ring-1 ring-orange-400/20 bg-gradient-to-r from-orange-50/80 to-red-50/80 backdrop-blur">
          <div className="mx-auto max-w-[1400px] px-4 py-3 relative">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <span className="flex-shrink-0">
                <Image
                  src="/product-hunt-logo.png"
                  alt="Product Hunt"
                  width={16}
                  height={16}
                  className="w-6 h-6"
                />
              </span>
              <span className="text-xs sm:text-sm font-medium text-orange-700 text-center">
                <span className="hidden sm:inline">
                  We&apos;re live on Product Hunt! Help us reach more
                  developers.
                </span>
                <span className="sm:hidden">Live on Product Hunt!</span>
              </span>
              <button
                onClick={handleUpvote}
                className="inline-flex items-center gap-1.5 rounded-md border border-orange-500/40 text-orange-700 bg-orange-100/50 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium hover:bg-orange-200/50 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
                aria-label="Upvote on Product Hunt"
              >
                <span>Upvote</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="absolute cursor-pointer right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-orange-600 hover:bg-orange-200/50 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
              aria-label="Dismiss banner"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
