# Tambo Template (React Router v7)

A starter template for building AI-powered apps with generative UI components using Tambo and React Router v7.

## Screenshot

<img width="1449" height="802" alt="Image" src="https://github.com/user-attachments/assets/94c39aea-eefc-4c36-9d11-99d26766f9a1" />

<img width="1469" height="805" alt="Image" src="https://github.com/user-attachments/assets/4e33c4f2-b7ec-4afd-b292-fc0495e38856" />

## Video Demo

https://github.com/user-attachments/assets/27f1789d-5f9b-420c-88c6-04c7029cc4e1

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A free [Tambo API key](https://tambo.co/dashboard)

## Setup

1. Clone the repository:

   ```bash
   git clone <repo-url>
   cd tambo-os
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Initialize Tambo (creates `.env.local` with your API key):

   ```bash
   npx tambo init
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

## What's Included

- **React Router v7** - File-based routing and SSR-ready framework
- **Tambo SDK** - AI-powered generative UI with `@tambo-ai/react`
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization for the example Graph component
- **Zod** - Schema validation for tool inputs/outputs
- **TypeScript** - Type-safe development
- **Vite** - Fast development server and build tooling

## Features

- **Generative UI Components** - Register React components that Tambo dynamically renders in response to user prompts
- **Tool Integration** - Define tools with input/output schemas that Tambo can invoke
- **Chat Interface** - Full-featured chat UI with message threading
- **Voice Input** - Speech-to-text using the `useTamboVoice` hook
- **MCP Support** - Model Context Protocol integration for external tools

## Project Structure

```
app/
├── components/        # React components
│   ├── tambo/        # Tambo-specific components (chat UI, MCP)
│   └── ui/           # General UI components
├── lib/              # Utilities and Tambo configuration
├── routes/           # Route pages
│   ├── page.tsx      # Home page
│   ├── chat/         # Chat page with full message thread
│   └── interactables/ # Interactive demo page
├── services/         # Business logic and data services
├── root.tsx          # Root layout
└── routes.ts         # Route configuration
```

## Customization

### Register Components

Add components to `app/lib/tambo.ts`:

```tsx
export const components: TamboComponent[] = [
  {
    name: "Graph",
    description: "Renders bar, line, or pie charts using Recharts.",
    component: Graph,
    propsSchema: graphSchema,
  },
];
```

### Add Tools

Define tools with schemas:

```tsx
export const tools: TamboTool[] = [
  {
    name: "globalPopulation",
    description: "Get global population trends",
    tool: getGlobalPopulationTrend,
    inputSchema: z.object({
      startYear: z.number().optional(),
      endYear: z.number().optional(),
    }),
    outputSchema: z.array(
      z.object({
        year: z.number(),
        population: z.number(),
        growthRate: z.number(),
      }),
    ),
  },
];
```

## Documentation

For more details, visit [Tambo's official docs](https://docs.tambo.co).
