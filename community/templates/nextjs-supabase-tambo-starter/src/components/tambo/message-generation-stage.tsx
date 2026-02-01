"use client";

import { cn } from "@/lib/utils";
import { type GenerationStage, useTambo } from "@tambo-ai/react";
import { Loader2Icon } from "lucide-react";
import * as React from "react";

export interface GenerationStageProps
  extends React.HTMLAttributes<HTMLDivElement> {
  showLabel?: boolean;
}

export function MessageGenerationStage({
  className,
  showLabel = true,
  ...props
}: GenerationStageProps) {
  const { thread, isIdle } = useTambo();
  const stage = thread?.generationStage;

  if (!stage || isIdle) return null;

  const stageLabels: Record<GenerationStage, string> = {
    IDLE: "IDLE",
    CHOOSING_COMPONENT: "SELECTING MODULE",
    FETCHING_CONTEXT: "SYNCING CONTEXT",
    HYDRATING_COMPONENT: "INITIALIZING",
    STREAMING_RESPONSE: "GENERATING",
    COMPLETE: "COMPLETE",
    ERROR: "ERROR",
    CANCELLED: "CANCELLED",
  };

  const label = stageLabels[stage] ?? stage;

  /* Semantic, ops-safe colors */
  const stageClassMap: Record<GenerationStage, string> = {
    IDLE: "text-muted-foreground",
    CHOOSING_COMPONENT: "text-foreground",
    FETCHING_CONTEXT: "text-foreground",
    HYDRATING_COMPONENT: "text-foreground",
    STREAMING_RESPONSE: "text-primary",
    COMPLETE: "text-green-500",
    ERROR: "text-destructive",
    CANCELLED: "text-muted-foreground",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2",
        "px-3 py-1.5",
        "border border-border bg-secondary",
        "text-[10px] tracking-widest uppercase",
        stageClassMap[stage],
        className,
      )}
      {...props}
    >
      {/* Indicator */}
      {stage === "STREAMING_RESPONSE" ? (
        <Loader2Icon className="h-3 w-3 animate-spin" />
      ) : stage === "ERROR" ? (
        <span className="h-2 w-2 rounded-full bg-destructive" />
      ) : stage === "COMPLETE" ? (
        <span className="h-2 w-2 rounded-full bg-green-500" />
      ) : (
        <span className="h-2 w-2 rounded-full bg-border" />
      )}

      {showLabel && <span>{label}</span>}
    </div>
  );
}
