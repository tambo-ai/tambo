"use client";

import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { useGenerationStageContext } from "./generation-stage-context";

export interface GenerationStageContentState extends Record<string, unknown> {
  slot: string;
  isIdle: boolean;
}

type GenerationStageContentComponentProps = useRender.ComponentProps<
  "div",
  GenerationStageContentState
>;

export interface GenerationStageContentProps extends GenerationStageContentComponentProps {
  /** Keeps the node mounted and toggles `data-hidden` when idle. */
  keepMounted?: boolean;
}

/**
 * Container that renders its children only when the thread is not idle
 * (i.e., when waiting or streaming).
 * Use `keepMounted` to keep the node in the DOM and toggle `data-hidden` instead.
 */
export const GenerationStageContent = React.forwardRef<
  HTMLDivElement,
  GenerationStageContentProps
>((props, ref) => {
  const { isIdle } = useGenerationStageContext();
  const { render, keepMounted, ...componentProps } = props;

  const state: GenerationStageContentState = {
    slot: "generation-stage-content",
    isIdle,
  };

  if (isIdle && !keepMounted) {
    return null;
  }

  return useRender({
    defaultTagName: "div",
    ref,
    render,
    state,
    props: {
      ...componentProps,
      "data-hidden": isIdle || undefined,
      "aria-hidden": isIdle || undefined,
    },
  });
});
GenerationStageContent.displayName = "GenerationStage.Content";
