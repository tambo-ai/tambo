---
name: build-with-tambo
description: Build with Tambo in an existing React app. Use for existing codebases (providers, env vars, components, threads, tools). For brand-new apps, use generative-ui.
---

# Build with Tambo

Detect tech stack and integrate Tambo while preserving existing patterns.

## Reference Guides

Use these guides when you need deeper implementation details for a specific area:

- [Components](references/components.md) - Create and register Tambo components (generative and interactable).
- [Component Rendering](references/component-rendering.md) - Handle streaming props, loading states, and persistent component state.
- [Threads and Input](references/threads.md) - Manage conversations, suggestions, voice input, image attachments, and thread switching.
- [Tools and Context](references/tools-and-context.md) - Add custom tools, MCP servers, context helpers, and resources.
- [CLI Reference](references/cli.md) - Use `tambo init`, `tambo add`, and `create-app` with non-interactive flags and exit codes.
- [Add Components to Registry](references/add-components-to-registry.md) - Convert existing React components into Tambo-ready registrations with schemas and descriptions.

These references are duplicated across both skills so each skill works independently.

## Workflow

1. **Detect tech stack** - Analyze package.json and project structure
2. **Confirm with user** - Present findings, ask about preferences
3. **Install dependencies** - Add @tambo-ai/react and peer deps
4. **Create provider setup** - Adapt to existing patterns
5. **Register first component** - Demonstrate with existing component

## Step 1: Detect Tech Stack

Check these files to understand the project:

```bash
# Key files to read
package.json           # Dependencies and scripts
tsconfig.json          # TypeScript config
next.config.*          # Next.js
vite.config.*          # Vite
tailwind.config.*      # Tailwind CSS
postcss.config.*       # PostCSS
src/index.* or app/    # Entry points
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

## Step 2: Confirm with User

Present findings and ask:

```
I detected your project uses:
- Framework: Next.js 14 (App Router)
- Styling: Tailwind CSS
- Validation: No Zod (will need to add)
- TypeScript: Yes

Should I:
1. Install Tambo with these settings?
2. Use plain CSS instead of Tailwind for Tambo components?
3. Something else?
```

## Step 3: Install Dependencies

```bash
# Core (always required)
npm install @tambo-ai/react

# If no Zod installed
npm install zod
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
      components={components}
    >
      {children}
    </TamboProvider>
  );
}
```

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

## Adapting to Existing Patterns

### No Tailwind? Use Plain CSS

If project uses plain CSS or CSS modules, Tambo components can be styled differently:

```tsx
// Skip --yes flag to customize styling during add
npx tambo add message-thread-full
# Select "CSS Modules" or "Plain CSS" when prompted
```

### Existing Validation Library?

If using Yup/Joi instead of Zod, user can either:

1. Add Zod just for Tambo schemas (recommended - small addition)
2. Convert schemas (more work, not recommended)

### Monorepo?

Run commands from the package that will use Tambo:

```bash
cd packages/web
npx tambo init --api-key=sk_...
```

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
