"use client";

import { mapSchema } from "@/components/ui/map";
import { MessageThreadFull } from "@/components/ui/message-thread-full";
import { useUserContextKey } from "@/lib/useUserContextKey";
import { useTambo } from "@tambo-ai/react";
import { useEffect } from "react";

import dynamic from "next/dynamic";

const MapWithNoSSR = dynamic(
  async () => await import("../ui/map").then((mod) => mod.Map),
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
        - heatData: Array<{ lat, lng, intensity? }> (optional)
        - zoom: number (1-20, default 10)

      Best practices:
        - Use valid coordinates (lat: -90 to 90, lng: -180 to 180)
        - Provide clear labels for markers
        - Choose zoom level appropriate for your data
        
      Example use cases: store locations, real estate, events, analytics, travel, business intelligence.`,
      component: MapWithNoSSR,
      propsSchema: mapSchema,
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
