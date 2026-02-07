import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import { useGraphRootContext } from "../root/graph-root-context";

/**
 * The specific loading status for the graph.
 * - "no-data": No data has been received yet (awaiting data).
 * - "invalid-structure": Data exists but structure is incomplete (building chart).
 * - "no-valid-datasets": Structure exists but datasets are incomplete (preparing datasets).
 */
export type GraphLoadingStatus =
  | "no-data"
  | "invalid-structure"
  | "no-valid-datasets";

/**
 * Props passed to the Graph.Loading render function.
 */
export interface GraphLoadingRenderProps {
  /** The specific loading status. */
  status: GraphLoadingStatus;
}

export type GraphLoadingProps = BasePropsWithChildrenOrRenderFunction<
  React.HTMLAttributes<HTMLDivElement>,
  GraphLoadingRenderProps
>;

/**
 * Loading indicator for the graph component.
 * Only renders when graph data is not yet valid (no data, invalid structure, or no valid datasets).
 * @returns The loading container element, or null if data is valid
 */
export const GraphLoading = React.forwardRef<HTMLDivElement, GraphLoadingProps>(
  function GraphLoading({ asChild, ...props }, ref) {
    const { dataState } = useGraphRootContext();

    if (
      dataState.status !== "no-data" &&
      dataState.status !== "invalid-structure" &&
      dataState.status !== "no-valid-datasets"
    ) {
      return null;
    }

    const Comp = asChild ? Slot : "div";

    const { content, componentProps } = useRender(props, {
      status: dataState.status,
    });

    return (
      <Comp
        ref={ref}
        data-slot="graph-loading"
        data-loading-status={dataState.status}
        {...componentProps}
      >
        {content}
      </Comp>
    );
  },
);
