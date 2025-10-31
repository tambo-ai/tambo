"use client";

import { ComponentCodePreview } from "@/components/component-code-preview";
import { InstallationSection } from "@/components/installation-section";
import { MapChatInterface } from "@/components/generative/MapChatInterface";
import { TamboProvider } from "@tambo-ai/react";

export default function MapPage() {
  return (
    <div className="prose max-w-full">
      {/* Title & Description */}
      <h1>Map</h1>
      <p className="text-lg text-muted-foreground">
        An interactive map component with markers, pan/zoom functionality, and
        tooltip support powered by Leaflet and OpenStreetMap. Perfect for
        location-based visualizations and geographic data displays.
      </p>

      {/* Examples Section */}
      <h2 className="mt-12">Examples</h2>

      <ComponentCodePreview
        title="Seattle Coffee Map"
        component={
          <TamboProvider
            apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? ""}
            tamboUrl={process.env.NEXT_PUBLIC_TAMBO_API_URL ?? ""}
          >
            <MapChatInterface />
          </TamboProvider>
        }
        code={`import { Map } from "@tambo-ai/react";

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
          tooltip: "Historic farmers market"
        },
        {
          position: [47.6205, -122.3493],
          label: "Space Needle",
          tooltip: "Iconic observation tower"
        },
        {
          position: [47.6553, -122.3035],
          label: "University of Washington",
          tooltip: "Public research university"
        },
        {
          position: [47.6247, -122.3207],
          label: "Capitol Hill",
          tooltip: "Vibrant neighborhood"
        },
        {
          position: [47.6513, -122.3471],
          label: "Fremont Troll",
          tooltip: "Public sculpture under bridge"
        }
      ]}
      variant="solid"
      size="large"
    />
  );
}`}
        previewClassName="p-8 min-h-[600px]"
      />

      {/* Installation */}
      <InstallationSection cliCommand="npx tambo add map" />

      {/* Component API */}
      <h2 className="mt-12">Component API</h2>

      <h3>Map</h3>

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
            <td>&quot;small&quot; | &quot;medium&quot; | &quot;large&quot;</td>
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

      <h3>MapMarker</h3>

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
  );
}
