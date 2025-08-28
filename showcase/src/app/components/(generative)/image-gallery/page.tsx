"use client";

import { CLI } from "@/components/cli";
import { CopyablePrompt, Section } from "@/components/ui/doc-components";
import { SyntaxHighlighter } from "@/components/ui/syntax-highlighter";
import { ShowcaseThemeProvider } from "@/providers/showcase-theme-provider";
import { TamboStubProvider } from "@tambo-ai/react";
import { DemoWrapper } from "../../demo-wrapper";
import * as React from "react";

// Import ImageGallery directly
import { ImageGallery } from "@/components/ui/image-gallery";
import { TamboMessageProvider } from "@tambo-ai/react";

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

// Mock thread for TamboStubProvider
const mockThread = {
  id: "mock-gallery-thread",
  name: "Image Gallery Demo",
  messages: [
    {
      id: "mock-gallery-msg",
      role: "assistant" as const,
      threadId: "mock-gallery-thread",
      createdAt: new Date().toISOString(),
      componentState: {},
      content: [{ type: "text" as const, text: "Image Gallery Component" }],
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  projectId: "mock-project",
  metadata: {},
};

// Wrapper component to handle Tambo context
const ImageGalleryWrapper = ({
  sources,
  className,
}: {
  sources: Array<{ src: string; alt: string; caption?: string }>;
  className?: string;
}) => {
  return (
    <TamboStubProvider thread={mockThread}>
      <TamboMessageProvider message={mockThread.messages[0]}>
        <ImageGallery sources={sources} className={className} />
      </TamboMessageProvider>
    </TamboStubProvider>
  );
};

export default function ImageGalleryPage() {
  return (
    <ShowcaseThemeProvider>
      <div className="container mx-auto py-8 space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">Image Gallery</h1>
          <p className="text-lg text-muted-foreground">
            A responsive image gallery component built with carousel navigation,
            thumbnail strip, and lazy loading support.
          </p>
        </div>

        <Section title="Basic Usage">
          <DemoWrapper title="Basic Image Gallery" className="p-6">
            <div className="h-96 w-full">
              <ImageGalleryWrapper sources={sampleImages} />
            </div>
          </DemoWrapper>
        </Section>

        <Section title="Subset of Images">
          <DemoWrapper title="Subset of Images" className="p-6">
            <div className="h-64 w-full">
              <ImageGalleryWrapper sources={sampleImages.slice(0, 3)} />
            </div>
          </DemoWrapper>
        </Section>

        <Section title="Mixed Aspect Ratios">
          <DemoWrapper title="Mixed Aspect Ratios" className="p-6">
            <div className="h-80 w-full">
              <ImageGalleryWrapper sources={sampleImages} />
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
  autoplay={false}
  autoplayDelay={3000}
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
                <h4 className="font-semibold">autoplay</h4>
                <p className="text-sm text-muted-foreground">
                  Enable automatic slideshow (default: false)
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">autoplayDelay</h4>
                <p className="text-sm text-muted-foreground">
                  Delay between slides in milliseconds (default: 3000)
                </p>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Features">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border rounded-lg">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border border-border px-4 py-3 text-left font-semibold">
                    Category
                  </th>
                  <th className="border border-border px-4 py-3 text-left font-semibold">
                    Features
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="border border-border px-4 py-3 font-medium">
                    Navigation
                  </td>
                  <td className="border border-border px-4 py-3">
                    <ul className="space-y-1 text-sm">
                      <li>• Keyboard arrows (← →)</li>
                      <li>• Click navigation buttons</li>
                      <li>• Touch/swipe gestures</li>
                    </ul>
                  </td>
                </tr>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="border border-border px-4 py-3 font-medium">
                    Zoom & Rotation
                  </td>
                  <td className="border border-border px-4 py-3">
                    <ul className="space-y-1 text-sm">
                      <li>• Keyboard zoom (+/-)</li>
                      <li>• Pinch-to-zoom support</li>
                      <li>• Image rotation controls</li>
                    </ul>
                  </td>
                </tr>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="border border-border px-4 py-3 font-medium">
                    Performance
                  </td>
                  <td className="border border-border px-4 py-3">
                    <ul className="space-y-1 text-sm">
                      <li>• Lazy loading for large galleries</li>
                      <li>• High-DPI display support</li>
                      <li>• EXIF orientation handling</li>
                    </ul>
                  </td>
                </tr>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="border border-border px-4 py-3 font-medium">
                    Accessibility
                  </td>
                  <td className="border border-border px-4 py-3">
                    <ul className="space-y-1 text-sm">
                      <li>• Full keyboard navigation</li>
                      <li>• Screen reader support</li>
                      <li>• Focus management</li>
                    </ul>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Prompts to Try">
          <div className="space-y-3 p-4 bg-muted/20 rounded-lg border">
            <CopyablePrompt prompt="Create an image gallery showing my vacation photos with zoom and navigation" />
            <CopyablePrompt prompt="Display a product gallery with thumbnails and full-size preview" />
            <CopyablePrompt prompt="Show me a portfolio gallery with mixed aspect ratio images" />
          </div>
        </Section>
      </div>
    </ShowcaseThemeProvider>
  );
}
