"use client";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export const LiveDemoSection = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

  const handleLiveDemoClick = () => {
    track("Live Demo Clicked");
  };

  const floatUpVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  return (
    <section className="container w-full" ref={sectionRef}>
      <div className="grid place-items-center lg:max-w-screen-xl gap-8 mx-auto py-20 md:py-32">
        <motion.div
          className="text-center space-y-8"
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={floatUpVariants}
        >
          <motion.div
            className="max-w-screen-md mx-auto text-center text-4xl md:text-6xl font-bold"
            variants={floatUpVariants}
          >
            <h2>
              Try out our
              <span className="text-transparent px-2 bg-gradient-to-r from-[#D247BF] to-primary bg-clip-text">
                live demo
              </span>
              of Hydra AI
            </h2>
          </motion.div>

          <motion.p
            className="max-w-screen-sm mx-auto text-xl text-muted-foreground"
            variants={floatUpVariants}
          >
            Chat with 4500+ YC company data.
          </motion.p>

          <motion.div variants={floatUpVariants}>
            <Link
              href="https://yage.usehydra.ai"
              target="_blank"
              onClick={handleLiveDemoClick}
            >
              <Button className="w-5/6 md:w-1/3 font-bold group/arrow">
                Try Live Demo
                <ArrowRight className="size-5 ml-2 group-hover/arrow:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
