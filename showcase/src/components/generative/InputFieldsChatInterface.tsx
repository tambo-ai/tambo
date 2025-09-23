import {
  InputFields,
  inputFieldsSchema,
} from "@/components/tambo/input-fields";
import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { useUserContextKey } from "@/lib/useUserContextKey";
import { useTambo } from "@tambo-ai/react";
import { useEffect } from "react";

export const InputFieldsChatInterface = () => {
  const userContextKey = useUserContextKey("input-fields-thread");
  const { registerComponent, thread } = useTambo();

  useEffect(() => {
    registerComponent({
      name: "InputFields",
      description: `A focused collection of input fields optimized for data entry and user information capture.
      Specialized for creating clean, accessible input interfaces with text, number, email, and password fields.
      Each field supports comprehensive validation, custom patterns, error handling, and accessibility features.
      Perfect for user authentication, profile management, and structured data collection scenarios.
      
      Key Features:
      - Focused input types: text, number, email, password
      - Advanced validation with regex patterns and length constraints
      - Built-in accessibility with proper labeling and ARIA attributes
      - Real-time error display and validation feedback
      - Autocomplete support for enhanced UX
      - Responsive design with consistent styling
      - Field descriptions and help text
      - Required field indicators
      
      Ideal Use Cases:
      - User registration and login forms
      - Profile editing interfaces
      - Account settings panels
      - Data entry workflows
      - Authentication forms
      - Personal information collection
      
      Unlike complex forms with dropdowns and sliders, this component focuses on essential input field types with robust validation and accessibility features.`,
      component: InputFields,
      propsSchema: inputFieldsSchema,
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
