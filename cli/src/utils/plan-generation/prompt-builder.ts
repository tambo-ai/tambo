/**
 * Prompt builder for InstallationPlan generation
 *
 * Converts ProjectAnalysis into a structured prompt for LLM consumption.
 * Includes Tambo SDK reference so the model generates accurate, actionable plans.
 */

import type { ProjectAnalysis } from "../project-analysis/types.js";

const MAX_COMPONENTS = 10;
const MAX_TOOL_CANDIDATES = 10;

/**
 * Tambo SDK reference for the model to understand available APIs and patterns.
 * Distilled from skills/ directory — kept concise to minimize token usage.
 */
const TAMBO_SDK_REFERENCE = `
# Tambo SDK Reference

## Provider Setup

TamboProvider wraps the app and provides AI context. It requires an API key, component registry, and optionally tools.

### Next.js App Router (recommended)

Create a client component for providers:

\`\`\`tsx
// app/providers.tsx
"use client";
import { TamboProvider } from "@tambo-ai/react";
import { components } from "@/lib/tambo";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TamboProvider apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY} components={components}>
      {children}
    </TamboProvider>
  );
}
\`\`\`

Then wrap in layout:

\`\`\`tsx
// app/layout.tsx — import Providers and wrap {children}
import { Providers } from "./providers";
\`\`\`

### Vite / CRA

\`\`\`tsx
// src/main.tsx — wrap App in TamboProvider
import { TamboProvider } from "@tambo-ai/react";
import { components } from "./lib/tambo";
\`\`\`

## Component Registration

Components are registered in a central registry file (lib/tambo.ts or src/lib/tambo.ts):

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

Key rules:
- Each prop needs .describe() for the AI to understand it
- Skip callback props (onClick, onChange) — AI provides data, not behavior
- Skip children prop
- Make streaming-friendly props optional

## Tool Definitions

Tools let AI call JavaScript functions:

\`\`\`tsx
import { defineTool } from "@tambo-ai/react";

const myTool = defineTool({
  name: "fetchData",
  description: "Fetches data by ID",
  inputSchema: z.object({ id: z.string().describe("The ID to fetch") }),
  tool: async ({ id }) => fetchData(id),
});

// Pass to provider: <TamboProvider tools={[myTool]}>
\`\`\`

## Interactable Components

Pre-placed components that AI can observe and update:

\`\`\`tsx
import { withTamboInteractable } from "@tambo-ai/react";

export const InteractableNote = withTamboInteractable(Note, {
  componentName: "Note",
  description: "A note with editable title and content",
  propsSchema: NoteSchema,
});
\`\`\`

## Chat Widget

Add via CLI: \`npx tambo add message-thread-full --yes\`
This creates a component at src/components/tambo/message-thread-full/
Import and render it inside the TamboProvider tree.

The chat widget file path for the plan should be the layout or page file where the widget will be rendered (e.g. "app/layout.tsx" or "app/page.tsx"), NOT the component file itself.
`.trim();

/**
 * Builds a structured prompt from project analysis.
 *
 * @param analysis - Project analysis containing framework, components, tools, etc.
 * @returns Structured prompt string for LLM
 */
export function buildPlanPrompt(analysis: ProjectAnalysis): string {
  const tsInfo = analysis.typescript.isTypeScript
    ? `Yes (strict: ${analysis.typescript.strict})`
    : "No";

  const structureLayout = analysis.structure.hasSrcDir ? "src/" : "root";

  // Build providers list
  const providersSection = buildProvidersSection(analysis);

  // Build components list (limit to top 10)
  const componentsSection = buildComponentsSection(analysis);

  // Build tool candidates list (limit to top 10)
  const toolCandidatesSection = buildToolCandidatesSection(analysis);

  return `
You are analyzing a ${analysis.framework.displayName} project to generate an intelligent Tambo installation plan.

${TAMBO_SDK_REFERENCE}

# Project Context

**Framework:** ${analysis.framework.displayName}
**TypeScript:** ${tsInfo}
**Package Manager:** ${analysis.packageManager}
**Structure:** ${structureLayout} layout

## Existing Providers (${analysis.providers.length})
${providersSection}

## Available Components (${analysis.components.length})
${componentsSection}

## Tool Candidates (${analysis.toolCandidates.length})
${toolCandidatesSection}

# Task

Generate a comprehensive Tambo installation plan with these recommendation categories:

1. **Provider Setup** - Where and how to add TamboProvider
2. **Component Registrations** - Which components to register as AI-controllable
3. **Tool Definitions** - Which tool candidates to implement as Tambo tools
4. **Interactables** - Which existing components to enhance with Tambo interactability
5. **Chat Widget** - Where to add the chat interface

For each recommendation, provide:
- Clear rationale explaining WHY this is recommended
- Confidence score (0.0-1.0) based on signal strength
- Specific implementation details (file paths, import statements)

Output your analysis as valid JSON matching this structure:

{
  "providerSetup": {
    "filePath": "path to layout file, e.g. app/layout.tsx",
    "nestingLevel": 0,
    "rationale": "why this location",
    "confidence": 0.95
  },
  "componentRecommendations": [
    {
      "name": "ComponentName",
      "filePath": "path to component file, e.g. src/components/MyComponent.tsx",
      "reason": "why register this component",
      "confidence": 0.8,
      "suggestedRegistration": "TamboComponent registration code snippet"
    }
  ],
  "toolRecommendations": [
    {
      "name": "toolName",
      "type": "server-action | fetch | axios | exported-function",
      "filePath": "path to source function",
      "reason": "why create this tool",
      "confidence": 0.8,
      "suggestedSchema": "Zod schema string for tool input"
    }
  ],
  "interactableRecommendations": [
    {
      "componentName": "ComponentName",
      "filePath": "path to component file",
      "reason": "why make this interactable",
      "confidence": 0.8,
      "integrationPattern": "withTamboInteractable usage code"
    }
  ],
  "chatWidgetSetup": {
    "filePath": "path to file where chat widget will be rendered, e.g. app/page.tsx",
    "position": "bottom-right | bottom-left | top-right | sidebar",
    "rationale": "why this position",
    "confidence": 0.9
  }
}

IMPORTANT:
- Only recommend high-confidence items (>0.7) unless explicitly valuable
- Prioritize user-facing components over internal utilities
- Consider existing architecture and conventions
- Provide actionable, specific guidance in each rationale
- All filePath values MUST be real filesystem paths (e.g. "app/layout.tsx", "src/lib/tambo.ts") — never include descriptions, parenthetical notes, or natural language in filePath fields
- Output ONLY valid JSON, no additional text or markdown code blocks
`.trim();
}

/**
 * Builds the providers section of the prompt.
 *
 * @param analysis - Project analysis
 * @returns Formatted providers section
 */
function buildProvidersSection(analysis: ProjectAnalysis): string {
  if (analysis.providers.length === 0) {
    return "None detected";
  }

  return analysis.providers
    .map((p) => `- ${p.name} (from ${p.importSource})`)
    .join("\n");
}

/**
 * Builds the components section of the prompt, limiting to top 10.
 *
 * @param analysis - Project analysis
 * @returns Formatted components section
 */
function buildComponentsSection(analysis: ProjectAnalysis): string {
  if (analysis.components.length === 0) {
    return "None detected";
  }

  const componentsToShow = analysis.components.slice(0, MAX_COMPONENTS);
  const remaining = analysis.components.length - MAX_COMPONENTS;

  const componentsList = componentsToShow
    .map(
      (c) =>
        `- ${c.name} (${c.filePath}): ${c.hasProps ? "accepts props" : "no props"}, uses [${c.hooks.join(", ")}]`,
    )
    .join("\n");

  if (remaining > 0) {
    return `${componentsList}\n... and ${remaining} more`;
  }

  return componentsList;
}

/**
 * Builds the tool candidates section of the prompt, limiting to top 10.
 *
 * @param analysis - Project analysis
 * @returns Formatted tool candidates section
 */
function buildToolCandidatesSection(analysis: ProjectAnalysis): string {
  if (analysis.toolCandidates.length === 0) {
    return "None detected";
  }

  const toolsToShow = analysis.toolCandidates.slice(0, MAX_TOOL_CANDIDATES);
  const remaining = analysis.toolCandidates.length - MAX_TOOL_CANDIDATES;

  const toolsList = toolsToShow
    .map((t) => `- ${t.name} (${t.type}): ${t.description ?? "no description"}`)
    .join("\n");

  if (remaining > 0) {
    return `${toolsList}\n... and ${remaining} more`;
  }

  return toolsList;
}
