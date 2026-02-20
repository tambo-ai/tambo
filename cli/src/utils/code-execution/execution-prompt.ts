/**
 * Execution prompt builder for the agentic code execution loop
 *
 * Builds a concise prompt that instructs the LLM to use filesystem tools
 * to apply the confirmed installation plan. Includes summarized SDK
 * reference from relevant skills so the agent knows correct patterns.
 */

import type { InstallationPlan } from "../plan-generation/types.js";

/**
 * Summarized provider setup reference (from add-to-existing-project skill)
 *
 * @returns Provider setup reference with the given API key
 */
function buildProviderReference(envPrefix: string | null): string {
  const apiKeyEnvVar = `${envPrefix ?? ""}TAMBO_API_KEY`;
  return `## Provider Setup

Wrap your app with TamboProvider. For Next.js App Router, create a client component.

CRITICAL: TamboProvider REQUIRES both \`apiKey\` and either \`userKey\` or \`userToken\`. The app will break without a userKey.

\`\`\`tsx
// app/providers.tsx
"use client";
import { useState } from "react";
import { TamboProvider } from "@tambo-ai/react";
import { components } from "@/lib/tambo";

function getUserKey(): string {
  if (typeof window === "undefined") return "server";
  const stored = localStorage.getItem("tambo-user-key");
  if (stored) return stored;
  const key = crypto.randomUUID();
  localStorage.setItem("tambo-user-key", key);
  return key;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [userKey] = useState(getUserKey);

  return (
    <TamboProvider
      apiKey={process.env.${apiKeyEnvVar}!}
      userKey={userKey}
      components={components}
    >
      {children}
    </TamboProvider>
  );
}
\`\`\`

Then import and wrap children in the root layout.

NOTE: The \`getUserKey()\` function above generates a stable anonymous user ID stored in localStorage. If the app has authentication, replace it with the authenticated user's ID instead (e.g. \`user.id\` from your auth provider).

**Environment variables**: Add \`${apiKeyEnvVar}\` to your \`.env.local\` file.`;
}

/** Summarized generative component reference (from components + add-components-to-registry skills) */
const GENERATIVE_COMPONENT_REFERENCE = `## Generative Components

Register existing components so AI can render them on demand. Create ONE registry file (\`lib/tambo.ts\` or \`src/lib/tambo.ts\`):

\`\`\`tsx
import { TamboComponent } from "@tambo-ai/react";
import { z } from "zod";
import { ProductCard } from "@/components/ProductCard";

const ProductCardSchema = z.object({
  name: z.string().describe("Product name"),
  price: z.number().describe("Price in dollars"),
  imageUrl: z.string().optional().describe("Product image URL"),
});

export const components: TamboComponent[] = [
  {
    name: "ProductCard",
    component: ProductCard,
    description: "Displays a product with name, price, and image. Use when user asks about products.",
    propsSchema: ProductCardSchema,
  },
];
\`\`\`

For each component: read its file, create a Zod schema from its props (use \`.describe()\` on each field), skip callback props and children.`;

/** Summarized interactable component reference (from components skill) */
const INTERACTABLE_REFERENCE = `## Interactable Components

Wrap pre-placed components with \`withTamboInteractable\` so AI can observe and update their props:

\`\`\`tsx
import { withTamboInteractable } from "@tambo-ai/react";
import { z } from "zod";

const NoteSchema = z.object({
  title: z.string().describe("Note title"),
  content: z.string().describe("Note content"),
});

export const InteractableNote = withTamboInteractable(Note, {
  componentName: "Note",
  description: "A note with editable title, content, and color",
  propsSchema: NoteSchema,
});
\`\`\`

The component auto-registers when mounted. Current props are visible to AI and updates work bidirectionally.`;

/** Summarized tool definition reference (from tools-and-context skill) */
const TOOL_REFERENCE = `## Custom Tools

Register functions Tambo can call using \`defineTool\`:

\`\`\`tsx
import { defineTool } from "@tambo-ai/react";
import { z } from "zod";

export const fetchUserTool = defineTool({
  name: "fetchUser",
  description: "Fetch a user by ID",
  inputSchema: z.object({
    userId: z.string().describe("The user ID to fetch"),
  }),
  tool: async ({ userId }) => fetchUser(userId),
});
\`\`\`

Pass tools to \`<TamboProvider tools={[fetchUserTool]}>\`.`;

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
  envPrefix?: string | null,
): string {
  const sections: string[] = [];

  // System instruction
  sections.push(`You are a code execution agent. Apply the changes listed below using the provided tools. Do not ask the user questions — follow the plan exactly.

# Tools

- **readFile** — read a single file's contents
- **readFiles** — read multiple files at once (pass an array of paths, returns content for each)
- **writeFile** — write content to a file (creates directories as needed)
- **listFiles** — list files in a directory (excludes node_modules, .git, build artifacts)
- **submitPlan** — submit your execution plan before making changes (call this first)
- **updatePlan** — mark a plan step as done after completing it

# Rules

1. **First**, call \`submitPlan\` with the list of steps you will take
2. After completing each step's file writes, call \`updatePlan\` with the step ID
3. Then proceed to the next step
- Read a file before modifying it
- Preserve existing code, imports, and formatting — only add or modify what's needed
- Write complete file contents when using writeFile (not partial patches)
- Use relative paths from the project root`);

  // Include only the SDK reference sections relevant to the plan
  const hasProvider = selectedItems.includes("provider-setup");
  const hasComponents = selectedItems.some((id) => id.startsWith("component-"));
  const hasInteractables = selectedItems.some((id) =>
    id.startsWith("interactable-"),
  );
  const hasTools = selectedItems.some((id) => id.startsWith("tool-"));

  const references: string[] = [];
  const resolvedEnvPrefix = envPrefix ?? null;
  const apiKeyEnvVar = `${resolvedEnvPrefix ?? ""}TAMBO_API_KEY`;

  if (hasProvider) references.push(buildProviderReference(resolvedEnvPrefix));
  if (hasComponents) references.push(GENERATIVE_COMPONENT_REFERENCE);
  if (hasInteractables) references.push(INTERACTABLE_REFERENCE);
  if (hasTools) references.push(TOOL_REFERENCE);

  if (references.length > 0) {
    sections.push(`# Tambo SDK Reference\n\n${references.join("\n\n")}`);
  }

  // Task-specific changes
  sections.push("# Changes to Apply\n");

  // Provider setup
  if (hasProvider) {
    const { filePath } = plan.providerSetup;
    sections.push(`## 1. Provider Setup

This is the most important step — TamboProvider MUST wrap the entire application.
CRITICAL: Both \`apiKey\` and \`userKey\` are REQUIRED. The app will break without them.

**Step 1:** Create \`app/providers.tsx\`:

\`\`\`tsx
"use client";
import { useState } from "react";
import { TamboProvider } from "@tambo-ai/react";
import { components } from "@/lib/tambo";

function getUserKey(): string {
  if (typeof window === "undefined") return "server";
  const stored = localStorage.getItem("tambo-user-key");
  if (stored) return stored;
  const key = crypto.randomUUID();
  localStorage.setItem("tambo-user-key", key);
  return key;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [userKey] = useState(getUserKey);

  return (
    <TamboProvider
      apiKey={process.env.${apiKeyEnvVar}!}
      userKey={userKey}
      components={components}
    >
      {children}
    </TamboProvider>
  );
}
\`\`\`

**Step 2:** Read \`${filePath}\`, then rewrite it so \`<Providers>\` wraps ALL content inside \`<body>\`:

\`\`\`tsx
import { Providers } from "./providers";

// inside the layout's return:
<body>
  <Providers>
    {/* everything that was already here, including {children} */}
  </Providers>
</body>
\`\`\``);
  }

  // Component registrations
  if (hasComponents) {
    const components = plan.componentRecommendations;
    const componentDescriptions = components
      .map((c) => `- **${c.name}** (\`${c.filePath}\`): ${c.reason}`)
      .join("\n");

    sections.push(`## 2. Component Registration

Create \`src/lib/tambo.ts\` (or \`lib/tambo.ts\` if no src/ directory).

Components to register:
${componentDescriptions}

For each: read the component file, create a Zod schema from its props, add to the \`components\` array (see reference above).`);
  }

  // Tool definitions
  if (hasTools) {
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

For each: read the source file, create a \`defineTool\` call with a Zod input schema (see reference above).`);
  }

  // Interactable components
  if (hasInteractables) {
    const interactables = plan.interactableRecommendations;
    const interactableDescriptions = interactables
      .map((i) => `- **${i.componentName}** (\`${i.filePath}\`): ${i.reason}`)
      .join("\n");

    sections.push(`## 4. Interactable Components

Wrap with \`withTamboInteractable\`:
${interactableDescriptions}

For each: read the component file, create a Zod schema, export the wrapped component (see reference above).`);
  }

  // Chat widget
  if (selectedItems.includes("chat-widget")) {
    const { filePath, position } = plan.chatWidgetSetup;

    if (chatWidgetInstalled) {
      sections.push(`## 5. Chat Widget

Already installed at \`src/components/tambo/message-thread-full/\`.

1. Read \`${filePath}\`
2. Import: \`import { MessageThreadFull } from "@/components/tambo/message-thread-full"\`
3. Add inside the TamboProvider tree, positioned at ${position}`);
    } else {
      sections.push(`## 5. Chat Widget

1. Read \`${filePath}\`
2. Import: \`import { MessageThreadFull } from "@/components/tambo/message-thread-full"\`
3. Add inside the body/main content area at ${position}, within the TamboProvider tree`);
    }
  }

  sections.push(
    `# Execution

Apply each change in order. Read files before modifying them. When done, output a brief summary of what was changed, followed by these recommended next steps:

# Next Steps

1. Add your \`${apiKeyEnvVar}\` to \`.env.local\`
2. If your app has authentication, replace the \`getUserKey()\` function in providers.tsx with your authenticated user's ID
3. Run the dev server and test the Tambo integration
4. Read the docs at https://docs.tambo.co for guides on components, tools, and threads`,
  );

  return sections.join("\n\n");
}
