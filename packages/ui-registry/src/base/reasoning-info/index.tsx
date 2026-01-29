"use client";

import { ReasoningInfoContent } from "./content/reasoning-info-content";
import { ReasoningInfoRoot } from "./root/reasoning-info-root";
import { ReasoningInfoStatusText } from "./status-text/reasoning-info-status-text";
import { ReasoningInfoSteps } from "./steps/reasoning-info-steps";
import { ReasoningInfoTrigger } from "./trigger/reasoning-info-trigger";

export const ReasoningInfo = {
  Root: ReasoningInfoRoot,
  Trigger: ReasoningInfoTrigger,
  StatusText: ReasoningInfoStatusText,
  Content: ReasoningInfoContent,
  Steps: ReasoningInfoSteps,
};

export type { ReasoningInfoContentProps } from "./content/reasoning-info-content";
export type { ReasoningInfoRootProps } from "./root/reasoning-info-root";
export type { ReasoningInfoStatusTextProps } from "./status-text/reasoning-info-status-text";
export type {
  ReasoningInfoStepsProps,
  ReasoningInfoStepsRenderFunctionProps,
} from "./steps/reasoning-info-steps";
export type { ReasoningInfoTriggerProps } from "./trigger/reasoning-info-trigger";
