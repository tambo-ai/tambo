"use client";

import { CLI } from "@/components/cli";
import { MapChatInterface } from "@/components/generative/MapChatInterface";
import { CopyablePrompt, Section } from "@/components/ui/doc-components";
import { ShowcaseThemeProvider } from "@/providers/showcase-theme-provider";
import { TamboProvider } from "@tambo-ai/react";
import { DemoWrapper } from "../../demo-wrapper";

export default function MapPage() {
  const installCommand = "npx tambo add map";

  const examplePrompt = `Create an interactive map showing coffee shops in Seattle:
- Center the map on Seattle (47.6062, -122.3321)
- Set zoom level to 12
- Add markers for these locations:
  - Pike Place Market (47.6097, -122.3417)
  - Space Needle (47.6205, -122.3493)
  - University of Washington (47.6553, -122.3035)
  - Capitol Hill (47.6247, -122.3207)
  - Fremont Troll (47.6513, -122.3471)
- Title: "Seattle Coffee Map"
- Use solid variant with large size`;

  return (
    <div className="container mx-auto pt-6 px-6 max-w-4xl">
      <ShowcaseThemeProvider defaultTheme="light">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold mb-4">Map</h1>
            <p className="text-lg text-secondary">
              An interactive map component with markers, pan/zoom functionality,
              and tooltip support powered by Leaflet and OpenStreetMap.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Installation</h2>
            <div className="rounded-md">
              <CLI command={installCommand} />
            </div>
          </div>

          <Section title="Example Prompt">
            <CopyablePrompt prompt={examplePrompt} />
          </Section>

          <DemoWrapper title="Interactive Map" height={800}>
            <TamboProvider
              apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? ""}
              tamboUrl={process.env.NEXT_PUBLIC_TAMBO_API_URL ?? ""}
            >
              <MapChatInterface />
            </TamboProvider>
          </DemoWrapper>
        </div>
      </ShowcaseThemeProvider>
    </div>
  );
}
