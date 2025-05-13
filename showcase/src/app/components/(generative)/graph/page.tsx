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

          <Section title="Example Prompt">
            <CopyablePrompt prompt={examplePrompt} />
          </Section>

          <DemoWrapper title="Graph" height={800}>
            <TamboProvider
              apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? ""}
              tamboUrl="http://localhost:4000"
            >
              <GraphChatInterface />
            </TamboProvider>
          </DemoWrapper>

          <Section title="Installation">
            <div className="rounded-md">
              <CLI command={installCommand} />
            </div>
          </Section>
        </div>
      </ShowcaseThemeProvider>
    </div>
  );
}
