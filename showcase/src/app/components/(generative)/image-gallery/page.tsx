"use client";

import { CLI } from "@/components/cli";
import { CopyablePrompt, Section } from "@/components/ui/doc-components";
import { SyntaxHighlighter } from "@/components/ui/syntax-highlighter";
import { ShowcaseThemeProvider } from "@/providers/showcase-theme-provider";
import { DemoWrapper } from "../../demo-wrapper";
import dynamic from "next/dynamic";
import * as React from "react";

// Dynamically import ImageGallery with SSR disabled
const ImageGallery = dynamic(
  async () => {
    const mod = await import("@/components/ui/image-gallery");
    return { default: mod.ImageGallery };
  },
  {
    ssr: false,
    loading: () => (
      <div className="h-96 w-full flex items-center justify-center">
        Loading gallery...
      </div>
    ),
  },
);

const sampleImages = [
  {
    src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
    alt: "Mountain landscape",
    caption: "Beautiful mountain vista with snow-capped peaks",
  },
  {
    src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=800&fit=crop",
    alt: "Forest path",
    caption: "Serene forest trail in autumn",
  },
  {
    src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=900&fit=crop",
    alt: "Lake reflection",
    caption: "Perfect lake reflection at sunset",
  },
  {
    src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop",
    alt: "Portrait mountain",
    caption: "Vertical mountain composition",
  },
  {
    src: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=500&fit=crop",
    alt: "Ocean waves",
    caption: "Powerful ocean waves crashing on rocks",
  },
];

export default function ImageGalleryPage() {
  return (
    <ShowcaseThemeProvider>
      <div className="container mx-auto py-8 space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">Image Gallery</h1>
          <p className="text-lg text-muted-foreground">
            A responsive image gallery component with zoom, rotation,
            navigation, and lazy loading support.
          </p>
        </div>

        <Section title="Basic Usage">
          <DemoWrapper title="Basic Image Gallery" className="p-6">
            <div className="h-96 w-full">
              <ImageGallery
                sources={sampleImages}
                initialIndex={0}
                fit="contain"
              />
            </div>
          </DemoWrapper>
        </Section>

        <Section title="Cover Fit Mode">
          <DemoWrapper title="Cover Fit Mode" className="p-6">
            <div className="h-64 w-full">
              <ImageGallery
                sources={sampleImages.slice(0, 3)}
                initialIndex={1}
                fit="cover"
              />
            </div>
          </DemoWrapper>
        </Section>

        <Section title="Mixed Aspect Ratios">
          <DemoWrapper title="Mixed Aspect Ratios" className="p-6">
            <div className="h-80 w-full">
              <ImageGallery
                sources={sampleImages}
                initialIndex={2}
                fit="contain"
              />
            </div>
          </DemoWrapper>
        </Section>

        <Section title="Installation">
          <CLI command="npx tambo add image-gallery" />
        </Section>

        <Section title="Usage">
          <SyntaxHighlighter
            code={`import { ImageGallery } from "@/components/ui/image-gallery";

const images = [
  {
    src: "/path/to/image1.jpg",
    alt: "Description of image 1",
    caption: "Optional caption for image 1"
  },
  {
    src: "/path/to/image2.jpg",
    alt: "Description of image 2"
  }
];

<ImageGallery
  sources={images}
  initialIndex={0}
  fit="contain"
/>`}
            language="tsx"
          />
        </Section>

        <Section title="Props">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">sources</h4>
                <p className="text-sm text-muted-foreground">
                  Array of image objects with src, alt, and optional caption
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">initialIndex</h4>
                <p className="text-sm text-muted-foreground">
                  Starting image index (default: 0)
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">fit</h4>
                <p className="text-sm text-muted-foreground">
                  Image fit mode: &apos;contain&apos; or &apos;cover&apos;
                  (default: &apos;contain&apos;)
                </p>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Features">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Navigation</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Keyboard arrows (&larr; &rarr;)</li>
                <li>• Click navigation buttons</li>
                <li>• Touch/swipe gestures</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Zoom & Rotation</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Keyboard zoom (+/-)</li>
                <li>• Pinch-to-zoom support</li>
                <li>• Image rotation controls</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Performance</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Lazy loading for large galleries</li>
                <li>• High-DPI display support</li>
                <li>• EXIF orientation handling</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Accessibility</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Full keyboard navigation</li>
                <li>• Screen reader support</li>
                <li>• Focus management</li>
              </ul>
            </div>
          </div>
        </Section>

        <Section title="Prompts to Try">
          <div className="space-y-2">
            <CopyablePrompt prompt="Create an image gallery showing my vacation photos with zoom and navigation" />
            <CopyablePrompt prompt="Display a product gallery with thumbnails and full-size preview" />
            <CopyablePrompt prompt="Show me a portfolio gallery with mixed aspect ratio images" />
          </div>
        </Section>
      </div>
    </ShowcaseThemeProvider>
  );
}
