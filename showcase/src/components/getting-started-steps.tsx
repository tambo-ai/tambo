"use client";

import { CLI } from "@/components/cli";
import { steps } from "@/constants/steps";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";

export function GettingStartedSteps() {
  const stepsRef = useRef<HTMLDivElement>(null);

  const scrollToSteps = () => {
    stepsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div>
      {/* Hero Section - Full height viewport */}
      <div className="h-screen flex flex-col items-center px-4 relative pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="font-sentient text-3xl md:text-5xl font-bold max-w-[900px] mx-auto mt-24 leading-[1.5] md:leading-[1.5]">
            Tambo components to jumpstart your AI interface development
          </h1>
          <p className="font-sentient text-lg md:text-xl text-muted-foreground/90 max-w-[800px] mx-auto leading-relaxed mt-4">
            A collection of ready-to-use AI components hooked up to Tambo.
          </p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="flex flex-col sm:flex-row gap-6 justify-center mt-16"
          >
            <Link
              href="/components-page"
              className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-8 py-4 text-lg font-medium hover:bg-primary/90 hover:scale-105 transition-all duration-300"
            >
              Browse Components
            </Link>
            <Link
              href="https://tambo.co/docs"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-8 py-4 text-lg font-medium hover:bg-accent hover:scale-105 transition-all duration-300"
            >
              Read Documentation
            </Link>
          </motion.div>

          {/* Get Started Button with Animated Arrow */}
          <div className="flex justify-center w-full">
            <motion.button
              onClick={scrollToSteps}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.5 }}
              className="mt-24 flex flex-col items-center gap-8 group cursor-pointer"
            >
              <span className="text-lg font-medium text-muted-foreground group-hover:text-primary transition-colors">
                Get started
              </span>
              <div className="flex flex-col gap-1">
                <motion.div
                  animate={{ y: [0, 12, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="flex flex-col items-center"
                >
                  <div className="w-[2px] h-6 bg-muted-foreground group-hover:bg-primary transition-colors -mb-4" />
                  <div className="w-4 h-4 border-b-2 border-r-2 border-muted-foreground group-hover:border-primary rotate-45 transition-colors" />
                </motion.div>
              </div>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Steps Section */}
      <div ref={stepsRef} className="w-full max-w-6xl mx-auto px-4 py-24">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-sentient text-3xl md:text-4xl font-bold text-center mb-16"
        >
          Steps to Get Started
        </motion.h2>

        <div className="grid grid-cols-1 gap-12">
          {steps.map((step, index) => (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              key={step.number}
              className="p-10 rounded-xl bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex items-start gap-6">
                <div className="text-lg font-mono font-bold text-muted-foreground/80 bg-primary/10 px-4 py-2 rounded-lg border-2 border-primary/30">
                  {step.number}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                  <p className="text-lg text-muted-foreground mb-6">
                    {step.description}
                  </p>
                  <div className="mb-6">
                    <CLI
                      command={step.code}
                      path={step.path}
                      background="#1A1A1A"
                      isCode={step.isCode}
                      language={step.language}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground/80">
                    {step.details}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
