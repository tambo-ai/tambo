"use client";

import { CLI } from "@/components/cli";
import { CarouselInterface } from "@/components/generative/CarouselInterface";
import { CopyablePrompt, Section } from "@/components/ui/doc-components";
import { ShowcaseThemeProvider } from "@/providers/showcase-theme-provider";
import { TamboProvider } from "@tambo-ai/react";
import { DemoWrapper } from "../../demo-wrapper";

export default function MapPage() {
  const installCommand = "npx tambo add carousel";

  const examplePrompt = `Create a carousel of products. Include 4 products with a title, a short description, and an image for each. The carousel should show 1 product at a time, loop infinitely, and display the product title and description below each image.
    1. Headphone := https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop 
    2. Luxury Watch := https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop  
    3. Laptop := https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop 
    4. Phone := https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop `;

  return (
    <div className="container mx-auto pt-6 px-6 max-w-4xl">
      <ShowcaseThemeProvider defaultTheme="light">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold mb-4">Map</h1>
            <p className="text-lg text-secondary">
              An interactive Carousel component with swipe/drag, keyboard
              navigation, looping, autoplay, and lazy-loading slides.
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

          <DemoWrapper title="Interactive Carousel" height={800}>
            <TamboProvider
              apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? ""}
              tamboUrl={process.env.NEXT_PUBLIC_TAMBO_API_URL ?? ""}
            >
              <CarouselInterface />
            </TamboProvider>
          </DemoWrapper>
        </div>
      </ShowcaseThemeProvider>
    </div>
  );
}
