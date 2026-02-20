import {
  FormComponent,
  formSchema,
} from "@tambo-ai/ui-registry/components/form";
import { MessageThreadFull } from "@tambo-ai/ui-registry/components/message-thread-full";
import type { Suggestion } from "@tambo-ai/react";
import { useTambo } from "@tambo-ai/react";
import { useEffect } from "react";

const formThreadSuggestions = [
  {
    id: "form-suggestion-1",
    title: "Build a contact form",
    detailedSuggestion:
      "Create a contact form with name, email, and message fields.",
    messageId: "form-create-contact-form",
  },
  {
    id: "form-suggestion-2",
    title: "Add a dropdown",
    detailedSuggestion:
      "Add a required budget dropdown with sensible default options.",
    messageId: "form-add-dropdown",
  },
  {
    id: "form-suggestion-3",
    title: "Tune layout",
    detailedSuggestion:
      "Make the form compact and add helpful field descriptions.",
    messageId: "form-tune-layout",
  },
] satisfies Suggestion[];

export const FormChatInterface = () => {
  const { registerComponent, currentThreadId } = useTambo();

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
      propsSchema: formSchema,
    });
  }, [registerComponent, currentThreadId]);

  return (
    <div className="flex flex-col" style={{ height: "700px" }}>
      <MessageThreadFull
        className="rounded-lg"
        initialSuggestions={formThreadSuggestions}
      />
    </div>
  );
};
