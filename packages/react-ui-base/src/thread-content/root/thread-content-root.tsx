import { Slot } from "@radix-ui/react-slot";
import { TamboThreadMessage, useTambo } from "@tambo-ai/react";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";
import { ThreadContentRootContext } from "./thread-content-root-context";

export type ThreadContentRootProps = BaseProps<
  React.HTMLAttributes<HTMLDivElement> & {
    /**
     * Optional override for the thread messages.
     * When not provided, messages are read from the Tambo thread context.
     */
    messages?: TamboThreadMessage[];
    /**
     * Optional override for the generating state.
     * When not provided, derived from the Tambo idle state.
     */
    isGenerating?: boolean;
    /**
     * Optional override for the generation stage.
     * When not provided, read from the Tambo context.
     */
    generationStage?: string;
  }
>;

/**
 * Root primitive for a thread content component.
 * Provides context for child components using data from the Tambo hook
 * or explicit prop overrides.
 * @returns The thread content root element with context provider
 */
export const ThreadContentRoot = React.forwardRef<
  HTMLDivElement,
  ThreadContentRootProps
>(function ThreadContentRoot(
  {
    children,
    messages: messagesProp,
    isGenerating: isGeneratingProp,
    generationStage: generationStageProp,
    asChild,
    ...props
  },
  ref,
) {
  const { thread, generationStage: tamboGenerationStage, isIdle } = useTambo();

  const isGenerating = isGeneratingProp ?? !isIdle;
  const generationStage = generationStageProp ?? tamboGenerationStage;

  const contextValue = React.useMemo(
    () => ({
      messages: messagesProp ?? thread?.messages ?? [],
      isGenerating,
      generationStage,
    }),
    [messagesProp, thread?.messages, isGenerating, generationStage],
  );

  const Comp = asChild ? Slot : "div";

  return (
    <ThreadContentRootContext.Provider value={contextValue}>
      <Comp
        ref={ref}
        data-slot="thread-content-root"
        data-generating={isGenerating || undefined}
        {...props}
      >
        {children}
      </Comp>
    </ThreadContentRootContext.Provider>
  );
});
