/**
 * Execution prompt builder for the agentic code execution loop
 *
 * Builds a prompt that instructs the LLM to use filesystem tools
 * to apply the confirmed installation plan. Uses explicit code patterns
 * and anti-patterns to override LLM training priors.
 */

import { TAMBO_SDK_REFERENCE } from "../plan-generation/prompt-builder.js";
import type { InstallationPlan } from "../plan-generation/types.js";

/**
 * Build the execution prompt for the agentic loop
 *
 * @param plan - The confirmed installation plan (filtered to selected items)
 * @param selectedItems - IDs of the selected items
 * @param chatWidgetInstalled - Whether the chat widget was pre-installed via `tambo add`
 * @returns Prompt string for the execution agent
 */
export function buildExecutionPrompt(
  plan: InstallationPlan,
  selectedItems: string[],
  chatWidgetInstalled = false,
): string {
  const sections: string[] = [];

  sections.push(`You are a code execution agent. Your job is to apply changes to a project using the provided tools.

CRITICAL — These are common mistakes. DO NOT make them:
- NEVER import from "@tambo/react" — the correct package is "@tambo-ai/react"
- NEVER use registerComponent() — components are passed to TamboProvider via the components prop
- NEVER import TamboChatWidget — that component does not exist
- NEVER use useTamboInteractable() to wrap components — use the withTamboInteractable HOC instead
- NEVER destructure { ref } from any Tambo hook — no Tambo hook returns a ref
- NEVER add component registration code inside component files — use a single central registry file
- NEVER duplicate the same code across multiple files

${TAMBO_SDK_REFERENCE}

# Available Tools

- **readFile**: Read the contents of a file
- **writeFile**: Write content to a file (creates directories as needed)
- **listFiles**: List files in a directory

# Rules

- Always read a file before modifying it
- Preserve existing code — only add or modify what's needed
- Preserve existing formatting and style conventions
- Do NOT remove existing imports, components, or logic
- Write complete file contents when using writeFile (not partial patches)
- All file paths should be relative to the project root`);

  sections.push("# Changes to Apply\n");

  // Provider setup
  if (selectedItems.includes("provider-setup")) {
    const { filePath } = plan.providerSetup;
    sections.push(`## 1. Provider Setup

**File:** \`${filePath}\`

Create \`app/providers.tsx\` (or the equivalent directory where the layout lives):

\`\`\`tsx
"use client";
import { TamboProvider } from "@tambo-ai/react";
import { components } from "@/lib/tambo";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TamboProvider apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!} components={components}>
      {children}
    </TamboProvider>
  );
}
\`\`\`

Then update \`${filePath}\` to import and wrap children:
\`\`\`tsx
import { Providers } from "./providers";
// ... wrap {children} with <Providers>{children}</Providers>
\`\`\`

DO NOT:
- DO NOT import from "@tambo/react" — correct: "@tambo-ai/react"
- DO NOT skip the "use client" directive`);
  }

  // Component registrations
  const componentItems = selectedItems.filter((id) =>
    id.startsWith("component-"),
  );
  if (componentItems.length > 0) {
    const components = plan.componentRecommendations;
    const componentDescriptions = components
      .map((c) => `- **${c.name}** (from \`${c.filePath}\`): ${c.reason}`)
      .join("\n");

    sections.push(`## 2. Component Registration

Create ONE registry file: \`src/lib/tambo.ts\` (or \`lib/tambo.ts\` if no src/ directory).

Components to register:
${componentDescriptions}

The registry file MUST follow this exact pattern:

\`\`\`tsx
import { TamboComponent } from "@tambo-ai/react";
import { z } from "zod";
import { MyComponent } from "@/components/MyComponent";

const MyComponentSchema = z.object({
  title: z.string().describe("Display title"),
  count: z.number().optional().describe("Item count"),
});

export const components: TamboComponent[] = [
  {
    name: "MyComponent",
    component: MyComponent,
    description: "Displays X. Use when user asks about Y.",
    propsSchema: MyComponentSchema,
  },
];
\`\`\`

For each component:
1. Read the component file to understand its props
2. Create a Zod schema with \`.describe()\` on each field
3. Skip callback props (onClick, onChange, etc.) and children
4. Add the component to the \`components\` array

DO NOT:
- DO NOT call registerComponent() — that function does not exist
- DO NOT add registration code inside component files
- DO NOT duplicate the same registration in multiple files
- DO NOT create multiple registry files — use ONE file`);
  }

  // Tool definitions
  const toolItems = selectedItems.filter((id) => id.startsWith("tool-"));
  if (toolItems.length > 0) {
    const tools = plan.toolRecommendations;
    const toolDescriptions = tools
      .map(
        (t) =>
          `- **${t.name}** (${t.type} from \`${t.filePath}\`): ${t.reason}`,
      )
      .join("\n");

    sections.push(`## 3. Tool Definitions

Create tool definitions for:
${toolDescriptions}

Follow this exact pattern:

\`\`\`tsx
import { defineTool } from "@tambo-ai/react";
import { z } from "zod";

export const myTool = defineTool({
  name: "fetchData",
  description: "Fetches data by ID",
  inputSchema: z.object({ id: z.string().describe("The ID to fetch") }),
  tool: async ({ id }) => fetchData(id),
});
\`\`\`

For each tool:
1. Read the source file to understand the function signature
2. Create a Zod input schema based on the function parameters
3. Use \`defineTool\` from \`@tambo-ai/react\`
4. Export the tool so it can be passed to TamboProvider`);
  }

  // Interactable components
  const interactableItems = selectedItems.filter((id) =>
    id.startsWith("interactable-"),
  );
  if (interactableItems.length > 0) {
    const interactables = plan.interactableRecommendations;
    const interactableDescriptions = interactables
      .map((i) => `- **${i.componentName}** (\`${i.filePath}\`): ${i.reason}`)
      .join("\n");

    sections.push(`## 4. Interactable Components

Make the following components interactable:
${interactableDescriptions}

Follow this exact pattern:

\`\`\`tsx
import { withTamboInteractable } from "@tambo-ai/react";
import { z } from "zod";

const NoteSchema = z.object({
  title: z.string().describe("Note title"),
  content: z.string().describe("Note content"),
});

export const InteractableNote = withTamboInteractable(Note, {
  componentName: "Note",
  description: "A note with editable title and content",
  propsSchema: NoteSchema,
});
\`\`\`

For each component:
1. Read the component file
2. Import \`withTamboInteractable\` from \`@tambo-ai/react\`
3. Create a Zod schema for the component's props
4. Export the wrapped component

DO NOT:
- DO NOT use useTamboInteractable() — use the withTamboInteractable HOC
- DO NOT destructure { ref } from any hook
- DO NOT modify the original component's internal code`);
  }

  // Chat widget
  if (selectedItems.includes("chat-widget")) {
    const { filePath, position } = plan.chatWidgetSetup;

    if (chatWidgetInstalled) {
      sections.push(`## 5. Chat Widget

The chat widget component has already been installed at \`src/components/tambo/message-thread-full/\`.

**File:** \`${filePath}\`
**Position:** ${position}

1. Read the target file
2. Import the component: \`import { MessageThreadFull } from "@/components/tambo/message-thread-full"\`
3. Add it inside the TamboProvider tree, positioned at ${position}

DO NOT:
- DO NOT try to create the chat widget component yourself — it is already installed
- DO NOT import TamboChatWidget — that does not exist
- DO NOT try to build a chat UI from scratch`);
    } else {
      sections.push(`## 5. Chat Widget

**File:** \`${filePath}\`
**Position:** ${position}

1. Read the target file
2. Import the chat widget: \`import { MessageThreadFull } from "@/components/tambo/message-thread-full"\`
3. Add the component inside the body/main content area, positioned at ${position}
4. The widget must be inside the TamboProvider tree

DO NOT:
- DO NOT import TamboChatWidget — that does not exist
- DO NOT try to build a chat UI from scratch`);
    }
  }

  sections.push(`# Execution

Apply each change in order. Read files before modifying them. When you're done with all changes, output a brief summary of what was done.`);

  return sections.join("\n\n");
}
