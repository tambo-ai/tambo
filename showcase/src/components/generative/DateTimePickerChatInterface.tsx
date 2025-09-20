import { DateTimeComponent } from "@/components/ui/date-time-picker";
import { MessageThreadFull } from "@/components/ui/message-thread-full";
import { useUserContextKey } from "@/lib/useUserContextKey";
import { useTambo } from "@tambo-ai/react";
import { useEffect } from "react";

export const DateTimePickerChatInterface = () => {
  const userContextKey = useUserContextKey("datetime-picker-thread");
  const { registerComponent, thread } = useTambo();

  useEffect(() => {
    registerComponent({
      name: "DateTimePicker",
      description: `
        A comprehensive date and time selection component that combines calendar date picking with time input.
        Features:
        - Interactive calendar popup
        - Integrated time picker
        - 12-hour & 24-hour format support
        - Min/max date constraints
        - Locale support
        - Clear/reset functionality
        - Keyboard accessibility
      `,
      component: DateTimeComponent,
      propsSchema: {
        type: "object",
        properties: {
          value: {
            type: ["string", "null"],
            title: "Value",
            description: "Current selected date-time as ISO string or null.",
          },
          placeholder: {
            type: "string",
            title: "Placeholder",
            description: "Placeholder text.",
            default: "Pick a date and time",
          },
          disabled: {
            type: "boolean",
            title: "Disabled",
            description: "Disable the picker.",
            default: false,
          },
          min: {
            type: "string",
            title: "Min Date",
            description: "Minimum selectable date (ISO string).",
          },
          max: {
            type: "string",
            title: "Max Date",
            description: "Maximum selectable date (ISO string).",
          },
          showSubmitButton: {
            type: "boolean",
            title: "Show Submit Button",
            description: "Whether to display the submit button.",
            default: true,
          },
        },
        required: ["value"],
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
