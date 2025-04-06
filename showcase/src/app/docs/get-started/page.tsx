"use client";

import { CLI } from "@/components/cli";
import { steps } from "@/constants/steps";
import { motion } from "framer-motion";

export default function GetStartedPage() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="font-sentient text-4xl font-bold mb-6">Get Started</h1>
        <p className="text-lg text-muted-foreground">
          Follow these steps to set up and start using Tambo components in your
          project.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {steps.map((step, index) => (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.2 }}
            key={step.number}
            className="p-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="flex items-start gap-6">
              <div className="text-lg font-mono font-bold text-muted-foreground/80 bg-primary/10 px-4 py-2 rounded-lg border-2 border-primary/30">
                {step.number}
              </div>

              <div className="flex-1">
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground mb-6">{step.description}</p>
                <p className="text-sm text-muted-foreground/80 mb-6">
                  {step.details}
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
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
