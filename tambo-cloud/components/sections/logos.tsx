"use client";

import { Section } from "@/components/section";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

const companies = [
  "Google",
  "Microsoft",
  "Amazon",
  "Netflix",
  "YouTube",
  "Instagram",
];

const companies2 = ["Spotify", "Dropbox", "Tinder", "Slack", "Zoom", "Shopify"];

export function Logos() {
  const [currentSet, setCurrentSet] = useState(companies);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSet((prev) => (prev === companies ? companies2 : companies));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Section id="logos">
      <div className="border-x border-t">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
          {companies.map((_, idx) => (
            <div
              key={idx}
              className="flex group items-center justify-center p-4 border-r border-t last:border-r-0 sm:last:border-r md:[&:nth-child(3n)]:border-r md:[&:nth-child(6n)]:border-r-0 md:[&:nth-child(3)]:border-r [&:nth-child(-n+2)]:border-t-0 sm:[&:nth-child(-n+3)]:border-t-0 sm:[&:nth-child(3n)]:border-r-0 md:[&:nth-child(-n+6)]:border-t-0 [&:nth-child(2n)]:border-r-0 sm:[&:nth-child(2n)]:border-r"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSet[idx]}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    duration: 0.5,
                    ease: "easeInOut",
                    delay: Math.random() * 0.5,
                  }}
                >
                  <Image
                    width={112}
                    height={40}
                    src={`https://cdn.magicui.design/companies/${currentSet[idx]}.svg`}
                    className="h-10 w-28 dark:brightness-0 dark:invert grayscale hover:grayscale-0 hover:brightness-100 dark:hover:brightness-0 dark:hover:invert transition-all duration-200 ease-out opacity-30 hover:opacity-100"
                    alt={currentSet[idx]}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
