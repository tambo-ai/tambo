---
name: generative-ui
description: Creates a new Tambo generative UI app from scratch. Scaffolds with tambo create-app, wires TamboProvider, registers starter components. Triggers on "new Tambo app", "create a generative UI app", "build an AI app from scratch", "start a new project with Tambo". For existing apps, use building-with-tambo.
---

# Generative UI

Build generative UI apps with Tambo — create rich, interactive React components from natural language.

## Reference Guides

Load these when you need deeper implementation details beyond the bootstrap flow:

- [Components](references/components.md) - **Load when creating custom components.** Generative vs interactable, propsSchema, ComponentRenderer.
- [Component Rendering](references/component-rendering.md) - Streaming props, loading states, persistent state. Load when customizing rendering.
- [Threads and Input](references/threads.md) - **Load when building custom chat UI.** useTambo(), useTamboThreadInput(), userKey/userToken auth, suggestions, voice.
- [Tools and Context](references/tools-and-context.md) - **Load when adding tools or MCP.** defineTool(), MCP servers, contextHelpers.
- [CLI Reference](references/cli.md) - **Load for `tambo add` components.** Component library, non-interactive flags, exit codes.

These shared references are duplicated from building-with-tambo so each skill works independently.

## One-Prompt Flow

The goal is to get the user from zero to a running app in a single prompt. Ask all questions upfront using AskUserQuestion with multiple questions, then execute everything without stopping.

### Step 1: Gather All Non-Sensitive Preferences (Single AskUserQuestion Call)

Use AskUserQuestion with up to 3 questions in ONE call. Authentication is handled by the CLI in a later step.

**Question 1: What do you want to build?**

Ask the user what kind of app they're building. This drives which starter components to create. Examples: "a dashboard", "a chatbot", "a data visualization tool", "a task manager". If the user already said what they want in their initial message, skip this question.

**Question 2: Framework**

Options:

- Next.js (Recommended) - Full-stack React with App Router
- Vite - Fast, lightweight React setup

**Question 3: App name**

Let the user pick a name for their project directory. Default suggestion: derive from what they want to build (e.g., "my-dashboard", "my-chatbot"). Use kebab-case (letters, numbers, hyphens only). If the user gives a non-slug name like "Sales Dashboard", propose `sales-dashboard` instead.

**Skip questions when the user already told you the answer.** If they said "build me a Next.js dashboard app called analytics", you already know the framework, the app idea, and the name.

### Step 2: Execute Everything (No Stopping)

Run all of these sequentially without asking for confirmation between steps. If any command fails, stop the flow, surface the error, and ask the user how to proceed — do not continue to later steps.

All templates (`standard`, `vite`, `analytics`, `expo`) come with chat UI, TamboProvider wiring, component registry, and starter components already included. You do NOT need to add chat UI or wire up the app — just scaffold, configure the API key, add custom components, and start the server.

#### 2a. Scaffold the project

For Next.js (recommended):

```bash
npx tambo create-app <app-name> --template=standard --skip-tambo-init
cd <app-name>
```

For Vite:

```bash
npx tambo create-app <app-name> --template=vite --skip-tambo-init
cd <app-name>
```

Use `--skip-tambo-init` since `create-app` normally tries to run `tambo init` interactively, which won't work in non-interactive environments like coding agents. We handle authentication in the next step.

#### 2b. Authenticate and initialize Tambo

```bash
npx tambo init --project-name=<app-name> --no-browser
```

This prints an auth URL and device code. Tell the user to click the URL and authenticate. The CLI spawns a background poller that saves the token when the user completes auth.

After the user authenticates, re-run the same command:

```bash
npx tambo init --project-name=<app-name>
```

This time it picks up the saved token, creates the project, and writes the API key to `.env.local` with the correct env var for the framework (`NEXT_PUBLIC_TAMBO_API_KEY`, `VITE_TAMBO_API_KEY`, etc.).

**IMPORTANT:** Do NOT ask the user to paste an API key manually. Always use the CLI auth flow.

#### 2c. Create custom starter components

The template includes basic components, but add 1-2 components tailored to what the user wants to build. Don't use generic examples:

- **Dashboard app** → `StatsCard`, `DataTable`
- **Chatbot** → `BotResponse` with markdown support
- **Data visualization** → `Chart` with configurable data
- **Task manager** → `TaskCard`, `TaskBoard`
- **Generic / unclear** → `ContentCard`

Each component needs:

1. A Zod schema with `.describe()` on every field
2. The React component itself
3. Registration in the existing component registry (`lib/tambo.ts` — add to the existing `components` array, don't replace it)

**Schema constraints — Tambo will reject invalid schemas at runtime:**

- **No `z.record()`** — Record types (objects with dynamic keys) are not supported anywhere in the schema, including nested inside arrays or objects. Use `z.object()` with explicit named keys instead.
- **No `z.map()` or `z.set()`** — Use arrays and objects instead.
- For tabular data like rows, use `z.array(z.object({ col1: z.string(), col2: z.number() }))` with explicit column keys — NOT `z.array(z.record(z.string(), z.unknown()))`.

**React best practices for generated components:**

- Always add unique `key` props when rendering lists (`.map()`). Use a unique field from the data (like `id`) — not the array index.
- Include an `id` field (e.g., `z.string().describe("Unique identifier")`) in schemas for array items so there's always a stable key available.

Example:

```tsx
// src/components/StatsCard.tsx
import { z } from "zod/v4";

export const StatsCardSchema = z.object({
  title: z.string().describe("Metric name"),
  value: z.number().describe("Current value"),
  change: z.number().optional().describe("Percent change from previous period"),
  trend: z.enum(["up", "down", "flat"]).optional().describe("Trend direction"),
});

type StatsCardProps = z.infer<typeof StatsCardSchema>;

export function StatsCard({
  title,
  value,
  change,
  trend = "flat",
}: StatsCardProps) {
  // ... implementation with Tailwind styling
}
```

Then add to the existing registry in `lib/tambo.ts`:

```tsx
// Add to the existing components array — don't replace what's already there
// Next.js: import { StatsCard, StatsCardSchema } from "@/components/StatsCard";
// Vite: import { StatsCard, StatsCardSchema } from "../components/StatsCard";
import { StatsCard, StatsCardSchema } from "@/components/StatsCard";

// ... existing components ...
{
  name: "StatsCard",
  component: StatsCard,
  description: "Displays a metric with value and trend. Use when user asks about stats, metrics, or KPIs.",
  propsSchema: StatsCardSchema,
},
```

#### 2d. Start the dev server

Only start the dev server after all code changes (scaffolding, init, component creation, registry updates) are complete.

```bash
npm run dev
```

Run this in the background so the user can see their app immediately.

### Step 3: Summary

After everything is running, give a brief summary:

- What was set up
- What components were created and what they do
- The URL where the app is running (typically `http://localhost:3000` for Next.js, `http://localhost:5173` for Vite)
- If auth was skipped: remind them once to run `npx tambo init` to authenticate
- A suggestion for what to try first (e.g., "Try asking it to show you a stats card for monthly revenue")

## Technology Stacks Reference

### Recommended Stack (Default)

```
Next.js 14+ (App Router)
├── TypeScript
├── Tailwind CSS
├── Zod (for schemas)
└── @tambo-ai/react
```

```bash
npx tambo create-app my-app --template=standard
```

### Vite Stack

```
Vite + React
├── TypeScript
├── Tailwind CSS
├── Zod
└── @tambo-ai/react
```

### Minimal Stack (No Tailwind)

```
Vite + React
├── TypeScript
├── Plain CSS
├── Zod
└── @tambo-ai/react
```

## Component Registry Pattern

Every generative component must be registered:

```tsx
import { TamboComponent } from "@tambo-ai/react";
import { ComponentName, ComponentNameSchema } from "@/components/ComponentName";

export const components: TamboComponent[] = [
  {
    name: "ComponentName",
    component: ComponentName,
    description: "What it does. When to use it.",
    propsSchema: ComponentNameSchema,
  },
];
```

Key rules:

- **propsSchema**: Zod object with `.describe()` on every field — this is how the AI knows what to pass
- **description**: Tell the AI when to use this component — be specific about trigger phrases
- **Streaming**: Props arrive incrementally, so handle undefined gracefully (optional fields or defaults)

## Adding More Chat UI (Optional)

Templates already include chat UI. These are only needed if the user wants additional UI primitives beyond what the template provides:

```bash
npx tambo add message-thread-full --yes    # Complete chat interface
npx tambo add control-bar --yes            # Controls and actions
npx tambo add canvas-space --yes           # Rendered component display area
npx tambo add thread-history --yes         # Conversation history sidebar
```

## Supported Technologies

| Technology       | Support Level | Notes                             |
| ---------------- | ------------- | --------------------------------- |
| Next.js 14+      | Full          | Recommended, App Router preferred |
| Vite             | Full          | Great for SPAs                    |
| Create React App | Partial       | Works but CRA is deprecated       |
| Remix            | Partial       | Works with client components      |
| TypeScript       | Full          | Strongly recommended              |
| JavaScript       | Full          | Works but less type safety        |
| Tailwind CSS     | Full          | Default for CLI components        |
| Plain CSS        | Full          | Need custom component styling     |
| CSS Modules      | Full          | Supported                         |
| Zod              | Required      | Used for all schemas              |

## Verification

Have the user verify the app works by:

1. Opening the app URL in a browser
2. Typing a prompt that should trigger one of the registered components (e.g., "Show me a stats card for monthly revenue")
3. Verifying the component renders with AI-generated props

If something doesn't work:

- Check the registry includes the component
- Check the description matches the prompt
- Check the dev server has no console errors

## Reporting Bugs & Feedback

If you encounter any of these while helping a user, suggest filing a GitHub issue:

- A bug in `@tambo-ai/react`, `@tambo-ai/client`, or the `tambo` CLI
- Documentation that contradicts actual behavior
- Missing or misleading instructions in this skill

### Issue Template

Use this template when drafting an issue for `tambo-ai/tambo`:

````markdown
**Title:** [Short description of the problem]

**Expected behavior**
What should happen.

**Actual behavior**
What happens instead, including any error messages or stack traces.

**Repro steps**

1. Run `npx tambo create-app ...` (or whatever command)
2. Add this code:

```tsx
// minimal code that reproduces the issue
```

3. Observe the error

**Environment**

- `@tambo-ai/react` version:
- `@tambo-ai/client` version:
- Framework (Next.js / Vite / CRA) and version:
- Node.js version:
- OS:

**Additional context**
Link to relevant docs or skill file path if applicable.
````

**Security:** Redact API keys, tokens, and any customer data before including logs or code snippets in the issue.

### Suggesting an Issue to the User

When you hit a problem that looks like a Tambo bug, say something like:

> This looks like a bug in `@tambo-ai/react`. Want me to open a GitHub issue on `tambo-ai/tambo` with the repro steps and environment details?

Always wait for the user to confirm before filing.
