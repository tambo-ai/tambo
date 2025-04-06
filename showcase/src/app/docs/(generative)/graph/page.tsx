"use client";

import { CLI } from "@/components/cli";
import { CopyablePrompt, Section } from "@/components/ui/doc-components";
import { MessageThreadFull } from "@/components/ui/message-thread-full";
import { ShowcaseThemeProvider } from "@/providers/showcase-theme-provider";
import { TamboProvider } from "@tambo-ai/react";

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
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-4">Graph Component</h1>
            <p className="text-lg text-muted-foreground mb-6">
              A versatile data visualization component that supports bar charts,
              line charts, and pie charts with customizable styles.
            </p>
          </div>

          <Section title="Example Prompt">
            <CopyablePrompt prompt={examplePrompt} />
          </Section>

          <Section title="Chat Interface">
            <div className="rounded-lg bg-background border border-border/40">
              <TamboProvider
                apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? ""}
              >
                <div className="h-[500px]">
                  <MessageThreadFull contextKey="graph-thread" />
                </div>
              </TamboProvider>
            </div>
          </Section>

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
