# Phase 3: Plan Generation - Research

**Researched:** 2026-02-12
**Domain:** LLM-powered code analysis and installation plan generation
**Confidence:** HIGH

## Summary

Phase 3 builds an AI-powered plan generator that analyzes codebase scan results from Phase 2 and produces structured installation recommendations. The implementation leverages the existing client-core SDK (Phase 1) to communicate with the Tambo API, which uses Claude for intelligent analysis. The plan generator will consume the `ProjectAnalysis` output from Phase 2's `analyzeProject()` function and produce structured recommendations for components, tools, interactables, and provider setup.

The core technical challenge is prompt engineering: crafting prompts that effectively convey codebase context to the model, request structured output, and produce actionable recommendations with rationale and confidence scores. The solution uses streaming responses for real-time feedback, Zod schemas for output validation, and follows established patterns from client-core's `executeRun` and tool registry system.

**Primary recommendation:** Use client-core's `executeRun()` with streaming to send codebase analysis to the Tambo API, define a Zod schema for the expected plan structure, and validate/parse the model's response into a typed `InstallationPlan` object suitable for Phase 4 confirmation UI.

## User Constraints (from CONTEXT.md)

<user_constraints>

### Locked Decisions

None - user gave full discretion on implementation approach.

### Claude's Discretion

All implementation areas are at Claude's discretion:

- **Recommendation scope** — What gets recommended (components, tools, interactables, provider setup, config, chat widget). How granular each recommendation is.
- **Confidence scoring** — What scores mean, how they're derived from scan signals, whether low-confidence items are included or filtered.
- **Prompt & model interaction** — How scan data is passed to the model, single vs multi-turn, output format structure.
- **Plan structure** — How the output plan is organized (by type, file, priority), what metadata accompanies each recommendation.

### Deferred Ideas (OUT OF SCOPE)

None - discussion stayed within phase scope.
</user_constraints>

## Standard Stack

### Core

| Library                    | Version  | Purpose                                  | Why Standard                                                                            |
| -------------------------- | -------- | ---------------------------------------- | --------------------------------------------------------------------------------------- |
| `@tambo-ai/client-core`    | Internal | Tambo API communication with streaming   | Built in Phase 1; provides `executeRun()` for model interaction and tool execution loop |
| `zod`                      | ^3.24    | Schema validation for structured outputs | Already used throughout project; provides type-safe validation and inference            |
| `@tambo-ai/typescript-sdk` | ^1.x     | Underlying API client                    | Wrapped by client-core; provides low-level API types                                    |
| `@tanstack/query-core`     | ^5.x     | Response caching                         | Already in client-core; useful if plan generation becomes multi-turn                    |

### Supporting

| Library              | Version | Purpose                       | When to Use                                                             |
| -------------------- | ------- | ----------------------------- | ----------------------------------------------------------------------- |
| `zod-to-json-schema` | ^3.24   | Convert Zod to JSON Schema    | Already in client-core; useful if plan generator needs tool definitions |
| `type-fest`          | Latest  | Advanced TypeScript utilities | Standard across project; use for complex type manipulation              |

### Alternatives Considered

| Instead of    | Could Use               | Tradeoff                                                                                                          |
| ------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Zod           | JSON Schema (raw)       | Zod provides better TypeScript inference and validation error messages                                            |
| Streaming     | Batch request           | Streaming enables progressive UI updates but adds complexity; batch is simpler for single-shot generation         |
| Single prompt | Multi-turn conversation | Multi-turn allows refinement but increases latency and complexity; single prompt with structured output is faster |

**Installation:**

```bash
# Already installed in packages/client-core
# No new dependencies needed for basic implementation
```

## Architecture Patterns

### Recommended Project Structure

```
cli/src/
├── commands/
│   └── magic-init.ts              # New command entry point
├── utils/
│   ├── project-analysis/          # Phase 2 (existing)
│   │   └── index.ts               # analyzeProject() orchestrator
│   └── plan-generation/           # Phase 3 (new)
│       ├── index.ts               # generatePlan() orchestrator
│       ├── types.ts               # InstallationPlan, Recommendation types
│       ├── prompt-builder.ts      # Convert ProjectAnalysis → prompt
│       ├── plan-parser.ts         # Parse/validate model output
│       └── schemas.ts             # Zod schemas for plan structure
```

### Pattern 1: Single-Turn Plan Generation with Structured Output

**What:** Send entire codebase analysis as context, request JSON-structured plan in single API call

**When to use:** When plan complexity is manageable in single prompt, no user clarification needed mid-generation

**Example:**

```typescript
// Source: Context7 Anthropic SDK + established patterns
import {
  createTamboClient,
  executeRun,
  createToolRegistry,
} from "@tambo-ai/client-core";
import type { ProjectAnalysis } from "../project-analysis/types.js";
import type { InstallationPlan } from "./types.js";
import { installationPlanSchema } from "./schemas.js";

export async function generatePlan(
  projectAnalysis: ProjectAnalysis,
  apiKey: string,
): Promise<InstallationPlan> {
  const client = createTamboClient({ apiKey });

  // Create thread for plan generation
  const thread = await client.threads.create({
    title: "Installation Plan Generation",
  });

  // Build structured prompt from analysis
  const prompt = buildPlanPrompt(projectAnalysis);

  // Execute streaming run (no tools needed for this phase)
  const responseText = await executeRun(client, thread.id, prompt, {
    onEvent: (event) => {
      // Stream events to CLI UI for progress indication
      if (event.type === "TEXT_MESSAGE_CONTENT") {
        // Update spinner or progress indicator
      }
    },
  });

  // Parse and validate structured output
  const parsed = extractJsonFromResponse(responseText);
  const validated = installationPlanSchema.parse(parsed);

  return validated;
}
```

### Pattern 2: Prompt Structure for Code Analysis

**What:** Structured prompt that provides context, defines output format, and requests rationale

**When to use:** All LLM-based code analysis; ensures consistent, parseable responses

**Example:**

```typescript
function buildPlanPrompt(analysis: ProjectAnalysis): string {
  return `
You are analyzing a ${analysis.framework.displayName} project to generate an intelligent Tambo installation plan.

# Project Context

**Framework:** ${analysis.framework.displayName}
**TypeScript:** ${analysis.typescript.isTypeScript ? "Yes (strict: " + analysis.typescript.strict + ")" : "No"}
**Package Manager:** ${analysis.packageManager}
**Structure:** ${analysis.structure.hasSrcDir ? "src/" : "root"} layout

## Existing Providers (${analysis.providers.length})
${analysis.providers.map((p) => `- ${p.name} (from ${p.importSource})`).join("\n")}

## Available Components (${analysis.components.length})
${analysis.components
  .slice(0, 10)
  .map(
    (c) =>
      `- ${c.name} (${c.filePath}): ${c.hasProps ? "accepts props" : "no props"}, uses [${c.hooks.join(", ")}]`,
  )
  .join("\n")}
${analysis.components.length > 10 ? `... and ${analysis.components.length - 10} more` : ""}

## Tool Candidates (${analysis.toolCandidates.length})
${analysis.toolCandidates
  .slice(0, 10)
  .map((t) => `- ${t.name} (${t.type}): ${t.description || "no description"}`)
  .join("\n")}
${analysis.toolCandidates.length > 10 ? `... and ${analysis.toolCandidates.length - 10} more` : ""}

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
    "filePath": "string",
    "nestingLevel": "number",
    "rationale": "string",
    "confidence": "number"
  },
  "componentRecommendations": [
    {
      "name": "string",
      "filePath": "string",
      "reason": "string",
      "confidence": "number",
      "suggestedRegistration": "string"
    }
  ],
  "toolRecommendations": [
    {
      "name": "string",
      "type": "server-action | fetch | exported-function",
      "filePath": "string",
      "reason": "string",
      "confidence": "number",
      "suggestedSchema": "string"
    }
  ],
  "interactableRecommendations": [
    {
      "componentName": "string",
      "filePath": "string",
      "reason": "string",
      "confidence": "number",
      "integrationPattern": "string"
    }
  ],
  "chatWidgetSetup": {
    "filePath": "string",
    "position": "string",
    "rationale": "string",
    "confidence": "number"
  }
}

IMPORTANT:
- Only recommend high-confidence items (>0.7) unless explicitly valuable
- Prioritize user-facing components over internal utilities
- Consider existing architecture and conventions
- Provide actionable, specific guidance in each rationale
`.trim();
}
```

### Pattern 3: Zod Schema for Plan Validation

**What:** Type-safe schema that validates LLM output structure and provides TypeScript types

**When to use:** Any structured LLM output that needs validation and type safety

**Example:**

```typescript
// Source: Context7 Zod + established patterns
import { z } from "zod";

// Confidence score validation
const confidenceSchema = z
  .number()
  .min(0)
  .max(1)
  .describe("Confidence score between 0.0 and 1.0");

// Provider setup recommendation
const providerSetupSchema = z.object({
  filePath: z.string().describe("Absolute path to layout file"),
  nestingLevel: z
    .number()
    .int()
    .min(0)
    .describe("How deeply to nest (0=outermost)"),
  rationale: z.string().min(10).describe("Why this location is recommended"),
  confidence: confidenceSchema,
});

// Component registration recommendation
const componentRecommendationSchema = z.object({
  name: z.string().describe("Component name"),
  filePath: z.string().describe("Absolute path to component file"),
  reason: z.string().min(10).describe("Why register this component"),
  confidence: confidenceSchema,
  suggestedRegistration: z.string().describe("Suggested registration code"),
});

// Tool creation recommendation
const toolRecommendationSchema = z.object({
  name: z.string().describe("Tool name"),
  type: z
    .enum(["server-action", "fetch", "axios", "exported-function"])
    .describe("Tool candidate type"),
  filePath: z.string().describe("Absolute path to source function"),
  reason: z.string().min(10).describe("Why create this tool"),
  confidence: confidenceSchema,
  suggestedSchema: z.string().describe("Suggested Zod schema for tool input"),
});

// Interactable integration recommendation
const interactableRecommendationSchema = z.object({
  componentName: z.string().describe("Target component name"),
  filePath: z.string().describe("Absolute path to component"),
  reason: z.string().min(10).describe("Why make this interactable"),
  confidence: confidenceSchema,
  integrationPattern: z.string().describe("How to integrate interactability"),
});

// Chat widget placement
const chatWidgetSetupSchema = z.object({
  filePath: z.string().describe("Where to add chat widget"),
  position: z
    .enum(["bottom-right", "bottom-left", "top-right", "sidebar"])
    .describe("Widget position"),
  rationale: z.string().min(10).describe("Why this position"),
  confidence: confidenceSchema,
});

// Full installation plan
export const installationPlanSchema = z.object({
  providerSetup: providerSetupSchema,
  componentRecommendations: z.array(componentRecommendationSchema),
  toolRecommendations: z.array(toolRecommendationSchema),
  interactableRecommendations: z.array(interactableRecommendationSchema),
  chatWidgetSetup: chatWidgetSetupSchema,
});

// Inferred TypeScript type
export type InstallationPlan = z.infer<typeof installationPlanSchema>;
```

### Pattern 4: Extracting JSON from LLM Text Response

**What:** Parse JSON from mixed text/JSON response, handling markdown code blocks and extra text

**When to use:** When LLM may include explanatory text around the JSON output

**Example:**

````typescript
function extractJsonFromResponse(text: string): unknown {
  // Try to extract JSON from markdown code block
  const codeBlockMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    return JSON.parse(codeBlockMatch[1]);
  }

  // Try to find JSON object/array in text
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1]);
  }

  // If no match, try parsing entire response
  return JSON.parse(text);
}
````

### Anti-Patterns to Avoid

- **Over-prescriptive prompts:** Don't specify every detail; let the model use its judgment within constraints. Trust the model to make reasonable recommendations.
- **Ignoring validation errors:** Don't catch Zod errors silently; surface them to debug prompt/schema mismatches early.
- **Massive context dumps:** Don't send entire file contents; summarize and prioritize most relevant signals. Keep prompts under 50K tokens.
- **Hard-coded thresholds:** Don't filter confidence scores arbitrarily; let Phase 4 UI handle user selection. Present all recommendations, let user decide.
- **Blocking UI on slow generation:** Use streaming events to show progress; don't make user wait for complete response with no feedback.

## Don't Hand-Roll

| Problem           | Don't Build            | Use Instead                       | Why                                                          |
| ----------------- | ---------------------- | --------------------------------- | ------------------------------------------------------------ |
| API communication | Raw fetch with retry   | `client-core.executeRun()`        | Already handles streaming, errors, reconnection from Phase 1 |
| Schema validation | Manual JSON validation | `zod` schemas                     | Type-safe, better errors, automatic inference                |
| JSON parsing      | String manipulation    | `JSON.parse()` + regex extraction | Handle markdown blocks and mixed content reliably            |
| Streaming events  | Custom SSE parser      | `client-core` streaming           | Already tested and handles edge cases                        |
| Prompt templating | String concatenation   | Template literals with formatters | More readable, easier to maintain                            |

**Key insight:** Phase 1 (client-core) already solved LLM communication, streaming, and error handling. Phase 3 focuses on prompt engineering and output parsing, not low-level API integration.

## Common Pitfalls

### Pitfall 1: Token Limit Overflow

**What goes wrong:** Sending entire codebase context exceeds model's context window, request fails or gets truncated

**Why it happens:** ProjectAnalysis can contain hundreds of components/files; naive serialization creates huge prompts

**How to avoid:**

- Summarize and prioritize: top 10 components by relevance, key tool candidates only
- Use token estimation: count approximate tokens before sending (rough: 4 chars = 1 token)
- Implement fallback: if analysis too large, ask model to work with subset and warn user

**Warning signs:** API errors about context length, truncated responses, incomplete plans

### Pitfall 2: Unparseable LLM Output

**What goes wrong:** Model returns valid text but not valid JSON, or JSON doesn't match expected schema

**Why it happens:** Model interprets prompt creatively, adds explanation text, uses different field names

**How to avoid:**

- Be explicit in prompt: "Output ONLY valid JSON, no additional text"
- Show example output structure in prompt
- Use Zod for validation and provide clear error messages
- Implement retry logic: if parse fails, ask model to fix output format

**Warning signs:** JSON.parse errors, Zod validation failures, missing required fields

### Pitfall 3: Low-Quality Recommendations

**What goes wrong:** Model recommends irrelevant components, generic rationale, inaccurate confidence scores

**Why it happens:** Insufficient context, prompt doesn't emphasize quality criteria, no examples of good recommendations

**How to avoid:**

- Provide clear recommendation criteria in prompt (user-facing over internal, specific over generic)
- Include examples of good rationale in prompt (specific references to codebase patterns)
- Validate confidence scores make sense (high confidence requires strong signals)
- Consider few-shot examples: show sample analysis → good plan in prompt

**Warning signs:** User rejects most recommendations, generic "this component could be useful" rationale, all confidence scores near 0.5

### Pitfall 4: Non-Deterministic Failures

**What goes wrong:** Plan generation works sometimes but fails inconsistently with same input

**Why it happens:** LLM output variability, network issues, API rate limits

**How to avoid:**

- Use temperature=0 for more deterministic output (if API supports it)
- Implement retry with exponential backoff for transient failures
- Log full prompt + response for debugging failures
- Set reasonable timeout (30-60s) to catch hung requests

**Warning signs:** Flaky tests, intermittent parse errors, user reports "sometimes works"

### Pitfall 5: Ignoring Existing Architecture

**What goes wrong:** Model recommends patterns inconsistent with project's existing code style or architecture

**Why it happens:** Prompt doesn't convey enough architectural context, model defaults to generic recommendations

**How to avoid:**

- Include architectural signals in prompt: existing provider nesting, component patterns, naming conventions
- Show example component/tool in prompt to establish patterns
- Let model infer conventions from existing code rather than assuming
- Validate recommendations against detected patterns (e.g., don't nest provider deeper than existing ones)

**Warning signs:** Recommendations feel "off" to user, conflict with existing patterns, require significant refactoring

## Code Examples

Verified patterns from official sources:

### Streaming Response with Progress Updates

```typescript
// Source: Context7 Anthropic SDK (streaming pattern)
import { createTamboClient, executeRun } from "@tambo-ai/client-core";

async function generatePlanWithProgress(
  analysis: ProjectAnalysis,
  apiKey: string,
  onProgress?: (chunk: string) => void,
): Promise<InstallationPlan> {
  const client = createTamboClient({ apiKey });
  const thread = await client.threads.create({ title: "Plan Generation" });

  const prompt = buildPlanPrompt(analysis);

  let accumulatedText = "";
  const responseText = await executeRun(client, thread.id, prompt, {
    onEvent: (event) => {
      // Type-safe event handling from client-core patterns
      if (event.type === "TEXT_MESSAGE_CONTENT") {
        const data = event as unknown as { delta?: string };
        const chunk = data.delta ?? "";
        accumulatedText += chunk;
        onProgress?.(chunk);
      }
    },
  });

  // Parse accumulated response
  const json = extractJsonFromResponse(responseText);
  return installationPlanSchema.parse(json);
}
```

### Robust JSON Extraction

````typescript
// Source: Established patterns for LLM output parsing
function extractJsonFromResponse(text: string): unknown {
  // Remove common text wrappers
  const cleaned = text.trim();

  // Pattern 1: Markdown JSON block
  const mdBlockMatch = cleaned.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  if (mdBlockMatch) {
    try {
      return JSON.parse(mdBlockMatch[1]);
    } catch {
      // Fall through to next pattern
    }
  }

  // Pattern 2: JSON object/array anywhere in text
  const jsonObjectMatch = cleaned.match(/(\{[\s\S]*\})/);
  if (jsonObjectMatch) {
    try {
      return JSON.parse(jsonObjectMatch[1]);
    } catch {
      // Fall through to next pattern
    }
  }

  const jsonArrayMatch = cleaned.match(/(\[[\s\S]*\])/);
  if (jsonArrayMatch) {
    try {
      return JSON.parse(jsonArrayMatch[1]);
    } catch {
      // Fall through to next pattern
    }
  }

  // Pattern 3: Entire response is JSON
  return JSON.parse(cleaned);
}
````

### Error Handling with Retry

```typescript
// Source: Context7 Anthropic SDK error handling patterns
import Anthropic from "@anthropic-ai/sdk";

async function generatePlanWithRetry(
  analysis: ProjectAnalysis,
  apiKey: string,
  maxRetries = 3,
): Promise<InstallationPlan> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generatePlan(analysis, apiKey);
    } catch (error) {
      lastError = error as Error;

      // Handle specific error types from Anthropic SDK
      if (error instanceof Anthropic.RateLimitError) {
        // Exponential backoff for rate limits
        const delayMs = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      if (error instanceof Anthropic.APIConnectionError) {
        // Retry connection errors
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      // Don't retry validation errors or auth errors
      if (
        error instanceof Anthropic.AuthenticationError ||
        error instanceof z.ZodError
      ) {
        throw error;
      }

      // Last attempt or unrecoverable error
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }

  throw lastError ?? new Error("Plan generation failed after retries");
}
```

## State of the Art

| Old Approach                    | Current Approach                            | When Changed                     | Impact                                                           |
| ------------------------------- | ------------------------------------------- | -------------------------------- | ---------------------------------------------------------------- |
| Manual template generation      | LLM-powered analysis with rationale         | 2024-2025 (Claude 3+)            | Plans adapt to codebase context rather than rigid templates      |
| Post-generation validation only | Structured output with schemas              | 2024-2025 (JSON mode)            | Catch schema mismatches early, reduce parse errors               |
| Batch-only processing           | Streaming with progressive feedback         | 2023-2024 (SSE adoption)         | Better UX with real-time progress, can cancel long operations    |
| Generic confidence scores       | Signal-based confidence with explainability | 2025-2026 (reasoning models)     | Users understand why recommendations are made, trust scores more |
| Template-based CLI tools        | AI agent-based plan generation              | 2024-2026 (Cursor, Cline, Aider) | Context-aware recommendations vs one-size-fits-all scaffolding   |

**Deprecated/outdated:**

- Completion APIs without structured output: Use chat/messages API with JSON schema validation
- Hard-coded recommendation rules: Let model infer patterns from codebase analysis
- Synchronous plan generation: Use streaming for better UX and progress indication

## Open Questions

1. **Confidence Score Calibration**
   - What we know: Model can provide scores, but may not be well-calibrated to user expectations
   - What's unclear: Optimal threshold for "high confidence" (0.7? 0.8?), how to validate accuracy
   - Recommendation: Start with model's raw scores, gather user feedback in Phase 4 to calibrate thresholds

2. **Token Budget Management**
   - What we know: Large codebases may exceed context limits, need summarization
   - What's unclear: Best summarization strategy (top N by what metric?), how much context is "enough"
   - Recommendation: Implement tiered approach: full context if <50K tokens, else summarize to top 20 items per category

3. **Multi-Turn Refinement**
   - What we know: Single-turn is simpler, multi-turn allows clarification questions
   - What's unclear: Is single-turn sufficient for v1? When do we need clarification?
   - Recommendation: Start with single-turn; add multi-turn in v2 if users request more nuanced recommendations

4. **Model Selection**
   - What we know: Tambo API abstracts model choice, likely using Claude Opus 4+
   - What's unclear: Model capabilities for structured output, reasoning quality
   - Recommendation: Trust Tambo API's model selection; focus on prompt quality over model tuning

5. **Prompt Version Management**
   - What we know: Prompts will evolve based on user feedback and model improvements
   - What's unclear: How to version prompts, track which version generated each plan
   - Recommendation: Include prompt version in plan metadata, log for debugging

## Sources

### Primary (HIGH confidence)

- [Context7: Anthropic SDK TypeScript](https://context7.com/anthropics/anthropic-sdk-typescript/llms.txt) - Streaming, error handling, tool use patterns
- [Context7: Zod](https://context7.com/colinhacks/zod/llms.txt) - Schema validation, refinements, discriminated unions
- [Anthropic SDK GitHub](https://github.com/anthropics/anthropic-sdk-typescript) - Official SDK documentation and helpers
- [Zod GitHub](https://github.com/colinhacks/zod) - Schema definition patterns and validation

### Secondary (MEDIUM confidence)

- [Prompt Engineering Best Practices - Claude](https://claude.com/blog/best-practices-for-prompt-engineering) - General prompt engineering guidance
- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices) - Agentic coding patterns, plan mode concepts
- [Structured Output Generation in LLMs](https://medium.com/@emrekaratas-ai/structured-output-generation-in-llms-json-schema-and-grammar-based-decoding-6a5c58b698a6) - JSON Schema validation approaches
- [LLM Coding Workflow 2026 - Addy Osmani](https://addyosmani.com/blog/ai-coding-workflow/) - Planning and specification first approach

### Tertiary (LOW confidence)

- [Claude Code Prompt Engineering](https://promptbuilder.cc/blog/claude-prompt-engineering-best-practices-2026) - General tips, not specific to this use case
- [Plan Mode Feature](https://deepwiki.com/FlorianBruniaux/claude-code-ultimate-guide/3.4-plan-mode) - Read-only analysis mode concept

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - Using client-core (Phase 1) and zod (existing), both well-tested
- Architecture: HIGH - Single-turn generation with Zod validation is proven pattern
- Prompt engineering: MEDIUM - Requires iteration based on actual model responses
- Output quality: MEDIUM - Depends on prompt quality and model capabilities, needs validation in UAT

**Research date:** 2026-02-12
**Valid until:** 2026-03-12 (30 days - stable domain, established patterns)

**Key risks:**

1. Prompt iteration required - Initial prompt may need refinement based on model responses
2. Token limits - Large codebases may require summarization strategy
3. Output quality variability - LLM responses may need validation and retry logic

**Dependencies:**

- Phase 1 (client-core) must be complete: `createTamboClient`, `executeRun`, streaming
- Phase 2 (codebase analysis) must be complete: `analyzeProject()`, `ProjectAnalysis` type
- Tambo API must support streaming text responses (not just tool calling)
