import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import {
  useMapRootContext,
  type ValidatedMarkerData,
} from "../root/map-root-context";

/**
 * Props passed to the MapMarkers render function.
 */
export interface MapMarkersRenderProps {
  /** Array of validated marker data */
  markers: ValidatedMarkerData[];
}

export type MapMarkersProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
>;

/**
 * Markers primitive for rendering map markers.
 * Provides validated marker data via render prop for the consumer
 * to render with their mapping library.
 * Renders nothing if there are no valid markers.
 * @returns The markers container element or null if no markers
 */
export const MapMarkers = React.forwardRef<
  HTMLDivElement,
  BasePropsWithChildrenOrRenderFunction<MapMarkersProps, MapMarkersRenderProps>
>((props, ref) => {
  const { validMarkers, isLoading, hasError } = useMapRootContext();

  if (isLoading || hasError || validMarkers.length === 0) {
    return null;
  }

  const Comp = "asChild" in props && props.asChild ? Slot : "div";

  const { content, componentProps } = useRender(props, {
    markers: validMarkers,
  });

  return (
    <Comp ref={ref} data-slot="map-markers" {...componentProps}>
      {content}
    </Comp>
  );
});
MapMarkers.displayName = "MapBase.Markers";
