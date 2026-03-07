"use client";

import { useRender } from "@base-ui/react/use-render";
import { useTambo } from "@tambo-ai/react";
import * as React from "react";
import { GenerationStageContext } from "./generation-stage-context";

export interface GenerationStageRootState extends Record<string, unknown> {
  slot: string;
  isStreaming: boolean;
  isWaiting: boolean;
  isIdle: boolean;
}

type GenerationStageRootComponentProps = useRender.ComponentProps<
  "div",
  GenerationStageRootState
>;

export type GenerationStageRootProps = GenerationStageRootComponentProps;

/**
 * Root component for generation stage.
 * Derives streaming state from Tambo hooks and provides it to children via context.
 */
export const GenerationStageRoot = React.forwardRef<
  HTMLDivElement,
  GenerationStageRootProps
>((props, ref) => {
  const { isStreaming, isWaiting, isIdle } = useTambo();

  const contextValue = React.useMemo(
    () => ({
      isStreaming,
      isWaiting,
      isIdle,
    }),
    [isStreaming, isWaiting, isIdle],
  );

  const { render, ...componentProps } = props;
  const state: GenerationStageRootState = {
    slot: "generation-stage",
    isStreaming,
    isWaiting,
    isIdle,
  };

  const element = useRender({
    defaultTagName: "div",
    ref,
    render,
    state,
    props: componentProps,
  });

  return (
    <GenerationStageContext.Provider value={contextValue}>
      {element}
    </GenerationStageContext.Provider>
  );
});
GenerationStageRoot.displayName = "GenerationStage.Root";
