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
      It can handle text inputs, number inputs, dropdowns (select), text areas, radio buttons, checkboxes, sliders, and yes/no toggles.
      Each field can have labels, placeholders, validation, and help text.
      The form supports different visual styles through variants (default/solid/bordered) and spacing layouts (default/compact/relaxed).
      Perfect for user input collection, data entry forms, contact forms, surveys, and any structured data collection needs.
      Features:
      - Multiple input types (text, number, select, textarea, radio, checkbox, slider, yes-no)
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
        type: "object",
        properties: {
          fields: {
            type: "array",
            description: "Array of field configuration objects for the form.",
            items: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description: "Unique identifier for the field.",
                },
                type: {
                  type: "string",
                  enum: [
                    "text",
                    "number",
                    "select",
                    "textarea",
                    "radio",
                    "checkbox",
                    "slider",
                    "yes-no",
                  ],
                  description: "The type of form input.",
                },
                label: {
                  type: "string",
                  description: "Visible label for the field.",
                },
                placeholder: {
                  type: "string",
                  description: "Placeholder text for the input field.",
                },
                options: {
                  type: "array",
                  items: { type: "string" },
                  description:
                    "Array of options for 'select', 'radio', or 'checkbox' type fields.",
                },
                required: {
                  type: "boolean",
                  description: "Whether the field is mandatory.",
                },
                description: {
                  type: "string",
                  description:
                    "Additional help text displayed below the field.",
                },
                sliderMin: {
                  type: "number",
                  description: "The minimum value for slider fields.",
                },
                sliderMax: {
                  type: "number",
                  description: "The maximum value for slider fields.",
                },
                sliderStep: {
                  type: "number",
                  description: "The step value for slider fields.",
                },
                sliderDefault: {
                  type: "number",
                  description: "Default value for slider fields.",
                },
                sliderLabels: {
                  type: "array",
                  items: { type: "string" },
                  description:
                    "Labels to display under slider (typically at min, middle, max positions).",
                },
              },
              required: ["id", "type", "label"],
            },
          },
          onSubmit: {
            type: "object",
            description:
              "Callback function executed when the form is submitted successfully.",
          },
          onError: {
            type: "string",
            description: "Error message to display on submission failure.",
          },
          submitText: {
            type: "string",
            description: "Text displayed on the submit button.",
          },
          variant: {
            type: "string",
            enum: ["default", "solid", "bordered"],
            description: "Visual style variant of the form.",
            default: "default",
          },
          layout: {
            type: "string",
            enum: ["default", "compact", "relaxed"],
            description: "Spacing layout of the form fields.",
            default: "default",
          },
          className: {
            type: "string",
            description: "Additional CSS classes for styling.",
          },
        },
        required: ["fields", "onSubmit"],
      },
    });
  }, [registerComponent, thread]);

  return (
    <div className="relative h-full w-full ">
      <MessageThreadFull
        contextKey="form-thread"
        className="rounded-lg"
        style={{ height: "100%" }}
      />
    </div>
  );
};
