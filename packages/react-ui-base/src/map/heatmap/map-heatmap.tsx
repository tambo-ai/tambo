import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import {
  useMapRootContext,
  type ValidatedHeatDataTuple,
} from "../root/map-root-context";

/**
 * Props passed to the MapHeatmap render function.
 */
export interface MapHeatmapRenderProps {
  /** Array of validated heat data tuples in [lat, lng, intensity] format */
  heatData: ValidatedHeatDataTuple[];
}

export type MapHeatmapProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
>;

/**
 * Heatmap primitive for rendering heatmap data.
 * Provides validated heat data via render prop for the consumer
 * to render with their mapping library.
 * Renders nothing if there is no valid heat data.
 * @returns The heatmap container element or null if no heat data
 */
export const MapHeatmap = React.forwardRef<
  HTMLDivElement,
  BasePropsWithChildrenOrRenderFunction<MapHeatmapProps, MapHeatmapRenderProps>
>((props, ref) => {
  const { validHeatData, isLoading, hasError } = useMapRootContext();

  if (isLoading || hasError || validHeatData.length === 0) {
    return null;
  }

  const Comp = "asChild" in props && props.asChild ? Slot : "div";

  const { content, componentProps } = useRender(props, {
    heatData: validHeatData,
  });

  return (
    <Comp ref={ref} data-slot="map-heatmap" {...componentProps}>
      {content}
    </Comp>
  );
});
MapHeatmap.displayName = "MapBase.Heatmap";
