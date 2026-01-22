"use client";

import { ComponentCodePreview } from "@/components/component-code-preview";
import { InstallationSection } from "@/components/installation-section";
import { MapChatInterface } from "@/components/generative/MapChatInterface";

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

      {/* Examples Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Examples</h2>

        <p className="text-sm text-muted-foreground">
          This interactive demo runs inside the showcase&apos;s app-level
          TamboProvider, which sets a per-user context key (persisted in
          localStorage).
        </p>

        <div className="space-y-6">
          <ComponentCodePreview
            title="Seattle Coffee Map"
            component={<MapChatInterface />}
            code={`import { Map } from "@/components/tambo/map";

export function SeattleCoffeeMap() {
  return (
    <Map
      title="Seattle Coffee Map"
      center={[47.6062, -122.3321]}
      zoom={12}
      markers={[
        {
          position: [47.6097, -122.3417],
          label: "Pike Place Market",
          tooltip: "Historic farmers market",
        },
        {
          position: [47.6205, -122.3493],
          label: "Space Needle",
          tooltip: "Iconic observation tower",
        },
        {
          position: [47.6553, -122.3035],
          label: "University of Washington",
          tooltip: "Public research university",
        },
        {
          position: [47.6247, -122.3207],
          label: "Capitol Hill",
          tooltip: "Vibrant neighborhood",
        },
        {
          position: [47.6513, -122.3471],
          label: "Fremont Troll",
          tooltip: "Public sculpture under bridge",
        },
      ]}
      variant="solid"
      size="large"
    />
  );
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
                  <td>title</td>
                  <td>string</td>
                  <td>-</td>
                  <td>Map title displayed above the map</td>
                </tr>
                <tr>
                  <td>description</td>
                  <td>string</td>
                  <td>-</td>
                  <td>Optional description text below the title</td>
                </tr>
                <tr>
                  <td>center</td>
                  <td>[number, number]</td>
                  <td>[0, 0]</td>
                  <td>Map center coordinates [latitude, longitude]</td>
                </tr>
                <tr>
                  <td>zoom</td>
                  <td>number</td>
                  <td>10</td>
                  <td>Initial zoom level (1-18)</td>
                </tr>
                <tr>
                  <td>markers</td>
                  <td>MapMarker[]</td>
                  <td>[]</td>
                  <td>Array of marker configurations</td>
                </tr>
                <tr>
                  <td>variant</td>
                  <td>&quot;solid&quot; | &quot;bordered&quot;</td>
                  <td>&quot;solid&quot;</td>
                  <td>Visual style of the map container</td>
                </tr>
                <tr>
                  <td>size</td>
                  <td>
                    &quot;small&quot; | &quot;medium&quot; | &quot;large&quot;
                  </td>
                  <td>&quot;medium&quot;</td>
                  <td>Height of the map container</td>
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
                  <td>position</td>
                  <td>[number, number]</td>
                  <td>-</td>
                  <td>Marker coordinates [latitude, longitude]</td>
                </tr>
                <tr>
                  <td>label</td>
                  <td>string</td>
                  <td>-</td>
                  <td>Marker label displayed in popup</td>
                </tr>
                <tr>
                  <td>tooltip</td>
                  <td>string</td>
                  <td>-</td>
                  <td>Tooltip text shown on hover</td>
                </tr>
                <tr>
                  <td>icon</td>
                  <td>string</td>
                  <td>-</td>
                  <td>Custom marker icon URL</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
