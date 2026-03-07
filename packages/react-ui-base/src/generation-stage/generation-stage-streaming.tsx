"use client";

import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { useGenerationStageContext } from "./generation-stage-context";

export interface GenerationStageStreamingState extends Record<string, unknown> {
  slot: string;
  isStreaming: boolean;
}

type GenerationStageStreamingComponentProps = useRender.ComponentProps<
  "div",
  GenerationStageStreamingState
>;

export interface GenerationStageStreamingProps extends GenerationStageStreamingComponentProps {
  /** Keeps the node mounted and toggles `data-hidden` when not streaming. */
  keepMounted?: boolean;
}

/**
 * Renders its children only when the thread is actively streaming a response.
 * Use `keepMounted` to keep the node in the DOM and toggle `data-hidden` instead.
 */
export const GenerationStageStreaming = React.forwardRef<
  HTMLDivElement,
  GenerationStageStreamingProps
>((props, ref) => {
  const { isStreaming } = useGenerationStageContext();
  const { render, keepMounted, children, ...componentProps } = props;

  const state: GenerationStageStreamingState = {
    slot: "generation-stage-streaming",
    isStreaming,
  };

  if (!isStreaming && !keepMounted) {
    return null;
  }

  return useRender({
    defaultTagName: "div",
    ref,
    render,
    state,
    props: {
      ...componentProps,
      children: children ?? "Generating response",
      "data-hidden": !isStreaming || undefined,
      "aria-hidden": !isStreaming || undefined,
    },
  });
});
GenerationStageStreaming.displayName = "GenerationStage.Streaming";
