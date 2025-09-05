import { useUserContextKey } from "@/lib/useUserContextKey";
import { useTambo } from "@tambo-ai/react";
import { useEffect } from "react";
import { Carousel, carouselSchema } from "@/components/ui/Carousel";
import { MessageThreadFull } from "@/components/ui/message-thread-full";

export const CarouselInterface = () => {
  const userContextKey = useUserContextKey("carousel-thread");
  const { registerComponent, thread } = useTambo();

  useEffect(() => {
    registerComponent({
      name: "CarousalComponent",
      description: `A highly customizable and accessible carousel component for displaying a collection of items (cards, images, videos, or custom content) in a scrollable, interactive layout.
It supports multiple visible slides, looping, autoplay, keyboard navigation, swipe/drag gestures, and screen reader accessibility. Perfect for galleries, product showcases, testimonials, feature highlights, and content sliders.

Features:
- Multiple visible slides with responsive layout
- Infinite looping with seamless transitions
- Autoplay with pause on hover
- Keyboard navigation and focus management
- Swipe and drag gestures (mouse and touch)
- Lazy rendering of slides for performance
- Accessible with ARIA roles and live announcements
- Optional controls (prev/next buttons) and indicators (dots)
- Supports images, videos, or any custom JSX content
- Visual variants (default, solid, bordered)
- Responsive sizes (xs to xxl) and widths (sm to lg)
- Dark mode support

Example use cases:
- Image galleries and product carousels
- Testimonial sliders
- Featured content sections
- Marketing hero sliders
- Interactive dashboards and dashboards cards
- Media content carousels (images/videos)`,
      component: Carousel,
      propsSchema: carouselSchema,
    });
  }, [registerComponent, thread]);

  return (
    <div className="relative h-full w-full flex flex-col">
      <MessageThreadFull
        contextKey={userContextKey}
        className="rounded-lg flex-1"
      />
    </div>
  );
};
