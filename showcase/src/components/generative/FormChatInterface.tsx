import { FormComponent, formSchema } from "@/components/ui/form";
import { MessageThreadFull } from "@/components/ui/message-thread-full";
import { useUserContextKey } from "@/lib/useUserContextKey";
import { useTambo } from "@tambo-ai/react";
import { useEffect } from "react";

export const FormChatInterface = () => {
  const userContextKey = useUserContextKey("form-thread");
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
      propsSchema: formSchema,
    });
  }, [registerComponent, thread.id]);

  return (
    <div className="flex flex-col" style={{ height: "700px" }}>
      <MessageThreadFull contextKey={userContextKey} className="rounded-lg" />
    </div>
  );
};
