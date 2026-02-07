import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";
import { GraphRootContext } from "./graph-root-context";
import { type GraphData, validateGraphData } from "./validate-graph-data";

export type GraphRootProps = BaseProps<
  React.HTMLAttributes<HTMLDivElement> & {
    /** The graph data to render. */
    data: GraphData | undefined;
    /** Title for the chart. */
    title: string;
    /** Whether to show the legend. Defaults to true. */
    showLegend?: boolean;
  }
>;

/**
 * Root primitive for a graph component.
 * Validates graph data and provides context for child components.
 * @returns The root graph element with context provider
 */
export const GraphRoot = React.forwardRef<HTMLDivElement, GraphRootProps>(
  function GraphRoot(
    { children, data, title, showLegend = true, asChild, ...props },
    ref,
  ) {
    const dataState = React.useMemo(() => validateGraphData(data), [data]);

    const contextValue = React.useMemo(
      () => ({ data, dataState, title, showLegend }),
      [data, dataState, title, showLegend],
    );

    const Comp = asChild ? Slot : "div";

    return (
      <GraphRootContext.Provider value={contextValue}>
        <Comp
          ref={ref}
          data-slot="graph-root"
          data-graph-status={dataState.status}
          {...props}
        >
          {children}
        </Comp>
      </GraphRootContext.Provider>
    );
  },
);
