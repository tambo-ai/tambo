"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, X } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import type { FC } from "react";
import { getProductHuntUrl } from "@/lib/product-hunt";

interface ProductHuntThoughtBubbleProps {
  isOpen: boolean;
  onDismiss: () => void;
}

export const ProductHuntThoughtBubble: FC<ProductHuntThoughtBubbleProps> = ({
  isOpen,
  onDismiss,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const productHuntUrl = getProductHuntUrl();

  const handleClick = () => {
    window.open(productHuntUrl, "_blank", "noopener,noreferrer");
    onDismiss();
  };

  // Don't show if the main panel is open
  if (isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        transition={{
          duration: 0.4,
          ease: [0.16, 1, 0.3, 1],
          type: "spring",
          damping: 20,
        }}
        // Adjusted positioning to stay within viewport
        className="fixed bottom-24 right-6 z-[60] pointer-events-none"
      >
        {/* Thought bubble tail pointing down to chat button */}
        <div
          className="absolute -bottom-3 right-6 pointer-events-none"
          aria-hidden="true"
        >
          <svg
            width="20"
            height="18"
            viewBox="0 0 20 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M 10 0 Q 8 4, 12 8 Q 10 6, 6 6 Z"
              fill="white"
              className="drop-shadow-sm"
            />
          </svg>
        </div>

        {/* Main bubble - adjusted width for better viewport fit */}
        <motion.div
          animate={{
            y: isHovered ? -4 : 0,
            transition: { duration: 0.2 },
          }}
          className="relative bg-white rounded-2xl shadow-lg ring-1 ring-gray-200/50 p-4 w-[250px] sm:w-[280px] pointer-events-auto border-2 border-orange-500"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="absolute cursor-pointer -top-2 -right-2 p-1 rounded-full bg-white shadow-md text-orange-700 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
            aria-label="Dismiss notification"
          >
            <X className="h-3 w-3" />
          </button>

          {/* Content */}
          <div
            className="flex flex-col gap-3 cursor-pointer"
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleClick();
              }
            }}
          >
            {/* Header with logo */}
            <div className="flex items-center gap-2">
              <Image
                src="/product-hunt-logo.png"
                alt="Product Hunt"
                width={24}
                height={24}
                className="w-6 h-6 flex-shrink-0"
              />
              <span className="font-semibold text-sm text-gray-900">
                We&apos;re live on Product Hunt!
              </span>
            </div>

            {/* Message */}
            <p className="text-xs text-gray-600 leading-relaxed">
              Help us reach more developers by giving us an upvote. Your support
              means the world! 🚀
            </p>

            {/* CTA */}
            <motion.div
              className="flex items-center justify-between"
              whileHover={{ x: 2 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-xs font-medium text-orange-600 flex items-center gap-1">
                Upvote now
                <ExternalLink className="w-3 h-3" />
              </span>
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "loop",
                }}
                className="text-lg"
              >
                👍
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Optional: Additional floating bubbles for effect */}
        <motion.div
          className="absolute -top-6 right-4"
          animate={{
            y: [0, -3, 0],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "loop",
          }}
        >
          <div className="w-2 h-2 bg-white/80 rounded-full shadow-sm" />
        </motion.div>
        <motion.div
          className="absolute -top-10 right-10"
          animate={{
            y: [0, -2, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            repeatType: "loop",
            delay: 0.5,
          }}
        >
          <div className="w-1.5 h-1.5 bg-white/60 rounded-full shadow-sm" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
