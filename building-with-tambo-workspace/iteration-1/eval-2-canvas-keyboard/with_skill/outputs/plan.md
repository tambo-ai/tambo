# Plan: Add Tambo AI Chat Panel to Excalidraw-like Canvas App

## Step 1: Detect Tech Stack

Read the following files to confirm the setup:

- `package.json` -- dependencies, scripts, package manager
- `package-lock.json` -- confirms npm
- `vite.config.ts` -- Vite configuration, check for existing aliases
- `tsconfig.json` -- TypeScript config, check for path aliases
- `src/main.tsx` -- entry point structure

**Detection results (based on user description):**

| Technology                | Finding                                                |
| ------------------------- | ------------------------------------------------------ |
| Framework                 | Vite                                                   |
| Package manager           | npm (`package-lock.json`)                              |
| Styling                   | No Tailwind (plain CSS)                                |
| Validation                | No Zod                                                 |
| TypeScript                | Yes                                                    |
| Monorepo                  | No                                                     |
| Global keyboard shortcuts | **Yes** -- `document.addEventListener("keydown", ...)` |

Also search the codebase for keyboard shortcut patterns to understand scope:

```bash
grep -r "addEventListener.*keydown" src/
grep -r "addEventListener.*keyup" src/
grep -r "hotkeys\|mousetrap" package.json
```

## Step 2: Confirm with User

Present findings:

> I detected your project uses:
>
> - Framework: Vite + React
> - Package manager: npm
> - Styling: No Tailwind (will be installed additively by `tambo add` -- won't affect existing CSS)
> - Validation: No Zod (will install alongside Tambo)
> - TypeScript: Yes
> - Monorepo: No
> - Global keyboard shortcuts: **Yes** -- I'll wrap the Tambo chat panel so typing in it won't trigger your canvas shortcuts (R, T, etc.)
>
> Should I proceed with these settings?

## Step 3: Install Dependencies

Run:

```bash
npm install @tambo-ai/react
npm install zod
```

## Step 4: Create Provider Setup

Create the TamboProvider wrapper in `src/main.tsx`. Since this is a Vite app, use `import.meta.env.VITE_TAMBO_API_KEY` for the API key.

Also define tools that bridge Tambo to the app's imperative canvas API, and context helpers so Tambo knows what's currently on the canvas.

### Define tools for the canvas API

Create `src/lib/tambo-tools.ts`:

```tsx
import { defineTool } from "@tambo-ai/react";
import { z } from "zod";
// Import the app's imperative canvas API
import { canvasApi } from "../canvas-api"; // adjust path to wherever the imperative API lives

export const addRectangleTool = defineTool({
  name: "addRectangle",
  description:
    "Add a rectangle to the canvas at a given position with a given size and color",
  inputSchema: z.object({
    x: z.number().describe("X position of the top-left corner"),
    y: z.number().describe("Y position of the top-left corner"),
    width: z.number().describe("Width of the rectangle"),
    height: z.number().describe("Height of the rectangle"),
    fill: z.string().optional().describe("Fill color, e.g. '#ff0000' or 'red'"),
    stroke: z.string().optional().describe("Stroke/border color"),
  }),
  tool: async ({ x, y, width, height, fill, stroke }) => {
    const shape = canvasApi.addShape({
      type: "rectangle",
      x,
      y,
      width,
      height,
      fill: fill ?? "#3b82f6",
      stroke: stroke ?? "#000000",
    });
    return { id: shape.id, message: `Added rectangle at (${x}, ${y})` };
  },
});

export const addTextTool = defineTool({
  name: "addText",
  description: "Add a text element to the canvas",
  inputSchema: z.object({
    x: z.number().describe("X position"),
    y: z.number().describe("Y position"),
    text: z.string().describe("The text content"),
    fontSize: z.number().optional().describe("Font size in pixels"),
    color: z.string().optional().describe("Text color"),
  }),
  tool: async ({ x, y, text, fontSize, color }) => {
    const shape = canvasApi.addShape({
      type: "text",
      x,
      y,
      text,
      fontSize: fontSize ?? 16,
      color: color ?? "#000000",
    });
    return { id: shape.id, message: `Added text "${text}" at (${x}, ${y})` };
  },
});

export const addCircleTool = defineTool({
  name: "addCircle",
  description: "Add a circle/ellipse to the canvas",
  inputSchema: z.object({
    x: z.number().describe("Center X position"),
    y: z.number().describe("Center Y position"),
    radius: z.number().describe("Radius of the circle"),
    fill: z.string().optional().describe("Fill color"),
    stroke: z.string().optional().describe("Stroke color"),
  }),
  tool: async ({ x, y, radius, fill, stroke }) => {
    const shape = canvasApi.addShape({
      type: "circle",
      x,
      y,
      radius,
      fill: fill ?? "#3b82f6",
      stroke: stroke ?? "#000000",
    });
    return { id: shape.id, message: `Added circle at (${x}, ${y})` };
  },
});

export const clearCanvasTool = defineTool({
  name: "clearCanvas",
  description: "Remove all shapes from the canvas",
  inputSchema: z.object({}),
  tool: async () => {
    canvasApi.clear();
    return { message: "Canvas cleared" };
  },
});

export const canvasTools = [
  addRectangleTool,
  addTextTool,
  addCircleTool,
  clearCanvasTool,
];
```

**Key point:** Adjust the import path and method names (`canvasApi.addShape`, `canvasApi.clear`, etc.) to match the app's actual imperative API. Add more tools for lines, arrows, or any other shapes the app supports.

## Step 5: Create Component Registry

Create `src/lib/tambo.ts`:

```tsx
import { TamboComponent } from "@tambo-ai/react";

export const components: TamboComponent[] = [
  // No generative UI components needed for now --
  // the AI interacts with the canvas through tools, not rendered components.
  // Components can be added later if you want the AI to render
  // previews or configuration panels in the chat.
];
```

## Step 6: Wire Up the Provider in `src/main.tsx`

Edit `src/main.tsx` to wrap the app with TamboProvider:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { TamboProvider } from "@tambo-ai/react";
import { components } from "./lib/tambo";
import { canvasTools } from "./lib/tambo-tools";
import App from "./App";
// Import Tambo's globals.css (will be created by `tambo add` in the next step)
import "./app/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <TamboProvider
    apiKey={import.meta.env.VITE_TAMBO_API_KEY}
    userKey="default-user"
    components={components}
    tools={canvasTools}
    contextHelpers={{
      canvasState: () => ({
        // Provide current canvas info so the AI can make informed decisions
        // about where to place shapes
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        // If the canvas API exposes current shapes, include a summary:
        // shapeCount: canvasApi.getShapes().length,
        // selectedShape: canvasApi.getSelectedShape()?.id,
      }),
    }}
  >
    <App />
  </TamboProvider>,
);
```

## Step 7: Add Chat UI and Handle Keyboard Isolation

### 7a. Install the pre-built collapsible chat panel

```bash
npx tambo add message-thread-collapsible --yes
```

This installs a collapsible chat panel (bottom-right corner) and creates `globals.css` with Tailwind theme variables. Since the project has no Tailwind, `tambo add` will install Tailwind v4 via PostCSS additively -- this will not break existing CSS/SCSS.

### 7b. Add the `@/` path alias for Vite

Edit `vite.config.ts` to add the path alias (Tambo components use `@/` imports):

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

Edit `tsconfig.json` to add the corresponding path mapping:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 7c. Add the chat panel to the app WITH keyboard isolation and z-index

This is the critical step for the keyboard shortcut problem. Edit the main App component (e.g., `src/App.tsx`) to include the chat panel wrapped in an event-stopping div:

```tsx
import { MessageThreadCollapsible } from "./components/tambo/message-thread-collapsible";

function App() {
  return (
    <>
      {/* Existing canvas UI */}
      <Canvas />
      <Toolbar />

      {/* Tambo chat panel -- keyboard events are stopped from propagating
          so typing in the chat input won't trigger canvas shortcuts (R, T, etc.) */}
      <div
        onKeyDown={(e) => e.stopPropagation()}
        onKeyUp={(e) => e.stopPropagation()}
        style={{ position: "relative", zIndex: 9999 }}
      >
        <MessageThreadCollapsible />
      </div>
    </>
  );
}
```

**Why this works:** The app uses `document.addEventListener("keydown", ...)` to listen for shortcut keys. React's `onKeyDown` handler fires during the bubble phase before the event reaches `document`. Calling `e.stopPropagation()` prevents the event from bubbling up to the document-level listener, so pressing "R" or "T" inside the chat input types those characters normally instead of activating the rectangle or text tool.

The `zIndex: 9999` ensures the chat panel renders above the full-screen canvas.

## Step 8: Set Up the Environment Variable

Create `.env.local` at the project root:

```
VITE_TAMBO_API_KEY=sk_your_api_key_here
```

Or run `npx tambo init --api-key=sk_...` to have it created automatically.

## Step 9: Verification

Start the dev server and verify:

```bash
npm run dev
```

Test the following:

1. **Chat panel renders** -- A collapsible chat button appears in the bottom-right corner. Clicking it opens the chat panel.
2. **Keyboard isolation works** -- Open the chat panel and type "R" or "T" in the input. These characters should appear in the input field, NOT activate the rectangle or text tool on the canvas.
3. **Canvas shortcuts still work** -- Close or blur the chat panel. Press "R" or "T" -- the canvas tools should activate as before.
4. **AI can draw shapes** -- Type "Draw a red rectangle at the center of the canvas" in the chat. Tambo should call the `addRectangle` tool and a rectangle should appear on the canvas.
5. **Z-index is correct** -- The chat panel should appear above the canvas and any toolbars/overlays.

## Summary of Files Created/Modified

| File                     | Action                 | Purpose                                                      |
| ------------------------ | ---------------------- | ------------------------------------------------------------ |
| `src/lib/tambo.ts`       | Create                 | Component registry (empty for now)                           |
| `src/lib/tambo-tools.ts` | Create                 | Tool definitions bridging Tambo to the canvas imperative API |
| `src/main.tsx`           | Modify                 | Wrap app in TamboProvider with tools and context helpers     |
| `src/App.tsx`            | Modify                 | Add MessageThreadCollapsible with keyboard isolation wrapper |
| `vite.config.ts`         | Modify                 | Add `@/` path alias                                          |
| `tsconfig.json`          | Modify                 | Add `@/*` path mapping                                       |
| `.env.local`             | Create                 | VITE_TAMBO_API_KEY                                           |
| `src/app/globals.css`    | Created by `tambo add` | Tailwind + theme variables                                   |
| `src/components/tambo/*` | Created by `tambo add` | Pre-built chat UI components                                 |

## Commands in Order

```bash
# 1. Install dependencies
npm install @tambo-ai/react
npm install zod

# 2. Install pre-built chat UI
npx tambo add message-thread-collapsible --yes

# 3. Set up API key (or create .env.local manually)
npx tambo init --api-key=sk_your_key_here

# 4. Start dev server
npm run dev
```

All code edits (steps 4-7) happen between commands 1 and 2, or can be done after all installs are complete.
