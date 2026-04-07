"use client";

import { ComponentCodePreview } from "@/components/component-code-preview";
import { InstallationSection } from "@/components/installation-section";
import { MapChatInterface } from "@/components/generative/MapChatInterface";
import dynamic from "next/dynamic";

const Map = dynamic(
  async () => (await import("@tambo-ai/ui-registry/components/map")).Map,
  { ssr: false },
);

export default function MapPage() {
  return (
    <div className="prose max-w-8xl space-y-12">
      {/* Title & Description */}
      <header className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Map
        </h1>
        <p className="text-lg text-muted-foreground">
          An interactive map component with markers, pan/zoom functionality, and
          tooltip support powered by Leaflet and OpenStreetMap. Perfect for
          location-based visualizations and geographic data displays.
        </p>
      </header>

      {/* Example Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Example</h2>

        <div className="space-y-6">
          <ComponentCodePreview
            title="Seattle Landmarks"
            component={
              <Map
                center={{ lat: 47.6062, lng: -122.3321 }}
                zoom={12}
                markers={[
                  {
                    lat: 47.6097,
                    lng: -122.3417,
                    label: "Pike Place Market",
                  },
                  {
                    lat: 47.6205,
                    lng: -122.3493,
                    label: "Space Needle",
                  },
                  {
                    lat: 47.6553,
                    lng: -122.3035,
                    label: "University of Washington",
                  },
                  {
                    lat: 47.6247,
                    lng: -122.3207,
                    label: "Capitol Hill",
                  },
                  {
                    lat: 47.6513,
                    lng: -122.3471,
                    label: "Fremont Troll",
                  },
                ]}
                size="lg"
                zoomControl={true}
              />
            }
            code={`import { Map } from "@/components/tambo/map";

export function SeattleLandmarks() {
  return (
    <Map
      center={{ lat: 47.6062, lng: -122.3321 }}
      zoom={12}
      markers={[
        { lat: 47.6097, lng: -122.3417, label: "Pike Place Market" },
        { lat: 47.6205, lng: -122.3493, label: "Space Needle" },
        {
          lat: 47.6553,
          lng: -122.3035,
          label: "University of Washington",
        },
        { lat: 47.6247, lng: -122.3207, label: "Capitol Hill" },
        { lat: 47.6513, lng: -122.3471, label: "Fremont Troll" },
      ]}
      size="lg"
      zoomControl={true}
    />
  );
}`}
            previewClassName="p-8"
          />
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Interactive Demo</h2>

        <p className="text-sm text-muted-foreground">
          Use natural language to generate and modify maps in real time. This
          interactive demo runs inside the showcase&apos;s app-level
          TamboProvider, which sets a per-user context key (persisted in
          localStorage).
        </p>

        <div className="space-y-6">
          <ComponentCodePreview
            title="AI-Generated Map"
            component={<MapChatInterface />}
            code={`import { Map, mapSchema } from "@/components/tambo/map";
import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { useTambo } from "@tambo-ai/react";
import { useEffect } from "react";

export function MapDemo() {
  const { registerComponent } = useTambo();

  useEffect(() => {
    registerComponent({
      name: "Map",
      description: "Interactive map for visualizing geographic data.",
      component: Map,
      propsSchema: mapSchema,
    });
  }, [registerComponent]);

  return <MessageThreadFull />;
}`}
            previewClassName="p-0"
            minHeight={700}
          />
        </div>
      </section>

      {/* Installation */}
      <section>
        <InstallationSection cliCommand="npx tambo add map" />
      </section>

      {/* Try It Yourself */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Try It Yourself</h2>

        <div className="not-prose space-y-6">
          {/* Step 1 */}
          <div className="space-y-3">
            <h3 className="text-lg font-500 text-foreground">
              1. Install the component
            </h3>
            <pre className="rounded-md border border-border bg-muted/40 p-4">
              <code className="text-sm text-foreground">npx tambo add map</code>
            </pre>
          </div>

          {/* Step 2 */}
          <div className="space-y-3">
            <h3 className="text-lg font-500 text-foreground">
              2. Register with Tambo
            </h3>
            <pre className="rounded-md border border-border bg-muted/40 p-4">
              <code className="text-sm text-foreground">
                {`import { Map, mapSchema } from "@/components/tambo/map";
import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { useTambo } from "@tambo-ai/react";
import { useEffect } from "react";

export function App() {
  const { registerComponent } = useTambo();

  useEffect(() => {
    registerComponent({
      name: "Map",
      description: "Interactive map for visualizing geographic data.",
      component: Map,
      propsSchema: mapSchema,
    });
  }, [registerComponent]);

  return <MessageThreadFull />;
}`}
              </code>
            </pre>
          </div>

          {/* Step 3 */}
          <div className="space-y-3">
            <h3 className="text-lg font-500 text-foreground">
              3. Send a prompt
            </h3>
            <p className="text-sm text-muted-foreground">
              Try these example prompts:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                &rarr; &quot;Plot offices in New York, Austin, and Seattle&quot;
              </li>
              <li>
                &rarr; &quot;Show a map of coffee shops around downtown
                Portland&quot;
              </li>
              <li>
                &rarr; &quot;Create a heatmap of support ticket hotspots in San
                Francisco&quot;
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Component API */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Component API</h2>

        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Map</h3>

            <table>
              <thead>
                <tr>
                  <th>Prop</th>
                  <th>Type</th>
                  <th>Default</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>center</td>
                  <td>
                    {"{"} lat: number; lng: number {"}"}
                  </td>
                  <td>-</td>
                  <td>Map center coordinates</td>
                </tr>
                <tr>
                  <td>zoom</td>
                  <td>number</td>
                  <td>10</td>
                  <td>Initial zoom level (1-20)</td>
                </tr>
                <tr>
                  <td>markers</td>
                  <td>MapMarker[]</td>
                  <td>[]</td>
                  <td>Array of marker configurations</td>
                </tr>
                <tr>
                  <td>heatData</td>
                  <td>HeatData[]</td>
                  <td>-</td>
                  <td>
                    Optional array of heatmap data points (lat, lng, intensity)
                  </td>
                </tr>
                <tr>
                  <td>zoomControl</td>
                  <td>boolean</td>
                  <td>true</td>
                  <td>Whether to show zoom controls</td>
                </tr>
                <tr>
                  <td>size</td>
                  <td>
                    &quot;sm&quot; | &quot;md&quot; | &quot;lg&quot; |
                    &quot;full&quot;
                  </td>
                  <td>&quot;md&quot;</td>
                  <td>Height of the map container</td>
                </tr>
                <tr>
                  <td>tileTheme</td>
                  <td>
                    &quot;default&quot; | &quot;dark&quot; | &quot;light&quot; |
                    &quot;satellite&quot;
                  </td>
                  <td>&quot;default&quot;</td>
                  <td>Map tile layer theme</td>
                </tr>
                <tr>
                  <td>rounded</td>
                  <td>
                    &quot;none&quot; | &quot;sm&quot; | &quot;md&quot; |
                    &quot;full&quot;
                  </td>
                  <td>&quot;md&quot;</td>
                  <td>Border radius of the map container</td>
                </tr>
                <tr>
                  <td>className</td>
                  <td>string</td>
                  <td>-</td>
                  <td>Additional CSS classes for customization</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">MapMarker</h3>

            <table>
              <thead>
                <tr>
                  <th>Prop</th>
                  <th>Type</th>
                  <th>Default</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>lat</td>
                  <td>number</td>
                  <td>-</td>
                  <td>Latitude coordinate (-90 to 90)</td>
                </tr>
                <tr>
                  <td>lng</td>
                  <td>number</td>
                  <td>-</td>
                  <td>Longitude coordinate (-180 to 180)</td>
                </tr>
                <tr>
                  <td>label</td>
                  <td>string</td>
                  <td>-</td>
                  <td>Marker label displayed in tooltip</td>
                </tr>
                <tr>
                  <td>id</td>
                  <td>string</td>
                  <td>-</td>
                  <td>Optional unique identifier for the marker</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
