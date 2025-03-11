"use client";

import { FormComponent, FormField } from "@/components/ui/form";

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
    {
      id: "rememberMe",
      label: "Remember me",
      type: "select",
      options: ["Yes", "No"],
      description: "Keep me signed in on this device",
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
      id: "confirmPassword",
      label: "Confirm Password",
      type: "text",
      placeholder: "Confirm your password",
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

  const aiModelConfigFields = [
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
    {
      id: "systemPrompt",
      label: "System Prompt",
      type: "textarea",
      placeholder: "Enter system instructions...",
      description: "Initial instructions for the AI model",
      required: true,
    },
  ];

  const feedbackFormFields = [
    {
      id: "rating",
      label: "Rating",
      type: "select",
      options: ["Excellent", "Good", "Average", "Poor"],
      placeholder: "Select your rating",
      required: true,
    },
    {
      id: "name",
      label: "Name",
      type: "text",
      placeholder: "Enter your name",
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
      id: "feedback",
      label: "Feedback",
      type: "textarea",
      placeholder: "Tell us your thoughts...",
      required: true,
    },
  ];

  const supportFormFields = [
    {
      id: "category",
      label: "Support Category",
      type: "select",
      options: ["Technical", "Billing", "Account", "Other"],
      placeholder: "Select category",
      required: true,
    },
    {
      id: "priority",
      label: "Priority Level",
      type: "select",
      options: ["Low", "Medium", "High", "Urgent"],
      placeholder: "Select priority",
      required: true,
    },
    {
      id: "description",
      label: "Issue Description",
      type: "textarea",
      placeholder: "Describe your issue...",
      required: true,
    },
  ];

  return (
    <main className="flex flex-col items-center gap-8 px-[12%]">
      <div className="grid grid-cols-12 gap-4 w-full">
        {/* Login Form */}
        <div className="col-span-12 md:col-span-6 p-6 border rounded-lg bg-card">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-semibold">Welcome Back</h2>
          </div>
          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Sign in with your credentials to access:
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Personalized AI assistance</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Custom model configurations</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Chat history and saved threads</span>
              </li>
            </ul>
          </div>
          <FormComponent
            fields={loginFormFields as FormField[]}
            onSubmit={(data) => console.log("Login:", data)}
            submitText="Sign In"
            variant="bordered"
          />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>
              Don&apos;t have an account?{" "}
              <span className="text-primary cursor-pointer hover:underline">
                Create one
              </span>
            </p>
          </div>
        </div>

        {/* Registration Form */}
        <div className="col-span-12 md:col-span-6 p-6 border rounded-lg bg-card">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-semibold">Create Account</h2>
          </div>
          <FormComponent
            fields={registrationFormFields as FormField[]}
            onSubmit={(data) => console.log("Register:", data)}
            submitText="Create Account"
            variant="bordered"
          />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>
              Already have an account?{" "}
              <span className="text-primary cursor-pointer hover:underline">
                Sign in
              </span>
            </p>
          </div>
        </div>

        {/* AI Config Form */}
        <div className="col-span-12 p-6 border rounded-lg bg-card">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-semibold">AI Model Configuration</h2>
          </div>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-4">
              <div className="p-4 bg-muted rounded-lg mb-4">
                <h3 className="font-medium mb-2">Configuration Tips</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Higher temperature means more creative outputs</li>
                  <li>• Lower temperature means more focused outputs</li>
                  <li>• Adjust max tokens based on expected response length</li>
                  <li>
                    • System prompt sets the AI&apos;s behavior and context
                  </li>
                </ul>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-2">Model Comparison</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• GPT-4: Most capable, slower, more expensive</li>
                  <li>• GPT-3.5: Fast, reliable, cost-effective</li>
                  <li>• Claude: Strong analysis, longer context</li>
                  <li>• Llama: Open source, runs locally</li>
                </ul>
              </div>
            </div>
            <div className="col-span-12 md:col-span-8">
              <FormComponent
                fields={aiModelConfigFields as FormField[]}
                onSubmit={(data) => console.log("AI Config:", data)}
                submitText="Save Configuration"
                variant="bordered"
              />
            </div>
          </div>
        </div>

        {/* Feedback and Support Forms */}
        <div className="col-span-12 md:col-span-6 p-6 border rounded-lg bg-card">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-semibold">Share Your Feedback</h2>
          </div>
          <div className="p-2 rounded-lg">
            <span className="text-sm text-muted-foreground">
              <p>We value your feedback. Please share your thoughts with us:</p>
            </span>
          </div>
          <FormComponent
            fields={feedbackFormFields as FormField[]}
            onSubmit={(data) => console.log("Feedback:", data)}
            submitText="Submit Feedback"
            variant="bordered"
          />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>
              Thank you for your feedback! We&apos;ll use it to improve our
              service.
            </p>
          </div>
        </div>

        <div className="col-span-12 md:col-span-6 p-6 border rounded-lg bg-card">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-semibold">Get Support</h2>
          </div>
          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Average response times:
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              <li className="flex items-center justify-between">
                <span>Urgent Priority</span>
                <span className="text-primary">1 hour</span>
              </li>
              <li className="flex items-center justify-between">
                <span>High Priority</span>
                <span className="text-primary">4 hours</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Medium Priority</span>
                <span className="text-primary">12 hours</span>
              </li>
            </ul>
          </div>
          <FormComponent
            fields={supportFormFields as FormField[]}
            onSubmit={(data) => console.log("Support:", data)}
            submitText="Submit Request"
            variant="bordered"
          />
        </div>
      </div>
    </main>
  );
}
