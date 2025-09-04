import {
  SelectionCard,
  selectionCardPropsSchema,
} from "@/components/ui/selection-card";
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
      description: `Selection controller component supporting single and multi-select modes.
      Handles string arrays or objects with id/label properties. 
      Includes keyboard shortcuts, accessibility features, and disabled state support.`,
      component: SelectionCard,
      propsSchema: selectionCardPropsSchema,
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
