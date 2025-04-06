"use client";

import { CLI } from "@/components/cli";
import { CopyablePrompt, Section } from "@/components/ui/doc-components";
import { MessageThreadFull } from "@/components/ui/message-thread-full";
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
            <h1 className="text-3xl font-bold mb-4">Form Component</h1>
            <p className="text-lg text-muted-foreground mb-6">
              A dynamic form builder component that creates structured forms
              with multiple input types.
            </p>
          </div>

          <Section title="Example Prompt">
            <CopyablePrompt prompt={examplePrompt} />
          </Section>

          <Section title="Demo">
            <div className="rounded-lg bg-backgroud border border-border/40">
              <TamboProvider
                apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? ""}
              >
                <MessageThreadFull contextKey="form-thread" />
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
