# DSA Visualizer Template

A Tambo starter template for building DSA (Data Structures & Algorithms) visualizers with LeetCode-inspired UI where components are dynamically selected and rendered by AI based on natural-language input.

<!-- TODO: Replace with actual screenshot after PR is created -->
<!-- Upload screenshot by dragging into PR description, then paste the generated URL here -->
![DSA Visualizer Screenshot] <img width="1783" height="961" alt="image" src="https://github.com/user-attachments/assets/0ed51300-3f5b-46fe-9a69-f6d2912844d7" />


> 

## What's Included

- **Next.js 15** - React framework with App Router
- **Tambo AI** - Generative UI that picks the right component based on user intent
- **Tailwind CSS** - LeetCode-inspired dark theme styling
- **4 Visualization Components** - ArrayVisualizer, DPTable, CodeExplanation, StepController

## Why This Template?

Traditional React apps use conditional rendering:

```tsx
// ❌ Traditional approach - YOU decide what to show
if (userWantsArray) return <ArrayVisualizer />;
if (userWantsDP) return <DPTable />;
if (userWantsCode) return <CodeExplanation />;
```

With Tambo's generative UI, the **AI decides**:

```tsx
// ✅ Tambo approach - AI decides based on user intent
<TamboProvider components={[ArrayVisualizer, DPTable, CodeExplanation]}>
  <Chat /> {/* AI picks the right component for each message */}
</TamboProvider>
```

## What This Template Demonstrates

### 1. Generative Components

Components that Tambo selects and renders based on user intent:

| Component           | When AI Uses It                                    |
| ------------------- | -------------------------------------------------- |
| `ArrayVisualizer`   | Sorting, searching, two-pointer visualizations     |
| `DPTable`           | Dynamic programming table visualizations           |
| `CodeExplanation`   | Algorithm explanations with code and complexity    |

### 2. Interactable Components

Components that persist and update across messages:

| Component        | Purpose                                         |
| ---------------- | ----------------------------------------------- |
| `StepController` | Step-by-step algorithm execution with controls  |

Users can say "next step" or "reset" and the component responds.

### 3. Tools (Logic Layer)

Pure functions that implement algorithm logic:

| Tool                 | Purpose                              |
| -------------------- | ------------------------------------ |
| `computeNextStep`    | Advances algorithm execution state   |
| `resetExecution`     | Resets to initial state              |
| `generateArrayData`  | Creates sample arrays for demos      |

**Critical Architecture Rule:** Tools implement logic. AI orchestrates. Components render.

## Prerequisites

- Node.js 18+
- A [Tambo API key](https://app.tambo.co)

## Quick Start

```bash
# 1. Copy the template
cp -r community/templates/dsa-visualizer-template my-dsa-app
cd my-dsa-app

# 2. Install dependencies
npm install

# 3. Add your API key
cp .env.example .env.local
# Edit .env.local and add your NEXT_PUBLIC_TAMBO_API_KEY

# 4. Run the app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Example Prompts

Try these prompts to see generative UI in action:

| Prompt                                                        | Component Rendered     |
| ------------------------------------------------------------- | ---------------------- |
| "Explain Two Sum with a dry run"                              | CodeExplanation        |
| "Visualize bubble sort on [5, 3, 8, 1]"                       | ArrayVisualizer        |
| "Show DP table for 0/1 Knapsack"                              | DPTable                |
| "Walk me through binary search step by step"                  | StepController         |
| "Demonstrate sliding window technique"                        | ArrayVisualizer        |

## Project Structure

```
dsa-visualizer-template/
├── app/
│   ├── layout.tsx          # TamboProvider setup
│   ├── page.tsx            # Chat interface
│   └── globals.css         # Styling
├── components/
│   ├── ArrayVisualizer.tsx # Array visualization
│   ├── DPTable.tsx         # DP table visualization
│   ├── CodeExplanation.tsx # Code + explanation
│   └── StepController.tsx  # Step-by-step controller (interactable)
├── tambo/
│   ├── components.ts       # Component registry
│   ├── tools.ts            # Tool definitions
│   └── provider.tsx        # TamboProvider wrapper
├── lib/
│   └── utils.ts            # Utility functions
└── package.json
```

## Understanding the Architecture

### Three-Layer Separation

```
┌─────────────────────────────────────────┐
│         AI Orchestration (Tambo)        │
│  • Interprets user intent               │
│  • Selects components                   │
│  • Generates props                      │
│  • Calls tools when needed              │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│           Logic Layer (Tools)           │
│  • Pure algorithm functions             │
│  • No UI rendering                      │
│  • No AI decisions                      │
│  • Returns structured data              │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│          UI Layer (Components)          │
│  • Renders based on props               │
│  • No business logic                    │
│  • Declarative React components         │
└─────────────────────────────────────────┘
```

### Component Registration

Components tell Tambo WHEN they should be used:

```tsx
{
  name: "ArrayVisualizer",
  description: `Visualizes array-based algorithms.
    USE THIS WHEN: User wants to see sorting, searching, two-pointer...`,
  component: ArrayVisualizer,
  propsSchema: arrayVisualizerSchema, // Zod schema for props
}
```

### Interactable Components

Use `withInteractable` for components that persist:

```tsx
export const StepController = withInteractable(StepControllerBase, {
  componentName: "StepController",
  description: "Step-by-step controller...",
  propsSchema: stepControllerSchema,
  stateSchema: stepControllerStateSchema, // Persistent state
});
```

### Tools vs Components

| Tools                          | Components                      |
| ------------------------------ | ------------------------------- |
| Implement algorithm logic      | Render visual output            |
| Return structured JSON         | Accept props                    |
| Called by AI when needed       | Selected by AI based on intent  |
| No UI code                     | No business logic               |

## Extending This Template

### Add a New Visualization

1. Create component in `components/`:

```tsx
// components/TreeVisualizer.tsx
export const treeVisualizerSchema = z.object({...});
export function TreeVisualizer({...}: TreeVisualizerProps) {...}
```

2. Register in `tambo/components.ts`:

```tsx
{
  name: "TreeVisualizer",
  description: "USE THIS WHEN: User asks about tree algorithms...",
  component: TreeVisualizer,
  propsSchema: treeVisualizerSchema,
}
```

### Add a New Tool

1. Define in `tambo/tools.ts`:

```tsx
export const traverseTreeTool = defineTool({
  name: "traverseTree",
  description: "Performs tree traversal...",
  inputSchema: z.object({...}),
  outputSchema: z.object({...}),
  tool: async (input) => { /* pure logic */ },
});
```

2. Add to `tools` array export.

## Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript type checking
```

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **AI SDK:** @tambo-ai/react
- **Styling:** Tailwind CSS
- **Validation:** Zod
- **Icons:** Lucide React

## License

MIT

---

Built with [Tambo](https://tambo.co) – Generative UI for React
