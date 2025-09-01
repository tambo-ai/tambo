import { CarouselView } from "../../../../cli/src/registry/carousel-view";
import { MessageThreadFull } from "@/components/ui/message-thread-full";
import { useUserContextKey } from "@/lib/useUserContextKey";
import { useTambo } from "@tambo-ai/react";
import { useEffect } from "react";

export const CarouselChatInterface = () => {
  const userContextKey = useUserContextKey("carousel-thread");
  const { registerComponent, thread } = useTambo();

  useEffect(() => {
    registerComponent({
      name: "CarouselView",
      description: `An interactive carousel component that displays mixed media items with navigation and selection capabilities.
      Perfect for showcasing products, galleries, testimonials, or any collection of content.
      
      Features:
      - Touch/swipe support for mobile devices
      - Keyboard navigation (arrow keys, home, end)
      - Auto-play functionality with customizable timing
      - Configurable visible slide count
      - Loop/infinite scroll option
      - Mixed media support (images, videos, custom content)
      - Accessibility features (ARIA labels, screen reader support)
      - Responsive design
      
      Example use cases:
      - Product image galleries
      - Customer testimonials
      - Feature showcases
      - Portfolio displays
      - News/blog post previews
      - Team member profiles
      
      Usage tips:
      1. Use visibleCount=1 for single-item focus (like hero banners)
      2. Use visibleCount=3 for product galleries
      3. Enable autoplay for promotional content
      4. Include media for visual appeal
      5. Keep titles concise and descriptive`,
      component: CarouselView,
      propsDefinition: {
        type: "object",
        properties: {
          items: {
            type: "array",
            description:
              "Array of items to display in the carousel. Each item must have an id and title.",
            items: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description: "Unique identifier for the item",
                },
                title: {
                  type: "string",
                  description: "Title or main text for the item",
                },
                description: {
                  type: "string",
                  description: "Optional description or subtitle for the item",
                },
                media: {
                  type: "object",
                  description: "Optional media content for the item",
                  properties: {
                    type: {
                      type: "string",
                      enum: ["image", "video", "icon"],
                      description: "Type of media content",
                    },
                    url: {
                      type: "string",
                      description: "URL to the media content",
                    },
                    alt: {
                      type: "string",
                      description: "Alt text for accessibility",
                    },
                  },
                  required: ["type", "url"],
                },
                data: {
                  type: "object",
                  description: "Additional data associated with the item",
                },
              },
              required: ["id", "title"],
            },
            minItems: 1,
          },
          visibleCount: {
            type: "number",
            description:
              "Number of slides visible at once. Use 1 for single-item view, 2-4 for multi-item galleries.",
            minimum: 1,
            maximum: 6,
            default: 1,
          },
          loop: {
            type: "boolean",
            description: "Whether the carousel should loop infinitely",
            default: false,
          },
          autoplay: {
            type: "boolean",
            description: "Whether the carousel should auto-advance slides",
            default: false,
          },
          autoplayDelay: {
            type: "number",
            description: "Delay between auto-advance in milliseconds",
            minimum: 1000,
            maximum: 10000,
            default: 3000,
          },
        },
        required: ["items"],
        example: [
          {
            description: "Product showcase carousel",
            items: [
              {
                id: "product-1",
                title: "Premium Headphones",
                description:
                  "High-quality wireless headphones with noise cancellation",
                media: {
                  type: "image",
                  url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
                  alt: "Premium Headphones",
                },
              },
              {
                id: "product-2",
                title: "Smart Watch",
                description: "Advanced fitness tracking and notifications",
                media: {
                  type: "image",
                  url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
                  alt: "Smart Watch",
                },
              },
              {
                id: "product-3",
                title: "Wireless Speaker",
                description: "Portable speaker with premium sound quality",
                media: {
                  type: "image",
                  url: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400",
                  alt: "Wireless Speaker",
                },
              },
            ],
            visibleCount: 1,
            loop: true,
            autoplay: true,
            autoplayDelay: 4000,
          },
          {
            description: "Team member gallery",
            items: [
              {
                id: "team-1",
                title: "Sarah Johnson",
                description: "Lead Designer",
                media: {
                  type: "image",
                  url: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400",
                  alt: "Sarah Johnson",
                },
              },
              {
                id: "team-2",
                title: "Mike Chen",
                description: "Senior Developer",
                media: {
                  type: "image",
                  url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
                  alt: "Mike Chen",
                },
              },
              {
                id: "team-3",
                title: "Emily Rodriguez",
                description: "Product Manager",
                media: {
                  type: "image",
                  url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
                  alt: "Emily Rodriguez",
                },
              },
            ],
            visibleCount: 3,
            loop: false,
            autoplay: false,
          },
        ],
      },
    });
  }, [registerComponent, thread.id]);

  return (
    <div className="relative h-full w-full flex flex-col">
      <MessageThreadFull
        contextKey={userContextKey}
        className="rounded-lg flex-1"
      />
    </div>
  );
};
