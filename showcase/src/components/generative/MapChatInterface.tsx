"use client";

import { MessageThreadFull } from "@tambo-ai/ui-registry/components/message-thread-full";
import { useTambo } from "@tambo-ai/react";
import { useEffect } from "react";

export const MapChatInterface = () => {
  const { registerComponent } = useTambo();

  useEffect(() => {
    const register = async () => {
      /* Dynamically import the Map component and its schema */
      const mod = await import("@tambo-ai/ui-registry/components/map");
      const mapSchema = mod.mapSchema;
      const Map = mod.Map;

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
        component: Map,
        propsSchema: mapSchema,
      });
    };

    void register();
  }, [registerComponent]);

  return (
    <div className="flex flex-col" style={{ height: "700px" }}>
      <MessageThreadFull className="rounded-lg" />
    </div>
  );
};
