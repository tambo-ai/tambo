import { FormComponent } from "@/components/ui/form";
import { MessageThreadFull } from "@/components/ui/message-thread-full";
import { useTambo } from "@tambo-ai/react";
import { useEffect } from "react";

export const FormChatInterface = () => {
  const { registerComponent, thread } = useTambo();

  useEffect(() => {
    registerComponent({
      name: "FormComponent",
      description: `A dynamic form builder component that creates structured forms with multiple input types.
      It can handle text inputs, number inputs, dropdowns (select), and text areas.
      Each field can have labels, placeholders, validation, and help text.
      The form supports different visual styles through variants (default/solid/bordered) and spacing layouts (default/compact/relaxed).
      Perfect for user input collection, data entry forms, contact forms, surveys, and any structured data collection needs.
      Features:
      - Multiple input types (text, number, select, textarea)
      - Required field validation
      - Custom field descriptions
      - Dropdown menus with search
      - Responsive design
      - Dark mode support
      - Accessible form controls
      Example use cases:
      - Contact forms
      - Registration forms
      - Survey forms
      - Settings panels
      - Data entry interfaces`,
      component: FormComponent,
      propsDefinition: {
        fields: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: "string",
              type: {
                type: "enum",
                options: ["text", "number", "select", "textarea"],
              },
              label: "string",
              placeholder: "string?",
              options: {
                type: "array",
                items: "string",
                optional: true,
              },
              required: "boolean?",
              description: "string?",
            },
          },
        },
        onSubmit: "function",
        onError: "string?",
        submitText: "string?",
        variant: {
          type: "enum",
          options: ["default", "solid", "bordered"],
          optional: true,
        },
        layout: {
          type: "enum",
          options: ["default", "compact", "relaxed"],
          optional: true,
        },
        className: "string?",
      },
    });
  }, [registerComponent, thread]);

  return (
    <div className="relative h-full w-full ">
      <MessageThreadFull
        contextKey="form-thread"
        className="min-h-[600px] md:min-h-[700px]"
      />
    </div>
  );
};
