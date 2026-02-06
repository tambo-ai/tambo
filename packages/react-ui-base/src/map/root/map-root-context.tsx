import * as React from "react";

/**
 * Marker data for display on the map.
 */
export interface MarkerData {
  /** Latitude coordinate (must be between -90 and 90) */
  lat: number;
  /** Longitude coordinate (must be between -180 and 180) */
  lng: number;
  /** Display label for the marker */
  label: string;
  /** Optional unique identifier for the marker */
  id?: string;
}

/**
 * Heat data point for heatmap visualization.
 */
export interface HeatData {
  /** Latitude coordinate (must be between -90 and 90) */
  lat: number;
  /** Longitude coordinate (must be between -180 and 180) */
  lng: number;
  /** Intensity value for heatmap (must be between 0 and 1) */
  intensity: number;
}

/** Supported tile theme values */
export type TileTheme = "default" | "dark" | "light" | "satellite";

/**
 * Validated marker data with the same shape as MarkerData, confirmed to be
 * within valid coordinate ranges.
 */
export type ValidatedMarkerData = MarkerData;

/** A validated heat data tuple in the format [lat, lng, intensity] */
export type ValidatedHeatDataTuple = [number, number, number];

/**
 * Context value shared among MapBase sub-components.
 */
export interface MapRootContextValue {
  /** Center coordinates of the map */
  center: { lat: number; lng: number } | undefined;
  /** Zoom level */
  zoom: number;
  /** Whether to show zoom controls */
  zoomControl: boolean;
  /** Effective tile theme for the map */
  tileTheme: TileTheme;
  /** Validated marker data */
  validMarkers: ValidatedMarkerData[];
  /** Validated heat data as tuples */
  validHeatData: ValidatedHeatDataTuple[];
  /** Whether the component is in a loading/generating state */
  isLoading: boolean;
  /** Whether the center is missing (error state) */
  hasError: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg" | "full";
  /** Rounded variant */
  rounded?: "none" | "sm" | "md" | "full";
}

const MapRootContext = React.createContext<MapRootContextValue | null>(null);

/**
 * Hook to access the map root context.
 * @internal This hook is for internal use by base components only.
 * @returns The map root context value
 * @throws Error if used outside of MapBase.Root component
 */
function useMapRootContext(): MapRootContextValue {
  const context = React.useContext(MapRootContext);
  if (!context) {
    throw new Error(
      "React UI Base: MapRootContext is missing. Map parts must be used within <MapBase.Root>",
    );
  }
  return context;
}

export { MapRootContext, useMapRootContext };
