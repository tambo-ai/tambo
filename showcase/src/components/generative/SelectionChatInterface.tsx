import { SelectionCard } from "@/components/ui/selection-card";
import { MessageThreadFull } from "@/components/ui/message-thread-full";
import { useUserContextKey } from "@/lib/useUserContextKey";
import { useTambo } from "@tambo-ai/react";
import { useEffect } from "react";

export const SelectionChatInterface = () => {
  const userContextKey = useUserContextKey("selection-card-thread");
  const { registerComponent, thread } = useTambo();

  useEffect(() => {
    registerComponent({
      name: "SelectionCard",
      description: `A flexible selection controller component for handling single and multi-select scenarios.
      It supports both simple string lists and complex object arrays with labels and disabled states.
      Perfect for user selection interfaces, settings panels, and data filtering scenarios.
      Features:
      - Single selection mode (radio button style) 
      - Multi selection mode (checkbox style)
      - Disabled item support
      - Keyboard navigation (Cmd/Ctrl+A to select all, Escape to clear)
      - Indeterminate state visuals
      - ARIA accessibility support
      - Large list optimization
      - Bulk selection operations (select all, clear all)
      - Programmatic selection control via intents
      Example use cases:
      - User management interfaces
      - Content filtering systems
      - Multi-step form selections
      - Settings configuration panels
      - Data export/import selections
      - Permission assignment interfaces`,
      component: SelectionCard,
      propsDefinition: {
        type: "object",
        properties: {
          mode: {
            type: "string",
            enum: ["single", "multi"],
            description:
              "Selection mode - single allows one selection, multi allows multiple selections",
            default: "single",
          },
          selectedIds: {
            type: "array",
            items: { type: "string" },
            description: "Array of currently selected item IDs",
            default: [],
          },
          totalCount: {
            type: "number",
            description:
              "Total count of items available (useful for pagination scenarios)",
            minimum: 0,
          },
          disabledIds: {
            type: "array",
            items: { type: "string" },
            description:
              "Array of item IDs that should be disabled and non-selectable",
            default: [],
          },
          items: {
            type: "array",
            description:
              "Items to display - can be simple strings or objects with id, label, and disabled properties",
            items: {
              oneOf: [
                { type: "string" },
                {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      description: "Unique identifier for the item",
                    },
                    label: {
                      type: "string",
                      description: "Display text for the item",
                    },
                    disabled: {
                      type: "boolean",
                      description: "Whether this specific item is disabled",
                    },
                  },
                  required: ["id", "label"],
                },
              ],
            },
          },
          onChange: {
            type: "object",
            description: "Callback function executed when selection changes",
          },
          className: {
            type: "string",
            description: "Additional CSS classes for custom styling",
          },
        },
        required: ["items"],
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
