"use client";

import { CLI } from "@/components/cli";
import { InputFieldsChatInterface } from "@/components/generative/InputFieldsChatInterface";
import { CopyablePrompt, Section } from "@/components/ui/doc-components";
import { ShowcaseThemeProvider } from "@/providers/showcase-theme-provider";
import { TamboProvider } from "@tambo-ai/react";
import { DemoWrapper } from "../../demo-wrapper";

export default function InputFieldsComponentPage() {
  const installCommand = "npx tambo add input-fields";

  const examplePrompt = `Create input fields showcasing all available features:
- Username field (required text, placeholder "Enter username", minLength 3, maxLength 20, pattern for alphanumeric only, description "Must be 3-20 alphanumeric characters", autoComplete "username")
- Email field (required email, placeholder "your.email@example.com", description "We'll use this for account notifications", autoComplete "email")
- Password field (required password, placeholder "Create strong password", minLength 8, maxLength 128, description "Must be at least 8 characters long", autoComplete "new-password")
- Phone field (optional text, placeholder "(555) 123-4567", pattern for phone format, description "Optional: for account recovery", autoComplete "tel")
- Age field (optional number, placeholder "25", minLength 1, maxLength 3, description "Must be between 1-150")
- Disabled field (text, disabled true, placeholder "This field is disabled", description "This demonstrates a disabled state")

Use the solid variant with compact layout. Show validation patterns, length constraints, autocomplete attributes, help descriptions, and both required/optional fields.`;

  return (
    <div className="container mx-auto pt-6 px-6 max-w-4xl">
      <ShowcaseThemeProvider defaultTheme="light">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold mb-4">Input Fields</h1>
            <p className="text-lg text-secondary">
              A focused collection of input fields optimized for data entry and
              user information capture with advanced validation.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Installation</h2>
            <div className="rounded-md">
              <CLI command={installCommand} />
            </div>
          </div>

          <h2 className="text-xl font-semibold">Examples</h2>
          <Section title="Example Prompt" as="h3">
            <CopyablePrompt prompt={examplePrompt} />
          </Section>

          <h3 className="text-lg font-medium mb-3">Live Demo</h3>
          <DemoWrapper title="Input Fields" height={800} hidePreviewHeading>
            <TamboProvider
              apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? ""}
              tamboUrl={process.env.NEXT_PUBLIC_TAMBO_API_URL ?? ""}
            >
              <InputFieldsChatInterface />
            </TamboProvider>
          </DemoWrapper>
        </div>
      </ShowcaseThemeProvider>
    </div>
  );
}
