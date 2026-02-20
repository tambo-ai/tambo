/**
 * Prompt builder for InstallationPlan generation
 *
 * Converts ProjectAnalysis into a structured prompt for LLM consumption.
 * Includes Tambo SDK reference so the model generates accurate, actionable plans.
 */

import type { ProjectAnalysis } from "../project-analysis/types.js";
import { TAMBO_SDK_REFERENCE } from "./generated-sdk-reference.js";

export { TAMBO_SDK_REFERENCE };

const MAX_COMPONENTS = 10;
const MAX_TOOL_CANDIDATES = 10;

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
- Confidence score (0.0-1.0) using the rubric below
- Specific implementation details (file paths, import statements)

## Confidence Scoring Rubric

Score each recommendation using these criteria. Start at 0.5 and adjust:

**Components (generative registration):**
- +0.2 if component has well-defined props (typed interface/schema)
- +0.1 if component has a description (JSDoc) explaining its purpose
- +0.1 if component is user-facing (renders visible UI, not a layout wrapper or utility)
- +0.1 if component's props describe data an AI could plausibly generate (e.g. product info, chart data)
- -0.2 if component is a layout/structural wrapper (Header, Footer, Layout, Container)
- -0.2 if component has no props or only children props
- -0.1 if component relies heavily on external state (many hooks, context-dependent)

**Interactables (AI-updatable pre-placed components):**
- +0.2 if component represents user-editable content (forms, editors, settings)
- +0.1 if component has well-defined props that map to observable state
- +0.1 if component's purpose suggests bidirectional updates (e.g. filters, toggles, inputs)
- -0.2 if component is read-only display with no meaningful state to update
- -0.2 if component is purely decorative or structural

**Tools (functions AI can call):**
- +0.2 if function is a server action (structured, safe boundary)
- +0.1 if function has a clear JSDoc description of what it does
- +0.1 if function performs a distinct, useful operation (CRUD, search, computation)
- +0.1 if function has typed parameters that can map to a Zod schema
- -0.2 if function is an internal utility (not user-facing behavior)
- -0.1 if function has side effects that would be dangerous to invoke automatically

**Provider setup and chat widget:** Score 0.9+ unless there's a clear reason to lower (e.g. non-standard layout structure, conflicting providers).

Clamp all scores to [0.0, 1.0]. Only include items scoring >= 0.5.

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
      "confidence": 0.8
    }
  ],
  "toolRecommendations": [
    {
      "name": "toolName",
      "type": "server-action | fetch | axios | exported-function",
      "filePath": "path to source function",
      "reason": "why create this tool",
      "confidence": 0.8
    }
  ],
  "interactableRecommendations": [
    {
      "componentName": "ComponentName",
      "filePath": "path to component file",
      "reason": "why make this interactable",
      "confidence": 0.8
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
- Score every recommendation using the rubric above — do NOT guess confidence
- Only include items with confidence >= 0.5
- Explain which rubric factors drove the score in each rationale
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
        `- ${c.name} (${c.filePath}): ${c.hasProps ? "accepts props" : "no props"}, uses [${c.hooks.join(", ")}]${c.description ? ` — ${c.description}` : ""}`,
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
    .map(
      (t) =>
        `- ${t.name} (${t.type}, ${t.filePath}): ${t.description ?? "no description"}`,
    )
    .join("\n");

  if (remaining > 0) {
    return `${toolsList}\n... and ${remaining} more`;
  }

  return toolsList;
}
