"use client";

import { cn } from "@tambo-ai/ui-registry/utils";
import {
  createElementObject,
  createLayerComponent,
  updateGridLayer,
  type LayerProps,
  type LeafletContextInterface,
} from "@react-leaflet/core";
import {
  GenerationStage,
  useTambo,
  useTamboCurrentMessage,
} from "@tambo-ai/react";
import { cva, type VariantProps } from "class-variance-authority";
import L, {
  type HeatLatLngTuple,
  type LatLng,
  type MarkerClusterGroupOptions,
} from "leaflet";
import "leaflet.heat";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import * as React from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  useMapEvents,
} from "react-leaflet";
import { z } from "zod/v3";

/**
 * Props interface for MarkerClusterGroup component
 * @interface MarkerClusterGroupProps
 * @extends {MarkerClusterGroupOptions}
 */
interface MarkerClusterGroupProps extends MarkerClusterGroupOptions {
  /** React children elements to be rendered within the cluster group */
  children?: React.ReactNode;
  /** Optional function to create custom cluster icons */
  iconCreateFunction?: (cluster: L.MarkerCluster) => L.DivIcon;
}

/**
 * ClusterGroup component for grouping markers on the map
 * @param {MarkerClusterGroupProps} props - The component props
 * @returns {null} - This component doesn't render anything directly
 */
const ClusterGroup: React.FC<MarkerClusterGroupProps> = ({
  children,
  iconCreateFunction,
  ...options
}) => {
  const map = useMapEvents({});
  const clusterGroupRef = React.useRef<L.MarkerClusterGroup | null>(null);
  const optionsString = React.useMemo(() => JSON.stringify(options), [options]);

  React.useEffect(() => {
    if (!map) return;
    const clusterGroup = L.markerClusterGroup({
      ...options,
      iconCreateFunction,
    });
    clusterGroupRef.current = clusterGroup;
    map.addLayer(clusterGroup);

    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.props.position) {
        const marker = L.marker(child.props.position, child.props);

        const tooltipChild = React.Children.toArray(child.props.children).find(
          (tooltipChild) =>
            React.isValidElement(tooltipChild) && tooltipChild.type === Tooltip,
        );

        if (React.isValidElement(tooltipChild)) {
          marker.bindTooltip(tooltipChild.props.children, {
            direction: tooltipChild.props.direction ?? "auto",
            permanent: tooltipChild.props.permanent ?? false,
            sticky: tooltipChild.props.sticky ?? false,
            opacity: tooltipChild.props.opacity ?? 0.9,
          });
        }

        clusterGroup.addLayer(marker);
      }
    });

    return () => {
      map.removeLayer(clusterGroup);
    };
  }, [map, children, optionsString, iconCreateFunction, options]);

  return null;
};

/**
 * Props interface for HeatLayer component
 * @interface HeatLayerProps
 * @extends {LayerProps}
 * @extends {L.HeatMapOptions}
 */
interface HeatLayerProps extends LayerProps, L.HeatMapOptions {
  /** Array of latitude/longitude coordinates with optional intensity values for heatmap */
  latlngs: (LatLng | HeatLatLngTuple)[];
}

/**
 * Creates a heat layer for the map
 * @param {HeatLayerProps} props - Heat layer properties including coordinates and options
 * @param {LeafletContextInterface} context - Leaflet context interface
 * @returns {Object} - Element object for the heat layer
 */
const createHeatLayer = (
  { latlngs, ...options }: HeatLayerProps,
  context: LeafletContextInterface,
) => {
  const layer = L.heatLayer(latlngs, options);
  return createElementObject(layer, context);
};

/**
 * Updates an existing heat layer with new data
 * @param {L.HeatLayer} layer - The heat layer instance to update
 * @param {HeatLayerProps} props - New properties for the heat layer
 * @param {HeatLayerProps} prevProps - Previous properties for comparison
 */
const updateHeatLayer = (
  layer: L.HeatLayer,
  { latlngs, ...options }: HeatLayerProps,
  prevProps: HeatLayerProps,
) => {
  layer.setLatLngs(latlngs);
  layer.setOptions(options);
  updateGridLayer(layer, options, prevProps);
};

/**
 * HeatLayer component for displaying heatmap data on the map
 */
const HeatLayer = createLayerComponent<L.HeatLayer, HeatLayerProps>(
  createHeatLayer,
  updateHeatLayer,
);

/**
 * Fix for Leaflet marker icons in SSR/Next.js environments
 * Loads marker icons from CDN to prevent missing icon issues
 */
if (typeof window !== "undefined") {
  void import("leaflet").then((L) => {
    delete (L.Icon.Default.prototype as { _getIconUrl?: () => string })
      ._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });
    void import("leaflet.heat");
  });
}

/**
 * Variants for the map component
 * Defines different size, theme, and rounded corner options for the map
 */
export const mapVariants = cva(
  "w-full transition-all duration-200 bg-background border border-border",
  {
    variants: {
      size: {
        sm: "h-[200px]",
        md: "h-[300px]",
        lg: "h-[500px]",
        full: "h-full w-full",
      },
      rounded: {
        none: "rounded-none",
        sm: "rounded-md",
        md: "rounded-lg",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      size: "md",
      rounded: "md",
    },
  },
);

/**
 * Zod schema for validating marker data
 * Ensures latitude is between -90 and 90, longitude between -180 and 180
 */
export const markerSchema = z.object({
  /** Latitude coordinate (must be between -90 and 90) */
  lat: z.number().min(-90).max(90),
  /** Longitude coordinate (must be between -180 and 180) */
  lng: z.number().min(-180).max(180),
  /** Display label for the marker */
  label: z.string(),
  /** Optional unique identifier for the marker */
  id: z.string().optional(),
});

/**
 * Zod schema for validating heatmap data points
 * Includes intensity value between 0 and 1 for heat visualization
 */
export const heatDataSchema = z.object({
  /** Latitude coordinate (must be between -90 and 90) */
  lat: z.number().min(-90).max(90),
  /** Longitude coordinate (must be between -180 and 180) */
  lng: z.number().min(-180).max(180),
  /** Intensity value for heatmap (must be between 0 and 1) */
  intensity: z.number().min(0).max(1),
});

/**
 * Zod schema for validating map component props
 * Defines all configurable options for the map component
 */
export const mapSchema = z.object({
  /** Center coordinates of the map */
  center: z.object({ lat: z.number(), lng: z.number() }),
  /** Initial zoom level (1-20, default: 10) */
  zoom: z.number().min(1).max(20).default(10),
  /** Array of marker objects to display on the map */
  markers: z.array(markerSchema).default([]),
  /** Optional array of heatmap data points */
  heatData: z.array(heatDataSchema).optional().nullable(),
  /** Whether to show zoom controls (default: true) */
  zoomControl: z.boolean().optional().default(true),
  /** Optional Tailwind CSS classes for the map container */
  className: z
    .string()
    .optional()
    .describe("Optional tailwind className for the map container"),
  /** Size variant for the map */
  size: z.enum(["sm", "md", "lg", "full"]).optional(),
  /** Map tile theme (affects the actual map tiles, not container styling) */
  tileTheme: z.enum(["default", "dark", "light", "satellite"]).optional(),
  /** Border radius variant */
  rounded: z.enum(["none", "sm", "md", "full"]).optional(),
});

/** Type definition for marker data based on the marker schema */
export type MarkerData = z.infer<typeof markerSchema>;
/** Type definition for heatmap data based on the heat data schema */
export type HeatData = z.infer<typeof heatDataSchema>;
/** Type definition for map props combining schema and variant props */
export type MapProps = z.infer<typeof mapSchema> &
  VariantProps<typeof mapVariants> & {
    /** @deprecated Use tileTheme instead */
    theme?: "default" | "dark" | "light" | "satellite";
  };

/**
 * Hook to filter and validate marker data
 * Removes invalid markers that don't meet coordinate or label requirements
 * @param {MarkerData[]} markers - Array of marker objects to validate
 * @returns {MarkerData[]} - Array of valid marker objects
 */
function useValidMarkers(markers: MarkerData[] = []) {
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
 * Hook to filter and validate heatmap data
 * Converts valid heat data to the format expected by Leaflet heatLayer
 * @param {HeatData[] | null} heatData - Array of heatmap data points
 * @returns {HeatLatLngTuple[]} - Array of validated heat data tuples
 */
function useValidHeatData(heatData?: HeatData[] | null) {
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
      .map((d) => [d.lat, d.lng, d.intensity] as HeatLatLngTuple);
  }, [heatData]);
}

/**
 * Loading spinner component displayed while map is generating or loading
 * Shows animated dots with "Loading map..." text
 * @returns {JSX.Element} - Loading spinner component
 */
function LoadingSpinner() {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <div className="flex items-center gap-1 h-4">
          <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></span>
          <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.2s]"></span>
          <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.1s]"></span>
        </div>
        <span className="text-sm">Loading map...</span>
      </div>
    </div>
  );
}

/**
 * Map click handler component that centers the map on clicked location
 * Uses useMapEvents hook to listen for click events on the map
 * @returns {null} - This component doesn't render anything
 */
function MapClickHandler() {
  const animateRef = React.useRef(true);
  useMapEvents({
    click: (e: { latlng: L.LatLng; target: L.Map }) => {
      const map: L.Map = e.target;
      map.setView(e.latlng, map.getZoom(), { animate: animateRef.current });
    },
  });
  return null;
}

/**
 * Interactive map component with support for markers, heatmaps, and clustering
 *
 * Features:
 * - Multiple tile layer themes (default, dark, light, satellite)
 * - Marker clustering with custom icons
 * - Heatmap visualization
 * - Responsive sizing variants
 * - Loading states during generation
 * - Click-to-center functionality
 * - Zoom controls
 * - Tooltip support for markers
 *
 * @example
 * ```
 * <Map
 *   center={{ lat: 0, lng: 0 }}
 *   zoom={10}
 *   markers={[{ lat: 0, lng: 0, label: "Marker 1" }]}
 *   heatData={[{ lat: 0, lng: 0, intensity: 0.5 }]}
 * />
 * ```
 *
 * @param {MapProps} props - Map component properties
 * @param {React.Ref<HTMLDivElement>} ref - Forward ref for the container element
 * @returns {JSX.Element} - The rendered map component
 */
export const Map = React.forwardRef<HTMLDivElement, MapProps>(
  (
    {
      center,
      zoom = 10,
      markers = [],
      heatData,
      zoomControl = true,
      className,
      size = "md",
      tileTheme,
      theme,
      rounded = "md",
      ...props
    },
    ref,
  ) => {
    // Support deprecated theme prop, prefer tileTheme
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

    const validMarkers = useValidMarkers(markers);
    const validHeatData = useValidHeatData(heatData);

    // Show loading state during generation
    if (isLatestMessage && isGenerating) {
      return (
        <div
          ref={ref}
          className={cn(mapVariants({ size, rounded }), className)}
          {...props}
        >
          <LoadingSpinner />
        </div>
      );
    }

    // Show error state if center coordinates are missing
    if (!center) {
      return (
        <div
          ref={ref}
          className={cn(mapVariants({ size, rounded }), className)}
          {...props}
        >
          <div className="h-full flex items-center justify-center">
            <div className="text-destructive text-center">
              <p className="font-medium">Invalid Map Data</p>
              <p className="text-sm mt-1">
                Center coordinates are required to display the map.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          mapVariants({ size, rounded }),
          "overflow-hidden",
          className,
        )}
        {...props}
      >
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={zoom}
          className="h-full w-full"
          scrollWheelZoom
          zoomControl={zoomControl}
        >
          <TileLayer url={getTileLayerUrl(effectiveTileTheme)} />

          {validHeatData.length > 0 && (
            <HeatLayer
              latlngs={validHeatData}
              radius={25}
              blur={15}
              maxZoom={20}
              minOpacity={0.45}
            />
          )}

          <ClusterGroup
            chunkedLoading
            animate
            animateAddingMarkers
            zoomToBoundsOnClick
            maxClusterRadius={75}
            showCoverageOnHover={false}
            spiderfyOnMaxZoom
            spiderfyDistanceMultiplier={1.5}
            iconCreateFunction={(cluster: L.MarkerCluster) => {
              const count = cluster.getChildCount();
              let size: "small" | "medium" | "large" = "small";
              let colorClass = "bg-blue-500";
              if (count < 10) {
                size = "small";
                colorClass = "bg-blue-500";
              } else if (count < 100) {
                size = "medium";
                colorClass = "bg-orange-500";
              } else {
                size = "large";
                colorClass = "bg-red-500";
              }
              const sizeClasses: Record<"small" | "medium" | "large", string> =
                {
                  small: "w-8 h-8 text-xs",
                  medium: "w-10 h-10 text-sm",
                  large: "w-12 h-12 text-base",
                };
              let iconSize = 48;
              if (size === "small") {
                iconSize = 32;
              } else if (size === "medium") {
                iconSize = 40;
              }
              return L.divIcon({
                html: `<div class="flex items-center justify-center ${colorClass} ${sizeClasses[size]} text-white font-bold rounded-xl border-2 border-white shadow-lg transition-all duration-200 hover:scale-110 hover:brightness-90">${count}</div>`,
                className: "custom-cluster-icon",
                iconSize: L.point(iconSize, iconSize),
                iconAnchor: L.point(iconSize / 2, iconSize / 2),
              });
            }}
          >
            {validMarkers.map((marker, idx) => (
              <Marker
                key={marker.id ?? `marker-${idx}`}
                position={[marker.lat, marker.lng]}
              >
                <Tooltip>{marker.label}</Tooltip>
              </Marker>
            ))}
          </ClusterGroup>
          <MapClickHandler />
        </MapContainer>
      </div>
    );
  },
);

Map.displayName = "Map";

/**
 * Internal function to get tile layer URL based on tile theme
 */
function getTileLayerUrl(
  tileTheme: "default" | "dark" | "light" | "satellite",
): string {
  if (tileTheme === "dark") {
    return "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  }
  if (tileTheme === "light") {
    return "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
  }
  if (tileTheme === "satellite") {
    return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  }
  return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
}
