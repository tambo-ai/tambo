import { ListViewCard } from "@/components/ui/list-view-card";
import { MessageThreadFull } from "@/components/ui/message-thread-full";
import { useUserContextKey } from "@/lib/useUserContextKey";
import { useTambo } from "@tambo-ai/react";
import { useEffect } from "react";

export const ListChatInterface = () => {
  const userContextKey = useUserContextKey("list-view-card-thread");
  const { registerComponent, thread } = useTambo();

  useEffect(() => {
    registerComponent({
      name: "ListViewCard",
      description: `A high-performance, virtualized list component with selection modes, keyboard navigation, and ARIA support.
      It can display lists of items with optional media (icons, thumbnails), selection controls, and search functionality.
      The component supports single and multi-selection modes, keyboard navigation, and can handle large datasets efficiently.
      
      Features:
      - Virtualization for smooth scrolling with 50k+ items
      - Single, multi, and no selection modes
      - Optional media (icons, thumbnails, avatars)
      - Keyboard navigation (Arrow keys, Home, End, Enter, Space)
      - Type-ahead search functionality
      - Load-more pagination support
      - ARIA accessibility support
      - Customizable variants and sizes
      
      Example use cases:
      - File browsers
      - Contact lists
      - Product catalogs
      - Data tables
      - Navigation menus
      - Search results
      
      Usage tips:
      1. Use 'icon' media type for simple item representations
      2. Use 'thumbnail' for small images or previews
      3. Use 'avatar' for user profile pictures
      4. Set appropriate itemHeight for your content
      5. Use selection modes based on your interaction needs
      6. Implement onLoadMore for infinite scrolling`,
      component: ListViewCard,
      propsDefinition: {
        type: "object",
        properties: {
          items: {
            type: "array",
            description: "Array of items to display in the list.",
            items: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description: "Unique identifier for the item.",
                },
                title: {
                  type: "string",
                  description: "Primary text displayed for the item.",
                },
                subtitle: {
                  type: "string",
                  description: "Secondary text displayed below the title.",
                },
                media: {
                  type: "object",
                  description: "Optional media to display with the item.",
                  properties: {
                    type: {
                      type: "string",
                      enum: ["avatar", "thumbnail", "icon"],
                      description: "Type of media to display.",
                    },
                    src: {
                      type: "string",
                      description: "Source for the media (URL for images, emoji/character for icons).",
                    },
                    alt: {
                      type: "string",
                      description: "Alternative text for accessibility.",
                    },
                  },
                  required: ["type", "src"],
                },
              },
              required: ["id", "title"],
            },
          },
          selectionMode: {
            type: "string",
            enum: ["none", "single", "multi"],
            description: "Selection behavior for list items.",
            default: "none",
          },
          height: {
            oneOf: [
              { type: "number" },
              { type: "string" }
            ],
            description: "Height of the list container in pixels or CSS value.",
            default: 400,
          },
          itemHeight: {
            type: "number",
            description: "Height of each list item in pixels.",
            default: 60,
          },
          showCheckboxes: {
            type: "boolean",
            description: "Whether to show checkboxes for multi-selection mode.",
            default: false,
          },
          variant: {
            type: "string",
            enum: ["default", "bordered", "elevated"],
            description: "Visual style variant of the list container.",
            default: "default",
          },
          size: {
            type: "string",
            enum: ["sm", "md", "lg"],
            description: "Size variant affecting padding and text size.",
            default: "md",
          },
          className: {
            type: "string",
            description: "Additional CSS classes for styling.",
          },
        },
        required: ["items"],
        example: [
          {
            description: "Basic list with icons",
            data: {
              items: [
                {
                  id: "1",
                  title: "Document 1",
                  subtitle: "Last modified: 2 hours ago",
                  media: {
                    type: "icon",
                    src: "📄",
                    alt: "Document icon",
                  },
                },
                {
                  id: "2",
                  title: "Image 1",
                  subtitle: "Size: 2.4 MB",
                  media: {
                    type: "icon",
                    src: "🖼️",
                    alt: "Image icon",
                  },
                },
                {
                  id: "3",
                  title: "Video 1",
                  subtitle: "Duration: 3:45",
                  media: {
                    type: "icon",
                    src: "🎥",
                    alt: "Video icon",
                  },
                },
              ],
              selectionMode: "single",
              variant: "bordered",
              size: "md",
            },
          },
          {
            description: "Multi-selection list with checkboxes",
            data: {
              items: [
                {
                  id: "user1",
                  title: "John Doe",
                  subtitle: "Software Engineer",
                  media: {
                    type: "icon",
                    src: "👨‍💻",
                    alt: "Developer icon",
                  },
                },
                {
                  id: "user2",
                  title: "Jane Smith",
                  subtitle: "Product Manager",
                  media: {
                    type: "icon",
                    src: "👩‍💼",
                    alt: "Manager icon",
                  },
                },
                {
                  id: "user3",
                  title: "Bob Johnson",
                  subtitle: "Designer",
                  media: {
                    type: "icon",
                    src: "🎨",
                    alt: "Designer icon",
                  },
                },
              ],
              selectionMode: "multi",
              showCheckboxes: true,
              variant: "elevated",
              size: "lg",
            },
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

