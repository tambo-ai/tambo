"use client";

import { cn } from "@/lib/utils";
import { Check, List, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export type GenerationStage = "planning" | "drafting" | "syncing" | "finalizing" | "completed";

interface StageItem {
  id: GenerationStage;
  label: string;
}

const STAGES: StageItem[] = [
  { id: "planning", label: "Planning" },
  { id: "drafting", label: "Drafting Content" },
  { id: "syncing", label: "Syncing to Sanity" },
  { id: "finalizing", label: "Finalizing" },
];

interface GenerationStatusProps {
  isVisible: boolean;
  onComplete?: () => void;
}

export function GenerationStatus({ isVisible, onComplete }: GenerationStatusProps) {
  const [currentStage, setCurrentStage] = useState<GenerationStage>("planning");

  useEffect(() => {
    if (!isVisible) {
      setCurrentStage("planning");
      return;
    }

    // Simulate progress
    const timings = [
      { stage: "drafting", delay: 1500 },
      { stage: "syncing", delay: 3500 },
      { stage: "finalizing", delay: 5000 },
      { stage: "completed", delay: 6000 },
    ];

    const timeouts: NodeJS.Timeout[] = [];

    timings.forEach(({ stage, delay }) => {
      const timeout = setTimeout(() => {
        setCurrentStage(stage as GenerationStage);
        if (stage === "completed" && onComplete) {
            onComplete();
        }
      }, delay);
      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  const currentStageIndex = STAGES.findIndex((s) => s.id === currentStage);
  const isAllComplete = currentStage === "completed";

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-[4px] border border-zinc-800 bg-linear-to-br from-[#0d0e0e] via-[#111212] to-[#0d0e0e] bg-[#0A0C0D] text-zinc-300 select-none shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="px-5 pt-4 flex items-center gap-x-2 text-zinc-200/90">
        <List className="w-4 h-4" />
        <div className="text-sm font-medium tracking-wide">Execution strategy</div>
      </div>

      {/* Steps List */}
      <div className="relative z-10 w-full flex flex-col gap-y-3 px-5 py-4.5 mb-2 mt-2">
        {STAGES.map((stage, index) => {
          let status: "completed" | "active" | "pending" = "pending";
          
          if (isAllComplete || index < (currentStageIndex === -1 ? STAGES.length : currentStageIndex)) {
            status = "completed";
          } else if (index === currentStageIndex) {
            status = "active";
          }
           
          const isCompleted = status === "completed";
          const isActive = status === "active";
          const isPending = status === "pending";

          return (
            <div key={stage.id} className="flex items-start gap-x-3 transition-all duration-300">
              {/* Icon Container */}
              <div
                className={cn(
                  "flex items-center justify-center rounded-full transition-all duration-300",
                  isCompleted && "border border-emerald-600/50 bg-emerald-500/10 text-emerald-500 w-4 h-4 p-0.5",
                  isActive && "w-4 h-4",
                  isPending && "border border-zinc-800 bg-zinc-900 w-4 h-4 p-0.5"
                )}
              >
                {isActive ? (
                  <Loader2 className="w-3.5 h-3.5 text-zinc-400 animate-spin" />
                ) : isCompleted ? (
                   <Check className="w-2.5 h-2.5 stroke-[3]" />
                ) : null}
              </div>

              {/* Label */}
              <div className="flex flex-col gap-y-1">
                <div
                  className={cn(
                    "tracking-wide text-[13px] transition-colors duration-300",
                    isPending && "opacity-40 text-zinc-500",
                    isCompleted && "text-zinc-400/80 line-through decoration-zinc-800",
                    isActive && "text-zinc-200 font-medium"
                  )}
                >
                  {stage.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Footer */}
      {isAllComplete && (
         <div className="px-5 pb-4 flex items-center gap-x-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="text-emerald-500">
               <Check className="w-4 h-4" />
            </div>
            <div className="text-zinc-400 tracking-wider text-[13px]">
               Completed
            </div>
         </div>
      )}
    </div>
  );
}
