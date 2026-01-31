# Prisma Task Manager (Tambo Template)

This is a starter Next.js app with Tambo and Prisma hooked up for AI-powered task management. Natural language can create and list tasks, persisted with SQLite.

## Get Started

1. Run `npm create-tambo@latest my-tambo-app` for a new project, or clone this template.
2. `npm install`
3. `npx tambo init` — or rename `example.env.local` to `.env.local` and add your [Tambo API key](https://tambo.co/dashboard) (free).
4. `npx prisma migrate dev` to set up the database.
5. `npm run dev` and go to [localhost:3000](http://localhost:3000).

## Customizing

### Change what components Tambo can control

Components are registered in `src/lib/tambo.ts`:

```ts
export const components: TamboComponent[] = [
  {
    name: "TaskList",
    description: "Displays a list of tasks...",
    component: TaskList,
    propsSchema: taskListPropsSchema,
  },
  // Add more components here
];
```

Update the `components` array to add or change components Tambo can render.

You can find more information about the options [here](https://docs.tambo.co/concepts/generative-interfaces/generative-components).

### Add tools for Tambo to use

Tools are defined in `src/lib/tambo.ts` with `inputSchema` and `outputSchema`:

```ts
export const tools: TamboTool[] = [
  {
    name: "createTask",
    description: "Create a new task",
    inputSchema: z.object({ title: z.string() }),
    outputSchema: z.object({ message: z.string() }),
    tool: async ({ title }) => { ... },
  },
  {
    name: "getTasks",
    description: "Get all tasks",
    ...
  },
];
```

Find more information about [tools](https://docs.tambo.co/concepts/tools) in the docs.

### TamboProvider

The chat page wraps the UI in `TamboProvider` with `components` and `tools` from `src/lib/tambo.ts`:

```tsx
<TamboProvider
  apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
  components={components}
  tools={tools}
>
  <ChatClient />
</TamboProvider>
```

In this example we do this in the chat page (`src/app/chat/page.tsx`), but you can do it anywhere in your app that is a client component.

### Change where component responses are shown

The components used by Tambo are shown alongside the message response from Tambo within the chat thread, but you can have the result components show wherever you like by accessing the latest thread message's `renderedComponent` field:

```tsx
const { thread } = useTamboThread();
const latestComponent =
  thread?.messages[thread.messages.length - 1]?.renderedComponent;

return (
  <div>
    {latestComponent && (
      <div className="my-custom-wrapper">{latestComponent}</div>
    )}
  </div>
);
```

## Video Demo

Please add a short screen recording (e.g. Loom, GitHub video) showing:

1. Opening the app (home page and setup checklist).
2. Going to Chat and adding a task via natural language (e.g. “Add task Buy milk”).
3. Asking to list tasks and seeing the TaskList component render.

Paste the video link in your PR description.

## Tech Stack

- Next.js (App Router)
- Tambo
- Prisma ORM
- SQLite
- Tailwind CSS

## Project Structure

```
src/
  app/
    page.tsx           # Landing page (ApiKeyCheck, KeyFilesSection)
    layout.tsx         # Root layout (fonts, globals)
    chat/
      page.tsx        # Chat page (TamboProvider + ChatClient)
      ChatClient.tsx  # Chat UI (thread + input)
    api/
      tasks/
        route.ts      # GET/POST tasks
  components/
    ApiKeyCheck.tsx   # API key setup prompt
    tambo/
      TaskList.tsx    # Task list component
  lib/
    tambo.ts          # Components + tools registration
    prisma.ts         # Prisma client
prisma/
  schema.prisma
```

## Try It

In chat, try:

- **Add task Buy milk**
- **Show my tasks** / **List tasks**

Tasks are stored in SQLite and rendered as the TaskList component.

For more details, see [Tambo’s official docs](https://docs.tambo.co).
