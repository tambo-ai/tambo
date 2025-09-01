"use client";

import { CLI } from "@/components/cli";
import { CarouselChatInterface } from "@/components/generative/CarouselChatInterface";
import { CopyablePrompt, Section } from "@/components/ui/doc-components";
import { ShowcaseThemeProvider } from "@/providers/showcase-theme-provider";
import { TamboProvider } from "@tambo-ai/react";
import { DemoWrapper } from "../../demo-wrapper";

export default function CarouselComponentPage() {
  const installCommand = "npx tambo add carousel-view";

  const examplePrompts = [
    `Create a product showcase carousel with the following items:
- Premium Headphones: "High-quality wireless headphones with noise cancellation"
- Smart Watch: "Advanced fitness tracking and notifications"
- Wireless Speaker: "Portable speaker with premium sound quality"
- Gaming Mouse: "Precision gaming mouse with RGB lighting"
Make it show 1 item at a time, enable autoplay every 4 seconds, and allow looping.`,

    `Build a team member gallery carousel:
- Sarah Johnson (Lead Designer)
- Mike Chen (Senior Developer) 
- Emily Rodriguez (Product Manager)
- Alex Thompson (UX Researcher)
Show 3 members at once, no autoplay, and include profile images.`,

    `Create an image gallery carousel for a portfolio:
- "Mountain Landscape" - Nature photography
- "City Skyline" - Urban architecture
- "Ocean Sunset" - Seascape photography
- "Forest Path" - Woodland scenery
Single image view with navigation arrows and looping enabled.`,
  ];

  return (
    <div className="container mx-auto pt-6 px-6 max-w-4xl">
      <ShowcaseThemeProvider defaultTheme="light">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold mb-4">Carousel View</h1>
            <p className="text-lg text-secondary">
              An interactive carousel component that displays mixed media items
              with navigation, touch/swipe support, and AI-driven interactions.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Installation</h2>
            <div className="rounded-md">
              <CLI command={installCommand} />
            </div>
          </div>

          <Section title="Example Prompts">
            <div className="space-y-4">
              {examplePrompts.map((prompt, index) => (
                <div key={index}>
                  <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                    Example {index + 1}:
                  </h4>
                  <CopyablePrompt prompt={prompt} />
                </div>
              ))}
            </div>
          </Section>

          <DemoWrapper title="Carousel View" height={800}>
            <TamboProvider
              apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? ""}
              tamboUrl={process.env.NEXT_PUBLIC_TAMBO_API_URL ?? ""}
            >
              <CarouselChatInterface />
            </TamboProvider>
          </DemoWrapper>
        </div>
      </ShowcaseThemeProvider>
    </div>
  );
}
