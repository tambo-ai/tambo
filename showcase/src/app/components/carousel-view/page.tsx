"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CarouselView } from "../../../../../cli/src/registry/carousel-view";
import { Pause, Play, RotateCcw } from "lucide-react";
import React from "react";

interface CarouselShowcaseProps {
  className?: string;
}

const sampleItems = [
  {
    id: "landscape-1",
    title: "Mountain Vista",
    description: "Breathtaking mountain landscape with morning mist",
    media: {
      type: "image" as const,
      url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
      alt: "Mountain landscape with mist",
    },
  },
  {
    id: "city-1",
    title: "Urban Skyline",
    description: "Modern city skyline at golden hour",
    media: {
      type: "image" as const,
      url: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop",
      alt: "City skyline at sunset",
    },
  },
  {
    id: "nature-1",
    title: "Forest Path",
    description: "Serene forest trail in autumn colors",
    media: {
      type: "image" as const,
      url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop",
      alt: "Forest path in autumn",
    },
  },
  {
    id: "custom-card",
    title: "Interactive Card",
    description: "Custom content with interactive elements",
    content: (
      <Card className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0">
        <CardHeader>
          <CardTitle className="text-white">Custom Content</CardTitle>
          <CardDescription className="text-purple-100">
            This slide contains custom React components
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white">
              Interactive
            </span>
            <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white">
              Custom
            </span>
          </div>
          <p className="text-sm text-purple-100">
            You can include any React components, forms, buttons, or interactive
            elements in carousel slides.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="bg-white text-purple-600 hover:bg-purple-50 border-white/30"
            onClick={() => alert("Custom action triggered!")}
          >
            Try Me!
          </Button>
        </CardContent>
      </Card>
    ),
  },
  {
    id: "ocean-1",
    title: "Ocean Waves",
    description: "Peaceful ocean waves at sunset",
    media: {
      type: "image" as const,
      url: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&h=600&fit=crop",
      alt: "Ocean waves at sunset",
    },
  },
];

const productItems = [
  {
    id: "product-1",
    title: "Wireless Headphones",
    description: "Premium noise-canceling headphones",
    media: {
      type: "image" as const,
      url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
      alt: "Wireless headphones",
    },
  },
  {
    id: "product-2",
    title: "Smart Watch",
    description: "Fitness tracking smartwatch",
    media: {
      type: "image" as const,
      url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
      alt: "Smart watch",
    },
  },
  {
    id: "product-3",
    title: "Laptop Computer",
    description: "High-performance laptop",
    media: {
      type: "image" as const,
      url: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop",
      alt: "Laptop computer",
    },
  },
  {
    id: "product-4",
    title: "Smartphone",
    description: "Latest generation smartphone",
    media: {
      type: "image" as const,
      url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
      alt: "Smartphone",
    },
  },
];

function CarouselShowcase({ className }: CarouselShowcaseProps) {
  const [selectedItem, setSelectedItem] = React.useState<string | null>(null);
  const [autoplay, setAutoplay] = React.useState(false);
  const [visibleCount, setVisibleCount] = React.useState(1);

  const handleItemSelect = React.useCallback(
    (item: {
      id: string;
      title: string;
      description?: string;
      media?: { url: string; type: "video" | "image" | "icon"; alt?: string };
      data?: Record<string, unknown>;
    }) => {
      setSelectedItem(item.id);
      console.log("Selected item:", item);
    },
    [],
  );

  const resetSelection = () => {
    setSelectedItem(null);
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          CarouselView Showcase
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Explore the CarouselView component with mixed media content, custom
          slides, and AI integration.
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Carousel Controls</CardTitle>
          <CardDescription>
            Interact with the carousel settings to see how AI can control the
            component
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            <Button
              variant={autoplay ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoplay(!autoplay)}
              className="flex items-center gap-2"
            >
              {autoplay ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {autoplay ? "Pause" : "Play"} Auto-play
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Visible slides:</span>
              {[1, 2, 3].map((count) => (
                <Button
                  key={count}
                  variant={visibleCount === count ? "default" : "outline"}
                  size="sm"
                  onClick={() => setVisibleCount(count)}
                >
                  {count}
                </Button>
              ))}
            </div>

            {selectedItem && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetSelection}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Selection
              </Button>
            )}
          </div>

          {selectedItem && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Selected:</strong> {selectedItem}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Carousel */}
      <Card>
        <CardHeader>
          <CardTitle>Mixed Media Carousel</CardTitle>
          <CardDescription>
            Images, custom content, and interactive elements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CarouselView
            items={sampleItems}
            visibleCount={visibleCount}
            loop={true}
            autoplay={autoplay}
            autoplayDelay={4000}
            onItemSelect={handleItemSelect}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Product Gallery */}
      <Card>
        <CardHeader>
          <CardTitle>Product Gallery</CardTitle>
          <CardDescription>
            Multi-slide view perfect for product showcases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CarouselView
            items={productItems}
            visibleCount={3}
            loop={true}
            autoplay={false}
            onItemSelect={(item: {
              id: string;
              title: string;
              description?: string;
              media?: {
                url: string;
                type: "video" | "image" | "icon";
                alt?: string;
              };
              data?: Record<string, unknown>;
            }) => console.log("Product selected:", item)}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* AI Integration Info */}
      <Card>
        <CardHeader>
          <CardTitle>AI Integration</CardTitle>
          <CardDescription>
            How Tambo AI can interact with the CarouselView component
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">AI Can Control:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Add or remove carousel items</li>
                <li>• Change visible slide count</li>
                <li>• Toggle auto-play and timing</li>
                <li>• Enable/disable loop behavior</li>
                <li>• Update item content and media</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Example Commands:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• &quot;Show 3 slides at once&quot;</li>
                <li>• &quot;Add a new product image&quot;</li>
                <li>• &quot;Make it auto-play every 2 seconds&quot;</li>
                <li>• &quot;Remove the second slide&quot;</li>
                <li>• &quot;Change to landscape images only&quot;</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Page() {
  return <CarouselShowcase />;
}
