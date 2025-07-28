"use client";

import { cn } from "@/lib/utils";
import {
  createElementObject,
  createLayerComponent,
  updateGridLayer,
  type LayerProps,
  type LeafletContextInterface,
} from "@react-leaflet/core";
import { useTambo, useTamboMessageContext } from "@tambo-ai/react";
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
import { z } from "zod";

// --- MarkerClusterGroup ---
interface MarkerClusterGroupProps extends MarkerClusterGroupOptions {
  children?: React.ReactNode;
  iconCreateFunction?: (cluster: L.MarkerCluster) => L.DivIcon;
}

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

// --- HeatLayer ---
interface HeatLayerProps extends LayerProps, L.HeatMapOptions {
  latlngs: (LatLng | HeatLatLngTuple)[];
}
const createHeatLayer = (
  { latlngs, ...options }: HeatLayerProps,
  context: LeafletContextInterface,
) => {
  const layer = L.heatLayer(latlngs, options);
  return createElementObject(layer, context);
};
const updateHeatLayer = (
  layer: L.HeatLayer,
  { latlngs, ...options }: HeatLayerProps,
  prevProps: HeatLayerProps,
) => {
  layer.setLatLngs(latlngs);
  layer.setOptions(options);
  updateGridLayer(layer, options, prevProps);
};
const HeatLayer = createLayerComponent<L.HeatLayer, HeatLayerProps>(
  createHeatLayer,
  updateHeatLayer,
);

// --- Leaflet marker icon fix (only SSR/Next.js) ---
if (typeof window !== "undefined") {
  import("leaflet").then((L) => {
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
    import("leaflet.heat");
  });
}

// --- Map Variants ---
export const mapVariants = cva("w-full transition-all duration-200", {
  variants: {
    size: {
      sm: "h-[200px]",
      md: "h-[300px]",
      lg: "h-[500px]",
      full: "h-full w-full",
    },
    theme: {
      default: "bg-background border border-border rounded-lg",
      dark: "bg-zinc-900 border border-zinc-800 rounded-lg",
      light: "bg-white border border-zinc-200 rounded-lg",
      satellite: "bg-black border border-zinc-900 rounded-lg",
      bordered: "border-2 border-primary",
      shadow: "shadow-lg",
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
    theme: "default",
    rounded: "md",
  },
});

/**
 * MapProps - Interface for the Map component
 * @property center - Center coordinates of the map (required)
 * @property zoom - Initial zoom level (default: 10)
 * @property markers - Array of marker objects (lat, lng, label, id?)
 * @property heatData - Optional array of heatmap points (lat, lng, intensity)
 * @property zoomControl - Show zoom controls (default: true)
 * @property className - Optional className for container
 * @property size - Variant de tamanho (sm, md, lg, full)
 * @property theme - Variant de tema (default, dark, light, satellite, bordered, shadow)
 * @property rounded - Variant de borda (none, sm, md, full)
 */

// --- Zod Schemas ---
export const markerSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  label: z.string(),
  id: z.string().optional(),
});
export const heatDataSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  intensity: z.number().min(0).max(1),
});
export const mapSchema = z.object({
  center: z.object({ lat: z.number(), lng: z.number() }),
  zoom: z.number().min(1).max(20).default(10),
  markers: z.array(markerSchema).default([]),
  heatData: z.array(heatDataSchema).optional().nullable(),
  zoomControl: z.boolean().optional().default(true),
  className: z
    .string()
    .optional()
    .describe("Optional tailwind className for the map container"),
  size: z.enum(["sm", "md", "lg", "full"]).optional(),
  theme: z
    .enum(["default", "dark", "light", "satellite", "bordered", "shadow"])
    .optional(),
  rounded: z.enum(["none", "sm", "md", "full"]).optional(),
});

export type MarkerData = z.infer<typeof markerSchema>;
export type HeatData = z.infer<typeof heatDataSchema>;
export type MapProps = z.infer<typeof mapSchema> &
  VariantProps<typeof mapVariants>;

// --- Hooks ---
function useValidMarkers(markers: MarkerData[] = []) {
  return React.useMemo(
    () =>
      markers.filter(
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

// --- Loading Spinner ---
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

// --- Handlers ---
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

// --- Map Component ---
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
      theme = "default",
      rounded = "md",
      ...props
    },
    ref,
  ) => {
    const { thread } = useTambo();
    const { messageId } = useTamboMessageContext();

    const message = thread?.messages[thread?.messages.length - 1];

    const isLatestMessage = message?.id === messageId;

    const generationStage = thread?.generationStage;
    const isGenerating =
      generationStage &&
      generationStage !== "COMPLETE" &&
      generationStage !== "ERROR";

    const validMarkers = useValidMarkers(markers);
    const validHeatData = useValidHeatData(heatData);

    // Loading/generation State
    if (isLatestMessage && isGenerating) {
      return (
        <div
          ref={ref}
          className={cn(mapVariants({ size, theme, rounded }), className)}
          {...props}
        >
          <LoadingSpinner />
        </div>
      );
    }
    if (!center) {
      return (
        <div
          ref={ref}
          className={cn(mapVariants({ size, theme, rounded }), className)}
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
          mapVariants({ size, theme, rounded }),
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
          <TileLayer
            url={
              theme === "dark"
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                : theme === "light"
                  ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  : theme === "satellite"
                    ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            }
          />

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
              const iconSize =
                size === "small" ? 32 : size === "medium" ? 40 : 48;
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
