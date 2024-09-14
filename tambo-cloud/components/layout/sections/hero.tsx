"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useTheme } from "next-themes";
import Terminal from "@/components/terminal";
import { track } from "@vercel/analytics";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

import Link from "next/link";

export const HeroSection = () => {
  const { theme } = useTheme();
  const [currentWord, setCurrentWord] = useState(0);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const words = ["adaptive", "smart", "contextual"];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % words.length);
      setIsFirstLoad(false);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const wordVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <section className="container w-full">
      <div className="grid place-items-center lg:max-w-screen-xl gap-8 mx-auto py-20 md:py-32">
        <div className="text-center space-y-8">
          <Badge variant="outline" className="text-sm py-2">
            <span className="mr-2 text-primary">
              <Badge>New</Badge>
            </span>
            <span> Version 0.0.17 out now!</span>
          </Badge>

          <div className="max-w-screen-md mx-auto text-center text-4xl md:text-6xl font-bold">
            <h1>
              Install{" "}
              {isFirstLoad ? (
                "adaptive"
              ) : (
                <AnimatePresence mode="wait">
                  <motion.span
                    key={words[currentWord]}
                    variants={wordVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.5 }}
                  >
                    {words[currentWord]}
                  </motion.span>
                </AnimatePresence>
              )}{" "}
              UI with
              <span className="text-transparent px-2 bg-gradient-to-r from-[#D247BF] to-primary bg-clip-text">
                hydra-ai
              </span>
            </h1>
          </div>

          <p className="max-w-screen-sm mx-auto text-xl text-muted-foreground">
            {`Improve your UX with AI-driven React components.`}
          </p>
          <Terminal command="npm i hydra-ai" />
          <div className="space-y-4 md:space-y-0 md:space-x-4">
            <Link
              href="https://discord.gg/dJNvPEHth6"
              target="_blank"
              onClick={() => track("Discord Join Clicked")}
            >
              <Button className="w-5/6 md:w-1/4 font-bold group/arrow">
                Join our Discord
                <ArrowRight className="size-5 ml-2 group-hover/arrow:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <Button
              asChild
              variant="secondary"
              className="w-5/6 md:w-1/4 font-bold"
              onClick={() => track("View Github")}
            >
              <Link
                href="https://github.com/michaelmagan/hydraai"
                target="_blank"
              >
                Check out our Github
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
