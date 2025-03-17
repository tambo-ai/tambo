import { ShowcaseSection } from "@/components/showcase-section";
import type { FormField } from "@/components/ui/form";
import { FormComponent } from "@/components/ui/form";
import type { ShowcaseSection as ShowcaseSectionType } from "@/types/showcase";

export function FormsComponent() {
  const loginFormFields = [
    {
      id: "email",
      label: "Email",
      type: "text",
      placeholder: "Enter your email",
      required: true,
    },
    {
      id: "password",
      label: "Password",
      type: "text",
      placeholder: "Enter your password",
      required: true,
    },
  ];

  const registrationFormFields = [
    {
      id: "name",
      label: "Full Name",
      type: "text",
      placeholder: "Enter your full name",
      required: true,
    },
    {
      id: "email",
      label: "Email",
      type: "text",
      placeholder: "Enter your email",
      required: true,
    },
    {
      id: "password",
      label: "Password",
      type: "text",
      placeholder: "Enter your password",
      required: true,
    },
    {
      id: "accountType",
      label: "Account Type",
      type: "select",
      options: ["Personal", "Business", "Enterprise"],
      placeholder: "Select account type",
      required: true,
    },
  ];

  const aiConfigFormFields = [
    {
      id: "modelName",
      label: "Model Name",
      type: "select",
      options: ["GPT-4", "GPT-3.5", "Claude", "Llama"],
      placeholder: "Select AI model",
      required: true,
    },
    {
      id: "temperature",
      label: "Temperature",
      type: "number",
      placeholder: "0.0 - 1.0",
      description: "Controls randomness in the output",
      required: true,
    },
    {
      id: "maxTokens",
      label: "Max Tokens",
      type: "number",
      placeholder: "Enter max tokens",
      description: "Maximum length of generated response",
      required: true,
    },
  ];

  const sections: ShowcaseSectionType[] = [
    {
      title: "Authentication Forms",
      items: [
        {
          title: "Login Form",
          description:
            "A simple login form with email and password fields. Perfect for user authentication flows.",
          installCommand: "npm install @tambo/forms",
          component: (
            <FormComponent
              fields={loginFormFields as FormField[]}
              onSubmit={(data) => console.log("Login:", data)}
              submitText="Sign In"
              variant="bordered"
            />
          ),
        },
        {
          title: "Registration Form",
          description:
            "A comprehensive registration form with validation and account type selection.",
          installCommand: "npm install @tambo/forms",
          component: (
            <FormComponent
              fields={registrationFormFields as FormField[]}
              onSubmit={(data) => console.log("Register:", data)}
              submitText="Create Account"
              variant="bordered"
            />
          ),
        },
      ],
    },
    {
      title: "AI Configuration Forms",
      items: [
        {
          title: "Model Configuration",
          description:
            "Configure AI model parameters with numeric inputs and dropdowns.",
          installCommand: "npm install @tambo/forms",
          component: (
            <FormComponent
              fields={aiConfigFormFields as FormField[]}
              onSubmit={(data) => console.log("AI Config:", data)}
              submitText="Save Configuration"
              variant="bordered"
            />
          ),
        },
      ],
    },
  ];

  return (
    <main className="flex flex-col items-center gap-8 px-[12%]">
      {sections.map((section, index) => (
        <ShowcaseSection key={index} section={section} />
      ))}
    </main>
  );
}
