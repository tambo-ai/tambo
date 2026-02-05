---
name: add-to-existing-project
description: Integrates Tambo into EXISTING React projects by detecting the tech stack and adapting installation. Use when adding Tambo to an existing app, integrating with current frameworks, or when the user has an existing codebase they want to add AI/generative UI to. For starting a NEW project from scratch, use start-from-scratch skill instead. For registering existing components, use add-components-to-registry skill.
---

# Add Tambo to Existing Project

Detect tech stack and integrate Tambo while preserving existing patterns.

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
import { useTamboThread } from "@tambo-ai/react";

function TestComponent() {
  const { thread } = useTamboThread();
  console.log("Tambo connected:", thread !== undefined);
  return <div>Tambo is set up!</div>;
}
```
