"use client";

import { MapContainer } from "./container/map-container";
import { MapError } from "./error/map-error";
import { MapHeatmap } from "./heatmap/map-heatmap";
import { MapLoading } from "./loading/map-loading";
import { MapMarkers } from "./markers/map-markers";
import { MapRoot } from "./root/map-root";

/**
 * MapBase namespace containing all map base components.
 */
const MapBase = {
  Root: MapRoot,
  Container: MapContainer,
  Markers: MapMarkers,
  Heatmap: MapHeatmap,
  Loading: MapLoading,
  Error: MapError,
};

export type {
  MapContainerProps,
  MapContainerRenderProps,
} from "./container/map-container";
export type { MapErrorProps, MapErrorRenderProps } from "./error/map-error";
export type {
  MapHeatmapProps,
  MapHeatmapRenderProps,
} from "./heatmap/map-heatmap";
export type {
  MapLoadingProps,
  MapLoadingRenderProps,
} from "./loading/map-loading";
export type {
  MapMarkersProps,
  MapMarkersRenderProps,
} from "./markers/map-markers";
export type {
  HeatData,
  MapRootContextValue,
  MarkerData,
  TileTheme,
  ValidatedHeatDataTuple,
  ValidatedMarkerData,
} from "./root/map-root-context";
export type { MapRootProps } from "./root/map-root";

export { MapBase };
