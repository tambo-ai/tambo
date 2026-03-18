# Plan: Adding Tambo to a Vite + React + TypeScript App (Plain CSS)

## Step 1: Detect Tech Stack

Read the following files to confirm the project setup:

- `package.json` -- dependencies, scripts, package manager
- `package-lock.json` -- confirms npm as the package manager
- `vite.config.ts` -- confirms Vite
- `tsconfig.json` -- TypeScript config, check for existing path aliases
- `src/main.tsx` -- entry point
- `src/App.tsx` -- main component

Check for monorepo indicators (workspaces field, turbo.json, nx.json) -- none expected.

Check for global keyboard shortcut patterns (`document.addEventListener("keydown", ...)`, hotkeys-js, mousetrap) -- none expected.

**Detection results:**

| Technology       | Result                  |
| ---------------- | ----------------------- |
| Framework        | Vite + React            |
| Package manager  | npm (package-lock.json) |
| Styling          | Plain CSS (no Tailwind) |
| Validation       | No Zod installed        |
| TypeScript       | Yes                     |
| Monorepo         | No                      |
| Global shortcuts | No                      |

## Step 2: Confirm with User

Present findings to the user:

```
I detected your project uses:
- Framework: Vite + React
- Package manager: npm
- Styling: Plain CSS (no Tailwind)
- Validation: No Zod (will need to add)
- TypeScript: Yes
- Monorepo: No
- Global keyboard shortcuts: No

I'll:
1. Install @tambo-ai/react and zod via npm
2. Wrap your app in TamboProvider in src/main.tsx
3. Create a component registry at src/lib/tambo.ts
4. Add a pre-built chat UI via `npx tambo add`

The `tambo add` command will install Tailwind v4 via PostCSS alongside your existing
plain CSS. This is additive -- it won't break your existing styles. Only the Tambo
chat components use Tailwind; the rest of your app keeps plain CSS.

Sound good?
```

## Step 3: Install Dependencies

Run these commands:

```bash
npm install @tambo-ai/react
npm install zod
```

Then initialize Tambo (which creates `.env.local` with the API key):

```bash
npx tambo init --api-key=sk_YOUR_API_KEY_HERE
```

This creates `.env.local` containing:

```
VITE_TAMBO_API_KEY=sk_YOUR_API_KEY_HERE
```

## Step 4: Create Provider Setup

Edit `src/main.tsx` to wrap the app in `TamboProvider`:

```tsx
// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { TamboProvider } from "@tambo-ai/react";
import { components } from "./lib/tambo";
import App from "./App";
import "./index.css"; // existing CSS import (keep as-is)

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TamboProvider
      apiKey={import.meta.env.VITE_TAMBO_API_KEY}
      userKey="default-user"
      components={components}
    >
      <App />
    </TamboProvider>
  </React.StrictMode>,
);
```

Key points:

- Uses `import.meta.env.VITE_TAMBO_API_KEY` (Vite's env variable convention).
- `userKey="default-user"` is required for authentication. In production, replace with a real user identifier from your auth system.
- Preserves the existing `<React.StrictMode>` wrapper and CSS import.

## Step 5: Create Component Registry

Create `src/lib/tambo.ts`:

```tsx
// src/lib/tambo.ts
import { TamboComponent } from "@tambo-ai/react";

export const components: TamboComponent[] = [
  // Components will be registered here.
  // Example:
  // {
  //   name: "WeatherCard",
  //   description: "Displays weather information for a given city",
  //   component: WeatherCard,
  //   propsSchema: weatherCardSchema,
  // },
];
```

This is where you register any components you want the AI to be able to render. Each component needs a Zod schema describing its props so the AI knows what data to provide.

## Step 6: Add Chat UI

Run the CLI command to install a pre-built collapsible chat panel:

```bash
npx tambo add message-thread-collapsible --yes
```

This installs a collapsible chat panel (fixed-position, bottom-right corner) with message display, input, suggestions, and streaming support.

Since there is no Tailwind in the project, `tambo add` will install Tailwind v4 via PostCSS alongside the existing plain CSS. This is additive and will not affect existing styles.

### Post-install setup:

#### 6a. Import globals.css

`tambo add` creates a `globals.css` with Tailwind directives and theme variables. Import it in `src/main.tsx`:

```tsx
// Add this import to src/main.tsx (near the top, alongside other CSS imports)
import "./app/globals.css";
```

#### 6b. Configure path alias for `@/` imports

Tambo components use `@/` imports. Add the alias to both Vite and TypeScript configs.

**vite.config.ts:**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
```

**tsconfig.json** (add to `compilerOptions`):

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

#### 6c. Add the chat component to App.tsx

```tsx
// src/App.tsx
import { MessageThreadCollapsible } from "./components/tambo/message-thread-collapsible";

function App() {
  return (
    <div>
      {/* Your existing app content */}
      <MessageThreadCollapsible />
    </div>
  );
}

export default App;
```

No keyboard event isolation wrapper is needed since the app has no global keyboard shortcuts.

## Verification

After completing all steps, start the dev server:

```bash
npm run dev
```

Verify that:

1. The app compiles without errors.
2. The collapsible chat panel appears in the bottom-right corner.
3. You can open the panel and type a message.
4. The console shows `Tambo connected: true` if you add a test component:

```tsx
import { useTambo } from "@tambo-ai/react";

function TestComponent() {
  const { thread, isIdle } = useTambo();
  console.log("Tambo connected:", isIdle);
  return <div>Tambo is set up!</div>;
}
```

## Summary of Files Changed/Created

| File               | Action   | Purpose                                       |
| ------------------ | -------- | --------------------------------------------- |
| `src/main.tsx`     | Modified | Wrap app in TamboProvider, import globals.css |
| `src/lib/tambo.ts` | Created  | Component registry (empty, ready to populate) |
| `src/App.tsx`      | Modified | Add MessageThreadCollapsible chat UI          |
| `vite.config.ts`   | Modified | Add `@/` path alias                           |
| `tsconfig.json`    | Modified | Add `@/*` path mapping                        |
| `.env.local`       | Created  | VITE_TAMBO_API_KEY (via `tambo init`)         |

## Next Steps

Once the basic setup is verified, you can:

1. **Register your own components** -- Add existing app components to `src/lib/tambo.ts` with Zod prop schemas so the AI can render them.
2. **Add tools and context** -- Use `defineTool()` to let the AI call your app's APIs, and `contextHelpers` to provide app state to the AI.
3. **Customize the chat UI** -- Modify the installed Tambo components or build a custom message thread.
