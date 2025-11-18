"use client";

import { CLI } from "@/components/cli";
import { DateTimeRangePickerChatInterface } from "@/components/generative/DateTimeRangeChatInterface";
import { CopyablePrompt, Section } from "@/components/ui/doc-components";
import { TamboProvider } from "@tambo-ai/react";
import { DemoWrapper } from "../../demo-wrapper";

export default function DateTimeRangePickerPage() {
  const installCommand = "npx tambo add datetime-range-picker";

  const examplePrompt = `Create a DateTimeRangePicker with:
- bordered variant
- presets enabled
- max range of 30 days
- timezone: "America/New_York"
- Include quick presets: Today, Last 7 Days, This Month
- Disable dates before 2023-01-01`;

  return (
    <div className="container mx-auto pt-6 px-6 max-w-4xl">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold mb-4">Date Time Range</h1>
          <p className="text-lg text-muted-foreground">
            A flexible date & time range selection UI component with presets,
            validation, timezone support, and AI-controlled interactions.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Installation</h2>
          <CLI command={installCommand} />
        </div>

        <Section title="Example Prompt">
          <CopyablePrompt prompt={examplePrompt} />
        </Section>

        <DemoWrapper title="DateTimeRangePicker Demo" height={800}>
          <TamboProvider
            apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? ""}
            tamboUrl={process.env.NEXT_PUBLIC_TAMBO_API_URL ?? ""}
          >
            <DateTimeRangePickerChatInterface />
          </TamboProvider>
        </DemoWrapper>
      </div>
    </div>
  );
}
