---
name: building-with-tambo
description: Integrates Tambo into existing React apps — detects tech stack, installs @tambo-ai/react, wires TamboProvider, registers components with Zod schemas, and sets up tools/context. Use when adding AI-powered generative UI to an existing codebase. Triggers on "add Tambo", "integrate Tambo", "add AI chat to my app", "add generative UI", or when the user has an existing React/Next.js/Vite project and wants to add AI-powered components. For brand-new projects, use generative-ui instead.
---

# Building with Tambo

Detect tech stack and integrate Tambo while preserving existing patterns.

## Reference Guides

Load these when you reach the relevant step or need deeper implementation details:

- [Components](references/components.md) - **Load at Step 5.** Generative vs interactable components, propsSchema, ComponentRenderer.
- [Component Rendering](references/component-rendering.md) - Streaming props, loading states, persistent state. Load when building custom message rendering.
- [Threads and Input](references/threads.md) - **Load when building custom chat UI.** useTambo(), useTamboThreadInput(), userKey/userToken auth, suggestions, voice.
- [Tools and Context](references/tools-and-context.md) - **Load when wiring host app APIs.** defineTool(), MCP servers, contextHelpers.
- [CLI Reference](references/cli.md) - **Load at Step 6.** `tambo add` component library, `tambo init` flags, non-interactive mode.
- [Add Components to Registry](references/add-components-to-registry.md) - **Load when registering existing app components.** Analyzes props, generates Zod schemas, writes descriptions.

Shared references (components, rendering, threads, tools/context, CLI) are duplicated into generative-ui so each skill works independently. `add-components-to-registry` is unique to this skill.

## Workflow

1. **Detect tech stack** - Analyze package.json, lock files, project structure, monorepo layout
2. **Confirm with user** - Present findings, ask about preferences
3. **Install dependencies** - Add @tambo-ai/react and zod using the project's package manager
4. **Create provider setup** - Wire TamboProvider with apiKey, userKey, components
5. **Create component registry** - Set up lib/tambo.ts
6. **Add chat UI** - Install pre-built Tambo components via CLI, set up path aliases and globals.css

## Step 1: Detect Tech Stack

Check these files to understand the project:

```bash
# Key files to read
package.json           # Dependencies, scripts, AND package manager
tsconfig.json          # TypeScript config, path aliases
next.config.*          # Next.js
vite.config.*          # Vite
tailwind.config.*      # Tailwind CSS
postcss.config.*       # PostCSS
src/index.* or app/    # Entry points
yarn.lock / pnpm-lock.yaml / package-lock.json  # Which package manager
```

### Detection Checklist

| Technology       | Detection                                         |
| ---------------- | ------------------------------------------------- |
| Next.js          | `next` in dependencies, `next.config.*` exists    |
| Vite             | `vite` in devDependencies, `vite.config.*` exists |
| Create React App | `react-scripts` in dependencies                   |
| TypeScript       | `typescript` in deps, `tsconfig.json` exists      |
| Tailwind         | `tailwindcss` in deps, config file exists         |
| Plain CSS        | No Tailwind, CSS files in src/                    |
| Zod              | `zod` in dependencies                             |
| Other validation | `yup`, `joi`, `superstruct` in deps               |

### Package Manager Detection

**Always detect and use the project's package manager.** Do not assume npm.

| Lock file           | Manager | Install command               |
| ------------------- | ------- | ----------------------------- |
| `package-lock.json` | npm     | `npm install @tambo-ai/react` |
| `yarn.lock`         | Yarn    | `yarn add @tambo-ai/react`    |
| `pnpm-lock.yaml`    | pnpm    | `pnpm add @tambo-ai/react`    |

For **monorepos**, install in the correct workspace:

- Yarn: `yarn workspace <app-name> add @tambo-ai/react`
- pnpm: `pnpm --filter <app-name> add @tambo-ai/react`
- npm: `npm install @tambo-ai/react -w <app-name>`

### Monorepo Detection

Check for monorepo indicators:

- `workspaces` field in root `package.json`
- `pnpm-workspace.yaml`
- `turbo.json` or `nx.json`
- Multiple `package.json` files in `apps/` or `packages/`

If monorepo detected, identify which package is the web app that will use Tambo (usually in `apps/web`, `apps/frontend`, or similar).

### Global Keyboard Shortcuts Detection

Check if the app captures keyboard events globally (common in drawing tools, editors, IDEs). Look for:

- `document.addEventListener("keydown", ...)` in the codebase
- Canvas-based apps (Excalidraw, Figma-like, code editors)
- Keyboard shortcut libraries (hotkeys-js, mousetrap, etc.)

If found, the Tambo chat UI wrapper must stop event propagation (see Step 6).

## Step 2: Confirm with User

Present findings including the package manager and any special concerns:

```
I detected your project uses:
- Framework: Next.js 14 (App Router)
- Package manager: Yarn
- Styling: Tailwind CSS
- Validation: No Zod (will need to add)
- TypeScript: Yes
- Monorepo: No
- Global keyboard shortcuts: No

Should I:
1. Install Tambo with these settings?
2. Use plain CSS instead of Tailwind for Tambo components?
3. Something else?
```

## Step 3: Install Dependencies

Use the project's package manager (detected in Step 1):

```bash
# npm
npm install @tambo-ai/react
npm install zod  # if no Zod installed

# yarn
yarn add @tambo-ai/react
yarn add zod

# pnpm
pnpm add @tambo-ai/react
pnpm add zod

# Monorepo (install in the correct workspace)
yarn workspace <app-name> add @tambo-ai/react zod
pnpm --filter <app-name> add @tambo-ai/react zod
npm install @tambo-ai/react zod -w <app-name>
```

## Step 4: Create Provider Setup

### Next.js App Router

```tsx
// app/providers.tsx
"use client";
import { TamboProvider } from "@tambo-ai/react";
import { components } from "@/lib/tambo";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY}
      userKey="default-user"
      components={components}
    >
      {children}
    </TamboProvider>
  );
}
```

**IMPORTANT:** `userKey` is required for authentication. Without it, message submission fails at runtime with "authentication is not ready." Note: `userKey` is typed as optional in TypeScript (`userKey?: string`), so the compiler won't catch this — the failure is purely at runtime. In production, use a real user identifier (e.g., session ID, user ID from your auth system). For development/demo, a static string such as `"default-user"` works.

```tsx
// app/layout.tsx
import { Providers } from "./providers";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Next.js Pages Router

```tsx
// pages/_app.tsx
import { TamboProvider } from "@tambo-ai/react";
import { components } from "@/lib/tambo";

export default function App({ Component, pageProps }) {
  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY}
      userKey="default-user"
      components={components}
    >
      <Component {...pageProps} />
    </TamboProvider>
  );
}
```

### Vite / CRA

```tsx
// src/main.tsx
import { TamboProvider } from "@tambo-ai/react";
import { components } from "./lib/tambo";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <TamboProvider
    apiKey={import.meta.env.VITE_TAMBO_API_KEY}
    userKey="default-user"
    components={components}
  >
    <App />
  </TamboProvider>,
);
```

## Step 5: Create Component Registry

```tsx
// lib/tambo.ts (or src/lib/tambo.ts)
import { TamboComponent } from "@tambo-ai/react";

export const components: TamboComponent[] = [
  // Components will be registered here
];
```

## Step 6: Add Chat UI

Use Tambo's pre-built components for the chat interface:

```bash
npx tambo add message-thread-collapsible --yes
# Or with other package managers:
# yarn dlx tambo add message-thread-collapsible --yes
# pnpm dlx tambo add message-thread-collapsible --yes
```

This installs a collapsible chat panel with message display, input, suggestions, and streaming support. The component renders as a fixed-position panel in the bottom-right corner.

### After `tambo add`, complete the setup:

1. **CSS setup** — `tambo add` adds Tailwind directives and CSS variables to your project's CSS entry file. The file it modifies depends on the framework:
   - **Next.js**: `app/globals.css` (or `src/app/globals.css`) — already imported in layout by default.
   - **Vite**: `src/index.css` (or `index.css`) — already imported in `main.tsx` by default.

   If your entry file already imports a CSS file, `tambo add` modifies that file in place. No new import is needed.

2. **Path alias** — Tambo components use `@/` imports. Check if the project's tsconfig already has `@/*` in its `paths`. Many Next.js projects created with `create-next-app` have this, but not all (e.g., Cal.com uses `~/*` and `@components/*` instead).

   If `@/*` is missing, add it to the app tsconfig (`tsconfig.app.json` when present, otherwise `tsconfig.json`):

   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```

   If the project has no `src/` directory and components land in the project root, use `["./*"]` instead of `["./src/*"]`. Check where `tambo add` placed the components to determine the correct path.

   For **Vite projects**, also add the alias to `vite.config.ts`:

   ```ts
   // vite.config.ts
   import path from "path";

   export default defineConfig({
     resolve: {
       alias: {
         "@": path.resolve(__dirname, "src"),
       },
     },
   });
   ```

### Keyboard Event Isolation

**Critical for apps with global keyboard shortcuts** (drawing tools, editors, terminal-like apps). Without this, typing in the Tambo chat input triggers the host app's shortcuts.

Wrap the Tambo chat UI in a div that stops keyboard event propagation:

```tsx
<div
  onKeyDown={(e) => e.stopPropagation()}
  onKeyUp={(e) => e.stopPropagation()}
>
  <MessageThreadCollapsible />
</div>
```

### Z-Index for Full-Screen Apps

Apps with full-screen canvases or overlays may render on top of the Tambo chat. The `MessageThreadCollapsible` component uses `position: fixed`, but the host app's canvas may have a higher stacking context. Wrap with a fixed container that sits above everything:

```tsx
<div
  style={{ position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none" }}
>
  <div style={{ pointerEvents: "auto" }}>
    <MessageThreadCollapsible />
  </div>
</div>
```

The outer div creates a stacking context above the canvas, while `pointerEvents: none/auto` ensures only the chat panel is clickable — the rest of the screen passes clicks through to the canvas.

You can combine keyboard isolation and z-index in one wrapper.

## Adapting to Existing Patterns

### No Tailwind? Use Plain CSS

If the project doesn't use Tailwind, `tambo add` will install Tailwind v4 via PostCSS alongside the existing styling. This is additive — it won't break existing CSS/SCSS. The Tambo components use Tailwind, but the rest of your app keeps its styling.

If you'd prefer to avoid Tailwind entirely:

```bash
# Skip --yes flag to customize styling during add
npx tambo add message-thread-full
# Select "CSS Modules" or "Plain CSS" when prompted
```

### Existing Validation Library?

If using Yup/Joi instead of Zod, user can either:

1. Add Zod just for Tambo schemas (recommended - small addition)
2. Convert schemas (more work, not recommended)

### Monorepo?

Run commands from the web app package, not the monorepo root:

```bash
cd apps/web  # or wherever the web app lives
npx tambo init --api-key=sk_...
```

**Monorepo gotchas:**

- **Env vars**: `tambo init` creates `.env.local` in the current directory. Vite loads env from `envDir` (check `vite.config.*`). Ensure the env file is where Vite looks for it.
- **Dependency hoisting**: Some package managers hoist deps to the monorepo root. If Vite can't resolve a Tambo dependency, install it at the root level too (e.g., `yarn add -W @tambo-ai/react`).
- **Path aliases**: Vite resolves from the `vite.config.*` directory. The `@/` alias must resolve to the correct `src/` directory within the workspace, not the monorepo root.

## Environment Variables

`npx tambo init --api-key=sk_...` automatically creates `.env.local` with the correct env var for your framework.

If manual setup is needed (monorepo, read-only filesystem), add the appropriate variable:

| Framework | Variable                    |
| --------- | --------------------------- |
| Next.js   | `NEXT_PUBLIC_TAMBO_API_KEY` |
| Vite      | `VITE_TAMBO_API_KEY`        |
| CRA       | `REACT_APP_TAMBO_API_KEY`   |

## Verification

After setup, verify by creating a simple test:

```tsx
import { useTambo } from "@tambo-ai/react";

function TestComponent() {
  const { thread, isIdle } = useTambo();
  console.log("Tambo connected:", isIdle);
  return <div>Tambo is set up!</div>;
}
```

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
