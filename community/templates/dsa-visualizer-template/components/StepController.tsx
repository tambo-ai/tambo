"use client";

import { cn } from "@/lib/utils";
import { useTamboComponentState } from "@tambo-ai/react";
import { z } from "zod";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  ListOrdered,
} from "lucide-react";

/**
 * Schema for StepController props
 * Used by Tambo to validate and generate props
 */
export const stepControllerSchema = z.object({
  algorithmName: z
    .string()
    .describe("Name of the algorithm being stepped through"),
  totalSteps: z.number().describe("Total number of steps in the algorithm"),
  steps: z
    .array(
      z.object({
        description: z
          .string()
          .describe("Description of what happens in this step"),
        data: z
          .unknown()
          .optional()
          .describe("Optional data associated with this step"),
      }),
    )
    .describe("Array of step descriptions"),
});

export type StepControllerProps = z.infer<typeof stepControllerSchema>;

/**
 * StepController Component
 *
 * Controls step-by-step algorithm execution.
 * Uses useTamboComponentState for persistent state across messages.
 *
 * Note: This component uses Tambo's component state to persist the current step
 * across conversation turns. Users can advance through steps manually.
 */
export function StepController({
  algorithmName,
  totalSteps,
  steps,
}: StepControllerProps) {
  // Persistent state using Tambo's component state hook
  const [currentStepState, setCurrentStep] = useTamboComponentState<number>(
    "currentStep",
    0,
  );
  const [isPlayingState, setIsPlaying] = useTamboComponentState<boolean>(
    "isPlaying",
    false,
  );

  // Default values for state
  const currentStep = currentStepState ?? 0;
  const isPlaying = isPlayingState ?? false;

  const canGoBack = currentStep > 0;
  const canGoForward = currentStep < totalSteps - 1;

  const handleNext = () => {
    if (canGoForward) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (canGoBack) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  // Guard against undefined steps array
  if (!steps || steps.length === 0) {
    return (
      <div className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
          <ListOrdered className="w-4 h-4 text-[hsl(var(--primary))]" />
          <h3 className="text-sm font-semibold">Step Controller</h3>
        </div>
        <div className="p-6 text-center">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Loading steps...
          </p>
        </div>
      </div>
    );
  }

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-[hsl(var(--primary))]" />
          <h3 className="text-sm font-semibold">{algorithmName}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-xs font-mono rounded-md bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
            {currentStep + 1}/{totalSteps}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Progress bar */}
        <div className="relative">
          <div className="w-full h-2 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              Start
            </span>
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              End
            </span>
          </div>
        </div>

        {/* Current step description */}
        <div className="p-4 rounded-lg bg-[hsl(var(--muted))] border border-[hsl(var(--border))]">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center">
              <span className="text-sm font-bold text-white">
                {currentStep + 1}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm leading-relaxed">
                {currentStepData?.description || "No description available"}
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleReset}
            className={cn(
              "p-2.5 rounded-lg transition-all",
              "hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]",
            )}
            title="Reset"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={handlePrev}
            disabled={!canGoBack}
            className={cn(
              "p-2.5 rounded-lg transition-all",
              canGoBack
                ? "hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                : "text-[hsl(var(--muted-foreground))]/30 cursor-not-allowed",
            )}
            title="Previous step"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={handlePlayPause}
            className={cn(
              "p-4 rounded-full transition-all btn-glow",
              "bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90",
              "shadow-lg shadow-[hsl(var(--primary))]/20",
            )}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>

          <button
            onClick={handleNext}
            disabled={!canGoForward}
            className={cn(
              "p-2.5 rounded-lg transition-all",
              canGoForward
                ? "hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                : "text-[hsl(var(--muted-foreground))]/30 cursor-not-allowed",
            )}
            title="Next step"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-1.5 pt-2">
          {steps.slice(0, 12).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-all",
                index === currentStep
                  ? "bg-[hsl(var(--primary))] scale-125"
                  : index < currentStep
                    ? "bg-[hsl(var(--primary))]/50"
                    : "bg-[hsl(var(--muted-foreground))]/30 hover:bg-[hsl(var(--muted-foreground))]/50",
              )}
              title={`Go to step ${index + 1}`}
            />
          ))}
          {steps.length > 12 && (
            <span className="text-xs text-[hsl(var(--muted-foreground))] ml-2">
              +{steps.length - 12}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
