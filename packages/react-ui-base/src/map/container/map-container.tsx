import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../types/component-render-or-children";
import { useRender } from "../../use-render/use-render";
import {
  useMapRootContext,
  type ValidatedHeatDataTuple,
  type ValidatedMarkerData,
} from "../root/map-root-context";

/**
 * Props passed to the MapContainer render function.
 */
export interface MapContainerRenderProps {
  /** Center coordinates as [lat, lng] tuple */
  center: [number, number];
  /** Zoom level */
  zoom: number;
  /** Whether zoom controls should be shown */
  zoomControl: boolean;
  /** The tile theme to apply */
  tileTheme: "default" | "dark" | "light" | "satellite";
  /** Validated marker data */
  validMarkers: ValidatedMarkerData[];
  /** Validated heat data as tuples [lat, lng, intensity] */
  validHeatData: ValidatedHeatDataTuple[];
}

export type MapContainerProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
>;

/**
 * Container primitive for the map rendering area.
 * Only renders when the map is not in a loading or error state.
 * Provides map configuration and validated data via render prop for the
 * consumer to pass to their mapping library (e.g., react-leaflet).
 * @returns The map container element or null if loading/error
 */
export const MapContainer = React.forwardRef<
  HTMLDivElement,
  BasePropsWithChildrenOrRenderFunction<
    MapContainerProps,
    MapContainerRenderProps
  >
>((props, ref) => {
  const {
    center,
    zoom,
    zoomControl,
    tileTheme,
    validMarkers,
    validHeatData,
    isLoading,
    hasError,
  } = useMapRootContext();

  if (isLoading || hasError || !center) {
    return null;
  }

  const Comp = "asChild" in props && props.asChild ? Slot : "div";

  const { content, componentProps } = useRender(props, {
    center: [center.lat, center.lng] as [number, number],
    zoom,
    zoomControl,
    tileTheme,
    validMarkers,
    validHeatData,
  });

  return (
    <Comp ref={ref} data-slot="map-container" {...componentProps}>
      {content}
    </Comp>
  );
});
MapContainer.displayName = "MapBase.Container";
