"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, Easing, motion } from "framer-motion";
import { X } from "lucide-react";
import Link from "next/link";
import { FC, useEffect, useState } from "react";

interface TamboHackBannerProps {
  className?: string;
}

const ease: Easing = [0.16, 1, 0.3, 1];
const STORAGE_KEY = "tambohack_banner_dismissed_session";

export const TamboHackBanner: FC<TamboHackBannerProps> = ({ className }) => {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed =
        typeof window !== "undefined" &&
        window.sessionStorage.getItem(STORAGE_KEY) === "1";
      setIsVisible(!dismissed);
    } catch {
      setIsVisible(true);
    } finally {
      setMounted(true);
    }
  }, []);

  const handleDismiss = () => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setIsVisible(false);
  };

  if (!mounted) return null;

  return (
    <AnimatePresence initial={false}>
      {isVisible && (
        <motion.div
          key="tambohack-banner"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.5, ease }}
          className={cn("w-full relative z-[70]", className)}
        >
          <div className="w-full ring-1 ring-[#5C94F7]/20 bg-[#5C94F7]/10 backdrop-blur">
            <div className="mx-auto max-w-[1400px] px-4 py-3 relative">
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <span className="text-xs sm:text-sm font-medium text-[#5C94F7] text-center">
                  <span className="hidden sm:inline">
                    Join TamboHack $10k in grants for builders &amp;
                    contributors.
                  </span>
                  <span className="sm:hidden">
                    Join TamboHack $10k in grants
                  </span>
                </span>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    aria-label="Join TamboHack"
                    className="inline-flex items-center rounded-md border border-[#5C94F7]/40 text-[#5C94F7] px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium hover:bg-[#5C94F7]/10 transition-colors whitespace-nowrap"
                  >
                    <Link
                      href="/hack"
                      aria-label="Join TamboHack"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Join Now
                    </Link>
                  </Button>
                </motion.div>
              </div>

              <motion.button
                type="button"
                aria-label="Dismiss banner"
                onClick={handleDismiss}
                whileTap={{ scale: 0.94 }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#5C94F7] hover:bg-[#5C94F7]/10 transition-colors"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
