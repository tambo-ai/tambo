"use client";

import { Map } from "@/components/ui/map";
import { MessageThreadFull } from "@/components/ui/message-thread-full";
import { useUserContextKey } from "@/lib/useUserContextKey";
import { useTambo } from "@tambo-ai/react";
import { useEffect } from "react";

export const MapChatInterface = () => {
  const userContextKey = useUserContextKey("map-thread");
  const { registerComponent, thread } = useTambo();

  useEffect(() => {
    registerComponent({
      name: "Map",
      description: `An interactive map component powered by Leaflet that displays geographical data with markers and pan/zoom functionality.

      Perfect for visualizing location-based data, creating geographical dashboards, showing points of interest, and displaying spatial information.

      Features:
      - Interactive pan and zoom controls
      - Custom markers with labels and coordinates
      - Hover tooltips with detailed information
      - Responsive design that works on all devices
      - OpenStreetMap tiles for global coverage
      - Real-time marker updates during generation
      - Clustering support for large datasets
      - Optional heat map data visualization

      IMPORTANT: All coordinates must be valid:
      - Latitude: -90 to 90 degrees
      - Longitude: -180 to 180 degrees
      - Each marker requires: lat, lng, and label

      Use cases:
      - Store locator maps
      - Real estate listings
      - Event locations
      - Travel itineraries
      - Data visualization dashboards
      - Geographic analysis
      - Business analytics
      - Customer location tracking

      Best practices:
      1. Always provide valid latitude/longitude coordinates
      2. Use descriptive labels for markers
      3. Choose appropriate zoom levels (1-20)
      5. Group nearby markers logically`,
      component: Map,
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
            description: "Additional CSS classes for custom styling",
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
