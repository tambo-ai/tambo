"use client";

import { MessageThreadFull } from "@/components/ui/message-thread-full";
import { useUserContextKey } from "@/lib/useUserContextKey";
import { useTambo } from "@tambo-ai/react";
import { useEffect } from "react";

import dynamic from "next/dynamic";

const MapWithNoSSR = dynamic(
  async () => await import("../ui/map").then((mod) => mod.MapComponent),
  {
    ssr: false,
  },
);

export const MapChatInterface = () => {
  const userContextKey = useUserContextKey("map-thread");
  const { registerComponent, thread } = useTambo();

  useEffect(() => {
    registerComponent({
      name: "Map",
      description: `Interactive map for visualizing geographic data with markers, clustering, and optional heatmap overlays. Ideal for dashboards, store locators, event maps, and spatial analytics.

Features:
- Pan/zoom controls
- Custom markers with tooltips
- Marker clustering for large datasets
- Optional heatmap for density visualization
- Responsive and mobile-friendly

Props:
- center: { lat, lng } (required)
- markers: Array<{ lat, lng, label, id? }> (required)
- zoom: number (1-20, default 10)
- heatData: Array<{ lat, lng, intensity? }> (optional)

Best practices:
- Use valid coordinates (lat: -90 to 90, lng: -180 to 180)
- Provide clear labels for markers
- Choose zoom level appropriate for your data

Example use cases: store locations, real estate, events, analytics, travel, business intelligence.
`,
      component: MapWithNoSSR,
      propsDefinition: {
        type: "object",
        properties: {
          center: {
            type: "object",
            description: "The initial center position of the map",
            properties: {
              lat: {
                type: "number",
                minimum: -90,
                maximum: 90,
                description: "Center latitude coordinate (-90 to 90)",
              },
              lng: {
                type: "number",
                minimum: -180,
                maximum: 180,
                description: "Center longitude coordinate (-180 to 180)",
              },
            },
            required: ["lat", "lng"],
          },
          zoom: {
            type: "number",
            minimum: 1,
            maximum: 20,
            description:
              "Initial zoom level (1 = world view, 20 = street level)",
            default: 10,
          },
          markers: {
            type: "array",
            description: "Array of markers to display on the map",
            items: {
              type: "object",
              properties: {
                lat: {
                  type: "number",
                  minimum: -90,
                  maximum: 90,
                  description: "Marker latitude coordinate",
                },
                lng: {
                  type: "number",
                  minimum: -180,
                  maximum: 180,
                  description: "Marker longitude coordinate",
                },
                label: {
                  type: "string",
                  description: "Text label to display in the marker tooltip",
                },
                id: {
                  type: "string",
                  description: "Optional unique identifier for the marker",
                },
              },
              required: ["lat", "lng", "label"],
            },
          },
          heatData: {
            type: "array",
            description:
              "Optional heat map data points for density visualization",
            items: {
              type: "object",
              properties: {
                lat: {
                  type: "number",
                  minimum: -90,
                  maximum: 90,
                  description: "Heat point latitude coordinate",
                },
                lng: {
                  type: "number",
                  minimum: -180,
                  maximum: 180,
                  description: "Heat point longitude coordinate",
                },
                intensity: {
                  type: "number",
                  minimum: 0,
                  maximum: 1,
                  description: "Heat intensity value (0 to 1)",
                },
              },
              required: ["lat", "lng", "intensity"],
            },
          },
          className: {
            type: "string",
            description:
              "Additional Tailwind CSS classes for styling the map container",
          },
          size: {
            type: "string",
            enum: ["sm", "md", "lg", "full"],
            description: "Map height/size variant (sm, md, lg, full)",
            default: "md",
          },
          theme: {
            type: "string",
            enum: [
              "default",
              "dark",
              "light",
              "satellite",
              "bordered",
              "shadow",
            ],
            description:
              "Map theme variant (default, dark, light, satellite, bordered, shadow)",
            default: "default",
          },
          rounded: {
            type: "string",
            enum: ["none", "sm", "md", "full"],
            description: "Map border radius variant (none, sm, md, full)",
            default: "md",
          },
        },
        required: ["center", "markers"],
        examples: [
          {
            description:
              "NYC Tourist Spots - Popular locations in New York City",
            center: { lat: 40.7128, lng: -74.006 },
            zoom: 12,
            markers: [
              { lat: 40.7128, lng: -74.006, label: "New York City", id: "nyc" },
              {
                lat: 40.7589,
                lng: -73.9851,
                label: "Times Square",
                id: "times-square",
              },
              {
                lat: 40.7505,
                lng: -73.9934,
                label: "Empire State Building",
                id: "empire-state",
              },
              {
                lat: 40.7614,
                lng: -73.9776,
                label: "Central Park",
                id: "central-park",
              },
              {
                lat: 40.6892,
                lng: -74.0445,
                label: "Statue of Liberty",
                id: "statue-liberty",
              },
            ],
          },
          {
            description:
              "San Francisco Bay Area - Tech companies and landmarks",
            center: { lat: 37.7749, lng: -122.4194 },
            zoom: 10,
            markers: [
              {
                lat: 37.7749,
                lng: -122.4194,
                label: "San Francisco",
                id: "sf",
              },
              {
                lat: 37.4419,
                lng: -122.143,
                label: "Google (Palo Alto)",
                id: "google",
              },
              {
                lat: 37.4848,
                lng: -122.1477,
                label: "Meta (Menlo Park)",
                id: "meta",
              },
              {
                lat: 37.3861,
                lng: -122.0839,
                label: "Apple (Cupertino)",
                id: "apple",
              },
              {
                lat: 37.8199,
                lng: -122.4783,
                label: "Golden Gate Bridge",
                id: "golden-gate",
              },
            ],
          },
          {
            description: "European Capitals - Major cities across Europe",
            center: { lat: 50.8503, lng: 4.3517 },
            zoom: 5,
            markers: [
              { lat: 51.5074, lng: -0.1278, label: "London, UK", id: "london" },
              {
                lat: 48.8566,
                lng: 2.3522,
                label: "Paris, France",
                id: "paris",
              },
              {
                lat: 52.52,
                lng: 13.405,
                label: "Berlin, Germany",
                id: "berlin",
              },
              { lat: 41.9028, lng: 12.4964, label: "Rome, Italy", id: "rome" },
              {
                lat: 40.4168,
                lng: -3.7038,
                label: "Madrid, Spain",
                id: "madrid",
              },
              {
                lat: 59.3293,
                lng: 18.0686,
                label: "Stockholm, Sweden",
                id: "stockholm",
              },
            ],
          },
          {
            description: "NYC Crime Heat Map - Crime intensity across NYC",
            center: { lat: 40.7128, lng: -74.006 },
            zoom: 11,
            markers: [
              {
                lat: 40.7128,
                lng: -74.006,
                label: "Manhattan",
                id: "manhattan",
              },
              {
                lat: 40.6782,
                lng: -73.9442,
                label: "Brooklyn",
                id: "brooklyn",
              },
              { lat: 40.7282, lng: -73.7949, label: "Queens", id: "queens" },
              { lat: 40.8176, lng: -73.8582, label: "Bronx", id: "bronx" },
            ],
            heatData: [
              { lat: 40.7589, lng: -73.9851, intensity: 0.8 },
              { lat: 40.7505, lng: -73.9934, intensity: 0.6 },
              { lat: 40.7614, lng: -73.9776, intensity: 0.4 },
              { lat: 40.7282, lng: -73.7949, intensity: 0.9 },
              { lat: 40.6782, lng: -73.9442, intensity: 0.7 },
              { lat: 40.8176, lng: -73.8582, intensity: 0.5 },
              { lat: 40.7831, lng: -73.9712, intensity: 0.3 },
              { lat: 40.7488, lng: -73.9857, intensity: 0.8 },
              { lat: 40.726, lng: -74.0047, intensity: 0.6 },
              { lat: 40.7061, lng: -74.0087, intensity: 0.4 },
            ],
          },
          {
            description: "Custom Styled Map - Tailwind CSS classes applied",
            center: { lat: 40.7128, lng: -74.006 },
            zoom: 12,
            markers: [
              { lat: 40.7128, lng: -74.006, label: "New York City", id: "nyc" },
              {
                lat: 40.7589,
                lng: -73.9851,
                label: "Times Square",
                id: "times-square",
              },
              {
                lat: 40.7505,
                lng: -73.9934,
                label: "Empire State Building",
                id: "empire-state",
              },
            ],
            className:
              "bg-gray-100 rounded-lg shadow-lg border border-gray-300 p-4",
          },
          {
            description: "Dark full map with rounded corners",
            center: { lat: 40.7128, lng: -74.006 },
            zoom: 12,
            markers: [
              { lat: 40.7128, lng: -74.006, label: "New York City", id: "nyc" },
            ],
            size: "full",
            theme: "dark",
            rounded: "full",
          },
          {
            description: "Satellite map, large size, bordered",
            center: { lat: 37.7749, lng: -122.4194 },
            zoom: 10,
            markers: [
              {
                lat: 37.7749,
                lng: -122.4194,
                label: "San Francisco",
                id: "sf",
              },
            ],
            size: "lg",
            theme: "satellite",
            rounded: "md",
          },
        ],
      },
    });
  }, [registerComponent, thread.id]);

  return (
    <div className="relative h-full w-full flex flex-col">
      <MessageThreadFull
        contextKey={userContextKey}
        className="rounded-lg flex-1"
      />
    </div>
  );
};
