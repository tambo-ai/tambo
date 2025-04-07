"use client";

import { CLI } from "@/components/cli";
import { steps } from "@/constants/steps";

export default function GetStartedPage() {
  return (
    <div className="p-4 md:p-8 max-w-[900px] mx-auto">
      <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4 font-sentient">
        Get Started
      </h1>
      <p className="text-base md:text-lg text-muted-foreground mb-8">
        Follow these steps to get started with tambo-ai.
      </p>

      {steps.map((step) => (
        <div key={step.number} className="mb-8 pb-8 border-b last:border-b-0">
          <h3 className="text-lg sm:text-xl font-medium mb-2">
            {step.number}: {step.title}
          </h3>
          <p className="text-sm md:text-base text-muted-foreground mb-4">
            {step.description}
          </p>
          <div className="bg-slate-800 rounded-lg">
            <CLI
              command={step.code}
              path={step.path}
              isCode={step.isCode}
              language={step.language}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
