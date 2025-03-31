import { FormComponent } from "@/components/ui/form";
import { MessageThreadFull } from "@/components/ui/message-thread-full";
import { useTambo } from "@tambo-ai/react";
import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

export const FormChatInterface = () => {
  const { registerComponent, thread } = useTambo();
  const [copied, setCopied] = useState(false);

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
    <div className="relative h-full w-full">
      <MessageThreadFull contextKey="form-thread" />
      <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h3 className="text-sm font-medium mb-2">Example Prompt</h3>
        <div className="relative">
          <pre className="text-sm bg-white p-3 rounded-md overflow-x-auto">
            {`Create a contact form with the following fields:
- Name (required text input)
- Email (required text input)
- Phone (optional text input)
- Message (required textarea)
- Preferred Contact Method (select with options: Email, Phone, Either)
Make it use the bordered variant with a relaxed layout.
- Use the default variant with a compact layout.`}
          </pre>
          <button
            onClick={() => {
              navigator.clipboard
                .writeText(
                  `Create a contact form with the following fields:
- Name (required text input)
- Email (required text input)
- Phone (optional text input)
- Message (required textarea)
- Preferred Contact Method (select with options: Email, Phone, Either)
Make it use the bordered variant with a relaxed layout.
- Use the default variant with a compact layout.`,
                )
                .then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
            }}
            className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
