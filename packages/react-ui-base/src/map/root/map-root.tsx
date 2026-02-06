import { Slot } from "@radix-ui/react-slot";
import {
  GenerationStage,
  useTambo,
  useTamboCurrentMessage,
} from "@tambo-ai/react";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";
import {
  type HeatData,
  type MarkerData,
  MapRootContext,
  type TileTheme,
  type ValidatedHeatDataTuple,
  type ValidatedMarkerData,
} from "./map-root-context";

export type MapRootProps = BaseProps<
  React.HTMLAttributes<HTMLDivElement> & {
    /** Center coordinates of the map */
    center?: { lat: number; lng: number };
    /** Initial zoom level (1-20, default: 10) */
    zoom?: number;
    /** Array of marker objects to display on the map */
    markers?: MarkerData[];
    /** Optional array of heatmap data points */
    heatData?: HeatData[] | null;
    /** Whether to show zoom controls (default: true) */
    zoomControl?: boolean;
    /** Size variant for the map */
    size?: "sm" | "md" | "lg" | "full";
    /** Map tile theme */
    tileTheme?: TileTheme;
    /** @deprecated Use tileTheme instead */
    theme?: TileTheme;
    /** Border radius variant */
    rounded?: "none" | "sm" | "md" | "full";
  }
>;

/**
 * Filters and validates marker data.
 * Removes markers that don't meet coordinate or label requirements.
 * @param markers - Array of marker objects to validate
 * @returns Array of valid marker objects
 */
function useValidMarkers(markers: MarkerData[] = []): ValidatedMarkerData[] {
  return React.useMemo(
    () =>
      (markers || []).filter(
        (m) =>
          typeof m.lat === "number" &&
          m.lat >= -90 &&
          m.lat <= 90 &&
          typeof m.lng === "number" &&
          m.lng >= -180 &&
          m.lng <= 180 &&
          typeof m.label === "string" &&
          m.label.length > 0,
      ),
    [markers],
  );
}

/**
 * Filters and validates heatmap data.
 * Converts valid heat data to tuple format [lat, lng, intensity].
 * @param heatData - Array of heatmap data points
 * @returns Array of validated heat data tuples
 */
function useValidHeatData(
  heatData?: HeatData[] | null,
): ValidatedHeatDataTuple[] {
  return React.useMemo(() => {
    if (!Array.isArray(heatData)) return [];
    return heatData
      .filter(
        (d) =>
          typeof d.lat === "number" &&
          d.lat >= -90 &&
          d.lat <= 90 &&
          typeof d.lng === "number" &&
          d.lng >= -180 &&
          d.lng <= 180 &&
          typeof d.intensity === "number" &&
          d.intensity >= 0 &&
          d.intensity <= 1,
      )
      .map((d) => [d.lat, d.lng, d.intensity] as ValidatedHeatDataTuple);
  }, [heatData]);
}

/**
 * Root primitive for the map component.
 * Provides context with validated data for child components.
 * Handles loading state detection via Tambo thread generation stage.
 * @returns The root map container with context provider
 */
export const MapRoot = React.forwardRef<HTMLDivElement, MapRootProps>(
  function MapRoot(
    {
      children,
      asChild,
      center,
      zoom = 10,
      markers = [],
      heatData,
      zoomControl = true,
      size,
      tileTheme,
      theme,
      rounded,
      ...props
    },
    ref,
  ) {
    const effectiveTileTheme = tileTheme ?? theme ?? "default";
    const { thread } = useTambo();
    const currentMessage = useTamboCurrentMessage();

    const message = thread?.messages[thread?.messages.length - 1];
    const isLatestMessage = message?.id && message.id === currentMessage?.id;

    const generationStage = thread?.generationStage;
    const isGenerating =
      generationStage &&
      generationStage !== GenerationStage.COMPLETE &&
      generationStage !== GenerationStage.ERROR;

    const isLoading = !!isLatestMessage && !!isGenerating;
    const hasError = !center;

    const validMarkers = useValidMarkers(markers);
    const validHeatData = useValidHeatData(heatData);

    const contextValue = React.useMemo(
      () => ({
        center,
        zoom,
        zoomControl,
        tileTheme: effectiveTileTheme,
        validMarkers,
        validHeatData,
        isLoading,
        hasError,
        size,
        rounded,
      }),
      [
        center,
        zoom,
        zoomControl,
        effectiveTileTheme,
        validMarkers,
        validHeatData,
        isLoading,
        hasError,
        size,
        rounded,
      ],
    );

    const Comp = asChild ? Slot : "div";

    return (
      <MapRootContext.Provider value={contextValue}>
        <Comp
          ref={ref}
          data-slot="map-root"
          data-loading={isLoading || undefined}
          data-error={hasError || undefined}
          {...props}
        >
          {children}
        </Comp>
      </MapRootContext.Provider>
    );
  },
);
