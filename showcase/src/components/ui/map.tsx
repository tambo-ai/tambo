"use client";

import { cn } from "@/lib/utils";
import { useTambo, useTamboMessageContext } from "@tambo-ai/react";
import * as React from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  useMapEvents,
} from "react-leaflet";
import { z } from "zod";

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
  });
}

export const markerSchema = z.object({
  lat: z.number().min(-90).max(90).describe("Latitude coordinate"),
  lng: z.number().min(-180).max(180).describe("Longitude coordinate"),
  label: z.string().describe("Label text to display in marker tooltip"),
  id: z
    .string()
    .optional()
    .describe("Optional unique identifier for the marker"),
});

export const heatDataSchema = z.object({
  lat: z.number().min(-90).max(90).describe("Latitude coordinate"),
  lng: z.number().min(-180).max(180).describe("Longitude coordinate"),
  intensity: z
    .number()
    .min(0)
    .max(1)
    .describe("Heat intensity value between 0 and 1"),
});

export const mapSchema = z.object({
  center: z
    .object({
      lat: z.number().min(-90).max(90).describe("Center latitude coordinate"),
      lng: z
        .number()
        .min(-180)
        .max(180)
        .describe("Center longitude coordinate"),
    })
    .describe("Initial center position of the map"),
  zoom: z.number().min(1).max(20).describe("Initial zoom level of the map"),
  markers: z
    .array(markerSchema)
    .describe("Array of markers to display on the map"),
  heatData: z
    .array(heatDataSchema)
    .optional()
    .describe("Optional heat map data points"),
  zoomControl: z
    .boolean()
    .optional()
    .default(true)
    .describe("Enable zoom control"),
  className: z
    .string()
    .optional()
    .describe("Additional CSS classes for styling"),
});

export type MarkerData = z.infer<typeof markerSchema>;
export type HeatData = z.infer<typeof heatDataSchema>;
export type MapProps = z.infer<typeof mapSchema>;

/**
 * A flexible interactive map component with markers and optional heatmap
 * @component
 * @example
 * ```tsx
 * <Map
 *   center={{ lat: 40.7128, lng: -74.0060 }}
 *   zoom={12}
 *   markers={[
 *     { lat: 40.7128, lng: -74.0060, label: "New York City", id: "nyc" },
 *     { lat: 40.7589, lng: -73.9851, label: "Times Square", id: "ts" }
 *   ]}
 *   heatData={[
 *     { lat: 40.7128, lng: -74.0060, intensity: 0.8 },
 *     { lat: 40.7589, lng: -73.9851, intensity: 0.6 }
 *   ]}
 * />
 * ```
 */

export const Map = React.forwardRef<HTMLDivElement, MapProps>(
  (
    {
      center = { lat: 0, lng: 0 },
      zoom = 10,
      markers = [],
      heatData = [],
      zoomControl = true,
      className,
      ...props
    },
    ref,
  ) => {
    const animateRef = React.useRef(true);
    const { thread } = useTambo();
    const { messageId } = useTamboMessageContext();

    const message = thread?.messages[thread?.messages.length - 1];
    const isLatestMessage = message?.id === messageId;

    const generationStage = thread?.generationStage;
    const isGenerating =
      generationStage &&
      generationStage !== "COMPLETE" &&
      generationStage !== "ERROR";

    const validMarkers = React.useMemo(() => {
      const markersToUse = markers || [];
      // Filter markers to ensure they have valid lat, lng, and label
      return markersToUse.filter((marker): marker is MarkerData => {
        if (!marker || typeof marker !== "object") return false;
        if (typeof marker.lat !== "number" || typeof marker.lng !== "number")
          return false;
        if (marker.lat < -90 || marker.lat > 90) return false;
        if (marker.lng < -180 || marker.lng > 180) return false;
        if (!marker.label || typeof marker.label !== "string") return false;
        return true;
      });
    }, [markers]);

    const MapClickHandler = () => {
      useMapEvents({
        click: (e) => {
          const map = e.target;
          map.setView(e.latlng, map.getZoom(), {
            animate: animateRef.current || false,
          });
        },
      });
      return null;
    };

    const LoadingSpinner = () => (
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

    if (isLatestMessage && isGenerating) {
      return (
        <div ref={ref} className={cn(className)} {...props}>
          <LoadingSpinner />
        </div>
      );
    }

    if (!center) {
      return (
        <div ref={ref} className={cn(className)} {...props}>
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
      <div ref={ref} className={cn("h-[300px]", className)} {...props}>
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={zoom}
          className="h-full w-full"
          scrollWheelZoom={true}
          zoomControl={zoomControl}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {heatData.length > 0 && (
            <span>Heatdata is not yet supported in this version.</span>
          )}

          {validMarkers.map((marker: MarkerData, index: number) => {
            const markerId = marker.id || `marker-${index}`;
            return (
              <Marker key={markerId} position={[marker.lat, marker.lng]}>
                <Tooltip>{marker.label}</Tooltip>
              </Marker>
            );
          })}

          <MapClickHandler />
        </MapContainer>
      </div>
    );
  },
);

Map.displayName = "Map";
