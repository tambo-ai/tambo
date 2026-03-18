# Plan: Add Tambo AI Chat to Yarn Monorepo (apps/web)

## Step 1: Detect Tech Stack

Read the following files to confirm the project setup:

```bash
cat package.json            # Check "workspaces": ["apps/*", "packages/*"]
cat yarn.lock | head -5     # Confirm Yarn 1.x
cat apps/web/package.json   # Check "next" in dependencies, app name
cat apps/web/next.config.js # Confirm Next.js
cat apps/web/tsconfig.json  # Check path aliases (@/ config)
ls apps/web/app/            # Confirm App Router (layout.tsx exists)
cat turbo.json              # Confirm Turborepo
```

**Detection results:**

| Technology       | Result                                                          |
| ---------------- | --------------------------------------------------------------- |
| Framework        | Next.js (App Router) -- `next` in deps, `app/layout.tsx` exists |
| Package manager  | Yarn 1.x -- `yarn.lock` present                                 |
| Monorepo         | Yes -- `workspaces` field in root `package.json`, `turbo.json`  |
| Styling          | No Tailwind -- no `tailwindcss` in deps, no config file         |
| Validation       | No Zod -- not in `apps/web/package.json`                        |
| TypeScript       | Yes (assumed from `.tsx` files)                                 |
| Global shortcuts | No (not indicated)                                              |

Also check the `name` field in `apps/web/package.json` to get the workspace name for Yarn commands. Assume it is `"web"` (or `"@myorg/web"` -- use whatever the actual name field says).

## Step 2: Confirm with User

Present findings:

```
I detected your project uses:
- Framework: Next.js (App Router)
- Package manager: Yarn 1.x (workspaces)
- Monorepo: Yes (Yarn workspaces + Turborepo)
- Web app: apps/web
- Styling: No Tailwind (tambo add will install Tailwind v4 via PostCSS -- additive, won't break existing CSS)
- Validation: No Zod (will install alongside @tambo-ai/react)
- TypeScript: Yes
- Global keyboard shortcuts: None detected

I'll:
1. Install @tambo-ai/react and zod in the apps/web workspace
2. Create a TamboProvider and wire it into app/layout.tsx
3. Create a component registry at lib/tambo.ts
4. Add a pre-built collapsible chat UI via the tambo CLI

Sound good?
```

## Step 3: Install Dependencies

Use Yarn workspace commands to install in the correct package. The workspace name comes from `apps/web/package.json`'s `name` field (assumed `"web"` below -- adjust to actual name):

```bash
yarn workspace web add @tambo-ai/react zod
```

If dependency hoisting causes resolution issues (Yarn 1.x hoists by default, so this is unlikely but possible), also install at the root:

```bash
yarn add -W @tambo-ai/react zod
```

## Step 4: Create Provider Setup

### Create `apps/web/app/providers.tsx`:

```tsx
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

### Update `apps/web/app/layout.tsx`:

Read the existing `apps/web/app/layout.tsx` first to preserve its current structure (imports, metadata, fonts, etc.). Then wrap the `{children}` inside the body with `<Providers>`:

```tsx
// Add this import at the top:
import { Providers } from "./providers";

// Then wrap children in the body:
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

Preserve any existing attributes on `<html>` and `<body>`, existing className, fonts, metadata exports, etc. Only add the `Providers` wrapper and its import.

## Step 5: Create Component Registry

### Create `apps/web/lib/tambo.ts`:

```tsx
import { TamboComponent } from "@tambo-ai/react";

export const components: TamboComponent[] = [
  // Components will be registered here
];
```

Verify that `@/lib/tambo` resolves correctly by checking `apps/web/tsconfig.json` has a path alias for `@/*` pointing to the right directory. Next.js App Router projects typically have this configured already. If not, add:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

## Step 6: Add Chat UI

Run `tambo add` from inside the web app directory so files land in the right place:

```bash
cd apps/web
npx tambo add message-thread-collapsible --yes
```

### Post `tambo add` setup:

1. **Tailwind / globals.css**: Since the project has no Tailwind, `tambo add` will install Tailwind v4 via PostCSS alongside existing styling. This is additive and won't break existing CSS/SCSS. Verify that the generated `globals.css` is imported in `apps/web/app/layout.tsx`. If `tambo add` created it at `apps/web/app/globals.css` (or `apps/web/src/app/globals.css`), confirm the import exists:

   ```tsx
   // In apps/web/app/layout.tsx
   import "./globals.css";
   ```

   If the layout already imports a CSS file, ensure the Tambo `globals.css` content (Tailwind directives and CSS variables) is either merged into the existing CSS file or imported separately.

2. **Path alias**: Next.js projects already have `@/` configured by default -- no action needed.

3. **Add the chat component to a page**: Edit `apps/web/app/page.tsx` (or whichever page should have the chat) to include the collapsible chat panel:

   ```tsx
   import { MessageThreadCollapsible } from "@/components/tambo/message-thread-collapsible";

   export default function Page() {
     return (
       <div>
         {/* existing page content */}
         <MessageThreadCollapsible />
       </div>
     );
   }
   ```

## Step 7: Environment Variables

Create `apps/web/.env.local` with the Tambo API key:

```bash
# Run from apps/web:
npx tambo init --api-key=sk_your_api_key_here
```

Or manually create `apps/web/.env.local`:

```
NEXT_PUBLIC_TAMBO_API_KEY=sk_your_api_key_here
```

Make sure `.env.local` is in `.gitignore` (Next.js does this by default).

## Step 8: Verification

Start the dev server and verify:

```bash
# From monorepo root:
yarn workspace web dev
# Or if using turbo:
turbo dev --filter=web
```

Then open the app in the browser. The collapsible chat panel should appear in the bottom-right corner. Open the browser console and confirm there are no errors about missing API keys or authentication failures.

To programmatically verify the integration is wired correctly, temporarily add to any client component:

```tsx
import { useTambo } from "@tambo-ai/react";

function TestComponent() {
  const { thread, isIdle } = useTambo();
  console.log("Tambo connected:", isIdle);
  return <div>Tambo is set up!</div>;
}
```

## Summary of Files Created/Modified

| File                          | Action                                                                           |
| ----------------------------- | -------------------------------------------------------------------------------- |
| `apps/web/package.json`       | Modified (new deps: `@tambo-ai/react`, `zod`)                                    |
| `apps/web/app/providers.tsx`  | **Created** -- TamboProvider wrapper                                             |
| `apps/web/app/layout.tsx`     | **Modified** -- wrap children with `<Providers>`                                 |
| `apps/web/lib/tambo.ts`       | **Created** -- component registry                                                |
| `apps/web/app/globals.css`    | **Created/Modified** -- Tailwind v4 directives + CSS variables (via `tambo add`) |
| `apps/web/components/tambo/*` | **Created** -- pre-built chat UI components (via `tambo add`)                    |
| `apps/web/.env.local`         | **Created** -- `NEXT_PUBLIC_TAMBO_API_KEY`                                       |

## Monorepo-Specific Notes

- All dependency installs use `yarn workspace web add ...` (not bare `yarn add`).
- All file creation and CLI commands (`tambo add`, `tambo init`) run from `apps/web/`, not the monorepo root.
- Tailwind v4 installation is additive via PostCSS and will not interfere with existing styling in other workspaces or in the web app itself.
- If `next.config.js` uses `transpilePackages` for other workspace packages, no changes are needed for Tambo (it's an npm package, not a workspace package).
