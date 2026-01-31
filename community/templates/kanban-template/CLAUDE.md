# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important: This is a Tambo AI Template

**This is a Kanban task management template for Tambo AI.** Before writing any new code:

1. **Check the package** - Read `node_modules/@tambo-ai/react` to understand the latest available hooks, components, and features

Always check the `@tambo-ai/react` package exports for the most up-to-date functionality.

## Essential Commands

```bash
# Development
npm run dev          # Start development server (localhost:3000)
npm run build        # Build production bundle
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Run ESLint with auto-fix
```

## Architecture Overview

This is a Next.js 15 app with Tambo AI integration for building a conversational Kanban board. Users can create, move, and manage tasks through natural language.

### Core Technologies
- **Next.js 15** with App Router
- **React 19** with TypeScript
- **Tambo AI SDK** for generative UI
- **Zustand** for state management (with localStorage persistence)
- **Tailwind CSS** with dark mode support
- **Zod** for schema validation

### Key Architecture Patterns

1. **Component Registration System**
   - Components registered in `src/lib/tambo.ts` with Zod schemas
   - AI dynamically renders TaskCard components based on user input

2. **Tool System**
   - Tools defined in `src/lib/task-tools.ts`
   - AI can invoke createTask, moveTask, getTasks

3. **State Management**
   - Zustand store in `src/lib/task-store.ts`
   - Persists tasks to localStorage

### File Structure

```
src/
├── app/
│   ├── page.tsx           # Main page: Kanban board + chat
│   ├── chat/page.tsx      # Full-width chat interface
│   └── layout.tsx         # Root layout
├── components/
│   └── tambo/
│       ├── task-card.tsx      # Generative TaskCard component
│       ├── kanban-board.tsx   # KanbanBoard display
│       ├── message*.tsx       # Chat UI components
│       └── thread*.tsx        # Thread management UI
├── lib/
│   ├── tambo.ts           # Component & tool registration
│   ├── task-store.ts      # Zustand store for tasks
│   ├── task-tools.ts      # Tambo tools (createTask, moveTask, getTasks)
│   └── utils.ts           # Utility functions
└── types/
    └── task.ts            # Task, Priority, Status types
```

## Key Tambo Hooks

- **`useTamboThread`**: Thread state and message management
- **`useTamboThreadInput`**: Input handling for chat

## When Working on This Codebase

1. **Adding New Components**
   - Define component in `src/components/tambo/`
   - Create Zod schema for props validation
   - Register in `src/lib/tambo.ts` components array

2. **Adding New Tools**
   - Implement in `src/lib/task-tools.ts`
   - Define Zod schemas for inputs/outputs
   - Export from `taskTools` array

3. **Modifying Task State**
   - Update `src/lib/task-store.ts`
   - Types in `src/types/task.ts`

<!-- tambo-docs-v1.0 -->

## Tambo AI Framework

This project uses **Tambo AI** for building AI assistants with generative UI.

**Documentation**: https://docs.tambo.co/llms.txt

**CLI**: Use `npx tambo` to add UI components or upgrade. Run `npx tambo help` to learn more.
