"use client";

import { CLI } from "@/components/cli";
import { GraphChatInterface } from "@/components/generative/GraphChatInterface";
import { CopyablePrompt, Section } from "@/components/ui/doc-components";
import { ShowcaseThemeProvider } from "@/providers/showcase-theme-provider";
import { TamboProvider } from "@tambo-ai/react";
import { DemoWrapper } from "../../demo-wrapper";

export default function GraphPage() {
  const installCommand = "npx tambo add graph";

  const examplePrompt = `Create a bar chart for quarterly sales:
- Title: "Quarterly Sales"
- Labels: Q1, Q2, Q3, Q4
- Datasets:
  - Revenue: 120K, 150K, 180K, 200K
  - Expenses: 80K, 95K, 110K, 125K
- Bordered variant, large size
- Show legend`;

  return (
    <div className="container mx-auto pt-6 px-6 max-w-4xl">
      <ShowcaseThemeProvider defaultTheme="light">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold mb-4">Graph</h1>
            <p className="text-lg text-secondary">
              A versatile data visualization component that supports bar charts,
              line charts, and pie charts with customizable styles.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Installation</h2>
            <div className="rounded-md">
              <CLI command={installCommand} />
            </div>
          </div>

          <h2 className="text-xl font-semibold">Examples</h2>
          <Section title="Example Prompt" as="h3">
            <CopyablePrompt prompt={examplePrompt} />
          </Section>

          <h3 className="text-lg font-medium mb-3">Live Demo</h3>
          <DemoWrapper title="Graph" height={800} hidePreviewHeading>
            <TamboProvider
              apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? ""}
              tamboUrl={process.env.NEXT_PUBLIC_TAMBO_API_URL ?? ""}
            >
              <GraphChatInterface />
            </TamboProvider>
          </DemoWrapper>
        </div>
      </ShowcaseThemeProvider>
    </div>
  );
}
