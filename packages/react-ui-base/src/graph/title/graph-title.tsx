import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import { useGraphRootContext } from "../root/graph-root-context";

/**
 * Props passed to the Graph.Title render function.
 */
export interface GraphTitleRenderProps {
  /** The title text from the graph context. */
  title: string;
}

export type GraphTitleProps = BasePropsWithChildrenOrRenderFunction<
  React.HTMLAttributes<HTMLHeadingElement>,
  GraphTitleRenderProps
>;

/**
 * Displays the graph title.
 * Renders nothing if the title is empty.
 * @returns The title heading element, or null if title is empty
 */
export const GraphTitle = React.forwardRef<HTMLHeadingElement, GraphTitleProps>(
  function GraphTitle({ asChild, ...props }, ref) {
    const { title } = useGraphRootContext();

    const Comp = asChild ? Slot : "h3";

    const { content, componentProps } = useRender(props, { title });

    if (!title) {
      return null;
    }

    return (
      <Comp ref={ref} data-slot="graph-title" {...componentProps}>
        {content ?? title}
      </Comp>
    );
  },
);
