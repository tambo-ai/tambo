"use client";

import { CLI } from "@/components/cli";
import { CanvasChatInterface } from "@/components/generative/CanvasChatInterface";
import { CopyablePrompt, Section } from "@/components/ui/doc-components";
import { ShowcaseThemeProvider } from "@/providers/showcase-theme-provider";
import { DemoWrapper } from "../../demo-wrapper";

export default function CanvasSpacePage() {
  const installCommand = "npx tambo add canvas-space";
  const examplePrompt = `Generate a line chart showing monthly website traffic:
  - Title: "Monthly Website Visitors"
  - Labels: Jan, Feb, Mar, Apr, May, Jun, Jul, Aug
  - Datasets:
    - Unique Visitors: 5K, 6.2K, 7.1K, 6.8K, 8K, 9.5K, 11K, 10.5K
    - Page Views: 25K, 30K, 35K, 33K, 40K, 48K, 55K, 52K
  - Use the default variant, medium size
  - Show tooltips and the legend`;

  return (
    <div className="container mx-auto pt-6 px-6 max-w-4xl">
      <ShowcaseThemeProvider defaultTheme="light">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold mb-4">Canvas Space</h1>
            <p className="text-lg text-secondary">
              A dedicated area that dynamically displays interactive UI
              components generated within a Tambo chat thread. It automatically
              updates to show the latest component and clears when switching
              threads.
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

          <DemoWrapper title="Canvas Space" height={800}>
            <CanvasChatInterface />
          </DemoWrapper>
        </div>
      </ShowcaseThemeProvider>
    </div>
  );
}
