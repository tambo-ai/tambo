# Kanban Task Management Template

A conversational kanban board built with Tambo. Create, move, and manage tasks using natural language.

## Features

- Create tasks with priority and due dates via conversation
- Move tasks between columns naturally ("move X to done")
- View tasks filtered by status
- Persistent storage with localStorage

## Setup

1. Clone and install:

   ```bash
   cd community/templates/kanban-template
   npm install
   ```

2. Copy environment file and add your Tambo API key:

   ```bash
   cp example.env.local .env.local
   ```

   Get your API key for free at [tambo.co/dashboard](https://tambo.co/dashboard).

3. Run development server:

   ```bash
   npm run dev
   ```

4. Open http://localhost:3000

## What's Included

- **Tambo Components:** TaskCard (generative)
- **Tambo Tools:** createTask, moveTask, getTasks
- **State Management:** Zustand with localStorage persistence
- **Styling:** Tailwind CSS

## Example Conversations

- "Create a task called Review PR with high priority"
- "Add a documentation task due Friday"
- "Move Review PR to in progress"
- "Show me all high priority tasks"
- "What's in the done column?"

## Customizing

### Adding New Tools

Tools are defined in `src/lib/task-tools.ts` with `inputSchema` and `outputSchema`:

```tsx
export const createTaskTool: TamboTool = {
  name: "createTask",
  description: "Create a new task in the kanban board",
  inputSchema: z.object({
    title: z.string(),
    priority: z.enum(["low", "medium", "high"]).optional(),
  }),
  outputSchema: taskSchema,
  tool: async (input) => {
    // Implementation
  },
};
```

### Registering Components

Components are registered in `src/lib/tambo.ts`:

```tsx
export const components: TamboComponent[] = [
  {
    name: "TaskCard",
    description: "Displays a task with title, description, and priority",
    component: TaskCard,
    propsSchema: taskCardPropsSchema,
  },
];
```

For more detailed documentation, visit [Tambo's official docs](https://docs.tambo.co).
