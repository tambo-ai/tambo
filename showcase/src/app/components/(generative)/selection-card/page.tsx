"use client";

import { CLI } from "@/components/cli";
import { SelectionChatInterface } from "@/components/generative/SelectionChatInterface";
import { CopyablePrompt, Section } from "@/components/ui/doc-components";
import { ShowcaseThemeProvider } from "@/providers/showcase-theme-provider";
import { TamboProvider } from "@tambo-ai/react";
import { DemoWrapper } from "../../demo-wrapper";

export default function SelectionCardPage() {
  const installCommand = "npx tambo add selection-card";

  const examplePrompt = `Create a user selection interface with the following requirements:
- Use multi-select mode
- Include these team members: "John Doe (Admin)", "Jane Smith (Developer)", "Bob Johnson (Designer)", "Alice Brown (Manager)", "Charlie Wilson (QA)"
- Disable "Jane Smith (Developer)" as she's currently on leave
- Pre-select "John Doe (Admin)" and "Alice Brown (Manager)"
- Add a custom CSS class for styling: "team-selector"

This will be used for assigning team members to a new project.`;

  const singleSelectPrompt = `Create a priority selection interface:
- Use single-select mode  
- Options: "Low", "Medium", "High", "Critical"
- Pre-select "Medium" as default
- This will be used for setting task priority in a project management system.`;

  const largeListPrompt = `Create a country selection interface:
- Use multi-select mode
- Include at least 20+ countries as options
- Show total count of available countries
- Allow users to select multiple countries for their international shipping preferences
- Pre-select a few popular countries like "United States", "United Kingdom", "Canada"`;

  return (
    <div className="container mx-auto pt-6 px-6 max-w-4xl">
      <ShowcaseThemeProvider defaultTheme="light">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold mb-4">Selection Card</h1>
            <p className="text-lg text-secondary">
              A flexible selection controller component for handling single and
              multi-select scenarios with advanced features like disabled items,
              keyboard navigation, and accessibility support.
            </p>
            <div className="flex flex-wrap gap-2 text-sm mt-3">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                AI-Generated
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                Multi-Select
              </span>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                Keyboard Support
              </span>
              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded">
                Accessible
              </span>
              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
                Scalable
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Installation</h2>
            <div className="rounded-md">
              <CLI command={installCommand} />
            </div>
          </div>

          <Section title="Example Prompts">
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">
                  Multi-Select Team Assignment
                </h3>
                <CopyablePrompt prompt={examplePrompt} />
              </div>

              <div>
                <h3 className="font-medium mb-2">
                  Single-Select Priority Setting
                </h3>
                <CopyablePrompt prompt={singleSelectPrompt} />
              </div>

              <div>
                <h3 className="font-medium mb-2">Large List Selection</h3>
                <CopyablePrompt prompt={largeListPrompt} />
              </div>
            </div>
          </Section>

          <DemoWrapper title="Selection Card AI Interface" height={800}>
            <TamboProvider
              apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? ""}
              tamboUrl={process.env.NEXT_PUBLIC_TAMBO_API_URL ?? ""}
            >
              <SelectionChatInterface />
            </TamboProvider>
          </DemoWrapper>
        </div>
      </ShowcaseThemeProvider>
    </div>
  );
}
