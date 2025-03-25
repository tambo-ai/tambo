import type { FormField } from "@/components/ui/form";
import { FormComponent } from "@/components/ui/form";
import { ShowcaseThemeProvider } from "@/providers/showcase-theme-provider";
import { ShowcaseSection } from "../showcase-section";

export const FormsShowcase = () => {
  const loginFormFields = [
    {
      id: "email",
      label: "Email",
      type: "text",
      placeholder: "name@company.com",
      required: true,
      description: "Enter the email associated with your account",
    },
    {
      id: "password",
      label: "Password",
      type: "text",
      placeholder: "••••••••",
      required: true,
      description: "Enter your password",
    },
    {
      id: "loginType",
      label: "Login Method",
      type: "select",
      options: ["Standard", "SSO", "2FA"],
      placeholder: "Select login method",
      required: true,
    },
    {
      id: "rememberDevice",
      label: "Security Options",
      type: "select",
      options: ["Remember this device", "Private/Incognito", "Public computer"],
      placeholder: "Select security option",
      description: "Choose how you want to be remembered on this device",
      required: true,
    },
    {
      id: "notes",
      label: "Login Notes",
      type: "text",
      placeholder: "Add any notes for this login session...",
      description: "Optional: Add notes for audit purposes",
      required: false,
    },
  ];

  const registrationFormFields = [
    {
      id: "name",
      label: "Full Name",
      type: "text",
      placeholder: "John Doe",
      required: true,
    },
    {
      id: "email",
      label: "Email",
      type: "text",
      placeholder: "name@company.com",
      required: true,
    },
    {
      id: "bio",
      label: "About You",
      type: "textarea",
      placeholder: "Tell us a bit about yourself...",
      required: false,
    },
    {
      id: "accountType",
      label: "Account Type",
      type: "select",
      options: ["Personal", "Business", "Enterprise"],
      placeholder: "Select account type",
      required: true,
    },
    {
      id: "password",
      label: "Password",
      type: "text",
      placeholder: "Create a strong password",
      required: true,
      description: "Must be at least 8 characters long",
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
      description: "Choose the AI model that best fits your needs",
    },
    {
      id: "temperature",
      label: "Temperature",
      type: "number",
      placeholder: "0.0 - 1.0",
      description: "Higher values make the output more random (0.0 - 1.0)",
      required: true,
    },
    {
      id: "maxTokens",
      label: "Max Tokens",
      type: "number",
      placeholder: "Enter max tokens",
      description: "Maximum length of generated response (1 - 4096)",
      required: true,
    },
    {
      id: "context",
      label: "System Context",
      type: "textarea",
      placeholder: "Enter system context or prompt...",
      description: "Define the AI's behavior and constraints",
      required: false,
    },
  ];

  return (
    <ShowcaseThemeProvider defaultTheme="light">
      <ShowcaseSection
        section={{
          title: "",
          items: [
            {
              title: "Login Form",
              description:
                "A simple login form with email and password fields. Perfect for user authentication flows.",
              installCommand: "npx tambo add form",
              component: (
                <FormComponent
                  fields={loginFormFields as FormField[]}
                  onSubmit={(data) => console.log("Login:", data)}
                  submitText="Sign In"
                  variant="solid"
                  layout="default"
                />
              ),
            },
            {
              title: "Registration Form",
              description:
                "A comprehensive registration form with validation and account type selection.",
              installCommand: "npx tambo add form",
              component: (
                <FormComponent
                  fields={registrationFormFields as FormField[]}
                  onSubmit={(data) => console.log("Register:", data)}
                  submitText="Create Account"
                  variant="bordered"
                  layout="relaxed"
                />
              ),
            },
            {
              title: "AI Configuration Form",
              description:
                "Configure AI model parameters with numeric inputs and dropdowns.",
              installCommand: "npx tambo add form",
              component: (
                <FormComponent
                  fields={aiConfigFormFields as FormField[]}
                  onSubmit={(data) => console.log("AI Config:", data)}
                  submitText="Save Configuration"
                  variant="bordered"
                  layout="default"
                />
              ),
            },
          ],
        }}
      />
    </ShowcaseThemeProvider>
  );
};
