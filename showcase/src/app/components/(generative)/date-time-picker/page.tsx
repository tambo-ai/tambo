"use client";

import { CLI } from "@/components/cli";
import { DateTimePickerChatInterface } from "@/components/generative/DateTimePickerChatInterface";
import { CopyablePrompt, Section } from "@/components/ui/doc-components";
import { ShowcaseThemeProvider } from "@/providers/showcase-theme-provider";
import { TamboProvider } from "@tambo-ai/react";
import { DemoWrapper } from "../../demo-wrapper";

export default function DateComponentPage() {
  const installCommand = "npx tambo add date-time-picker";

  const examplePrompt = `Create a date picker with the following configuration:
- Single date selection mode
- Include time picker with 12-hour format
- Show week numbers in calendar
- Disable weekends (Saturday and Sunday)
- Set minimum date to today
- Maximum date should be 3 months from now
- Use outlined variant with large size
- Add label "Event Date & Time"
- Include description "Select when your event will take place"
- Make it required`;

  return (
    <div className="container mx-auto pt-6 px-6 max-w-4xl">
      <ShowcaseThemeProvider defaultTheme="light">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold mb-4">Date</h1>
            <p className="text-lg text-secondary">
              A versatile date and time selection component that supports
              various date input formats, ranges, and calendar configurations.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Installation</h2>
            <div className="rounded-md">
              <CLI command={installCommand} />
            </div>
          </div>

          <Section title="Example Prompt">
            <CopyablePrompt prompt={examplePrompt} />
          </Section>

          <DemoWrapper title="Date" height={800}>
            <TamboProvider
              apiKey={process.env.EXT_PUBLIC_TAMBO_API_KEY ?? ""}
              tamboUrl={process.env.NEXT_PUBLIC_TAMBO_API_URL ?? ""}
            >
              <DateTimePickerChatInterface />
            </TamboProvider>
          </DemoWrapper>
        </div>
      </ShowcaseThemeProvider>
    </div>
  );
}
