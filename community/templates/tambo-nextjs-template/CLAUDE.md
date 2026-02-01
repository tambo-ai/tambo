# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important: This is a Tambo AI Template

**This is a template application for Tambo AI.** Before writing any new code:

1. **Check the package** - Read `node_modules/@tambo-ai/react` to understand the latest available hooks, components, and features

Always check the `@tambo-ai/react` package exports for the most up-to-date functionality. The template may not showcase all available features.

## Essential Commands

```bash
# Development
npm run dev          # Start development server (localhost:3000)
npm run build        # Build production bundle
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Run ESLint with auto-fix


## Architecture Overview

This is a Next.js 15 app with Tambo AI integration for building generative UI/UX applications. The architecture enables AI to dynamically generate and control React components.

### Core Technologies
- **Next.js 15.4.1** with App Router
- **React 19.1.0** with TypeScript
- **Tambo AI SDK**
- **Tailwind CSS v4** with dark mode support
- **Zod** for schema validation

### Key Architecture Patterns

1. **Component Registration System**
   - Components are registered in `src/lib/tambo.ts` with Zod schemas
   - AI can dynamically render these components based on user input
   - Each component has a name, description, component reference, and propsSchema

2. **Tool System**
   - External functions registered as "tools" in `src/lib/tambo.ts`
   - AI can invoke these tools to fetch data or perform actions
   - Tools have schemas defining their inputs and outputs

3. **Provider Pattern**
   - `TamboProvider` wraps the app in `src/app/layout.tsx`
   - Provides API key, registered components, and tools to the entire app

4. **Streaming Architecture**
   - Real-time streaming of AI-generated content via `useTamboStreaming` hook
   - Support for progressive UI updates during generation

### File Structure

```

src/
├── app/ # Next.js App Router pages
│ ├── chat/ # Chat interface route
│ ├── interactables/ # Interactive components demo
│ └── layout.tsx # Root layout with TamboProvider
├── components/
│ ├── tambo/ # Tambo-specific components
│ │ ├── graph.tsx # Recharts data visualization
│ │ ├── message*.tsx # Chat UI components
│ │ └── thread*.tsx # Thread management UI
│ └── ApiKeyCheck.tsx # API key validation
├── lib/
│ ├── tambo.ts # CENTRAL CONFIG: Component & tool registration
│ ├── thread-hooks.ts # Custom thread management hooks
│ └── utils.ts # Utility functions
└── services/
└── population-stats.ts # Demo data service

```

## Key Tambo Hooks

- **`useTamboRegistry`**: Component and tool registration
- **`useTamboThread`**: Thread state and message management
- **`useTamboThreadInput`**: Input handling for chat
- **`useTamboStreaming`**: Real-time content streaming
- **`useTamboSuggestions`**: AI suggestion management
- **`withInteractable`**: Interactable component wrapper

## When Working on This Codebase

1. **Adding New Components for AI Control**
   - Define component in `src/components/tambo/`
   - Create Zod schema for props validation
   - use z.infer<typeof schema> to type the props
   - Register in `src/lib/tambo.ts` components array

2. **Adding New Tools**
   - Implement tool function in `src/services/`
   - Define Zod schema for inputs/outputs
   - Register in `src/lib/tambo.ts` tools array

3. **Styling Guidelines**
   - Use Tailwind CSS classes
   - Follow existing dark mode patterns using CSS variables
   - Components should support variant and size props

4. **TypeScript Requirements**
   - Strict mode is enabled
   - All components and tools must be fully typed
   - Use Zod schemas for runtime validation

5. **Testing Approach**
   - No test framework is currently configured
   - Manual testing via development server
   - Verify AI can properly invoke components and tools
```

<!-- tambo-docs-v1.0 -->

## Tambo AI Framework

This project uses **Tambo AI** for building AI assistants with generative UI and MCP support.

**Documentation**: https://docs.tambo.co/llms.txt

**CLI**: Use `npx tambo` to add UI components or upgrade. Run `npx tambo help` to learn more.
