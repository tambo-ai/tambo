"use client";

import { CLI } from "@/components/cli";
import { FormChatInterface } from "@/components/generative/FormChatInterface";
import { CopyablePrompt, Section } from "@/components/ui/doc-components";
import { ShowcaseThemeProvider } from "@/providers/showcase-theme-provider";
import { TamboProvider } from "@tambo-ai/react";

export default function FormComponentPage() {
  const installCommand = "npx tambo add form";

  const examplePrompt = `Create a contact form with the following fields:
- Name (required text input)
- Email (required text input)
- Phone (optional text input)
- Message (required textarea)
- Preferred Contact Method (select with options: Email, Phone, Either)
Make it use the bordered variant with a relaxed layout.`;

  return (
    <div className="container mx-auto pt-6 px-6 max-w-4xl">
      <ShowcaseThemeProvider defaultTheme="light">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-4">Form</h1>
            <p className="text-lg mb-6 text-secondary">
              A dynamic form builder component that creates structured forms
              with multiple input types.
            </p>
          </div>

          <Section title="Example Prompt">
            <CopyablePrompt prompt={examplePrompt} />
          </Section>

          <Section title="Preview">
            <div className="rounded-lg bg-background border border-border/40">
              <TamboProvider
                apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? ""}
              >
                <FormChatInterface />
              </TamboProvider>
            </div>
          </Section>

          <Section title="Installation">
            <div className="rounded-md">
              <CLI command={installCommand} />
            </div>
          </Section>
        </div>
      </ShowcaseThemeProvider>
    </div>
  );
}
