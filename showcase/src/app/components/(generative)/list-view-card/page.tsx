"use client";

import { CLI } from "@/components/cli";
import { ListChatInterface } from "@/components/generative/ListChatInterface";
import { CopyablePrompt, Section } from "@/components/ui/doc-components";
import { ShowcaseThemeProvider } from "@/providers/showcase-theme-provider";
import { TamboProvider } from "@tambo-ai/react";
import { DemoWrapper } from "../../demo-wrapper";

export default function ListViewCardComponentPage() {
  const installCommand = "npx tambo add list-view-card";

  const examplePrompt = `Create a file browser list with the following items:
- Document files (📄 icon) with titles like "Report.pdf", "Presentation.pptx", "Notes.txt"
- Image files (🖼️ icon) with titles like "Photo1.jpg", "Screenshot.png", "Logo.svg"
- Video files (🎥 icon) with titles like "Tutorial.mp4", "Demo.webm", "Recording.mov"
Make it use the bordered variant with medium size and single selection mode.`;

  return (
    <div className="container mx-auto pt-6 px-6 max-w-4xl">
      <ShowcaseThemeProvider defaultTheme="light">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold mb-4">ListViewCard</h1>
            <p className="text-lg text-secondary">
              A high-performance, virtualized list component with selection modes, keyboard navigation, and ARIA support.
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

          <DemoWrapper title="ListViewCard" height={800}>
            <TamboProvider
              apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? ""}
              tamboUrl={process.env.NEXT_PUBLIC_TAMBO_API_URL ?? ""}
            >
              <ListChatInterface />
            </TamboProvider>
          </DemoWrapper>
        </div>
      </ShowcaseThemeProvider>
    </div>
  );
}

