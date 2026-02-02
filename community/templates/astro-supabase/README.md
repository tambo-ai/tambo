# Astro Supabase Tambo Template

This is a starter Astro app with Supabase and Tambo hooked up to get your AI
app development started quickly.

<img width="1878" height="1037" alt="tambo_astro_supabase_integration" src="https://github.com/user-attachments/assets/7c9255a1-80d3-4ce3-a4e0-4f6170bd4ede" />

## Video Demo

[![Video Demo](https://github.com/user-attachments/assets/b101f68e-ae8c-431e-8357-dce14414c370)](https://github.com/user-attachments/assets/b101f68e-ae8c-431e-8357-dce14414c370)

## Get Started

1. Copy this template (or clone the repo and navigate to this folder)

2. `npm install`

3. Create a `.env` file with your credentials:

   ```env
   PUBLIC_SUPABASE_URL=your-supabase-url
   PUBLIC_SUPABASE_ANON_KEY=your-supabase-public-key
   PUBLIC_TAMBO_API_KEY=your-tambo-api-key
   ```

   **Note:** The `PUBLIC_` prefix is required for Astro to expose these variables to client-side code.
   - Get your Tambo API key for free [here](https://tambo.co/dashboard).
   - Get your Supabase URL/Key from your [Supabase
     Dashboard](https://supabase.com/dashboard).

4. Apply the database schema using Supabase migrations:

   ```bash
   npm run db:push
   ```

   (Or copy the SQL from
   `supabase/migrations/20260129000000_create_users_table.sql` and run it in
   your Supabase SQL Editor)

5. Run `npm run dev` and go to `localhost:4321` to use the app!

## Customizing

### Change what components tambo can control

You can see how components are registered with tambo in `src/lib/tambo.ts`:

```typescript
export const components: TamboComponent[] = [
  {
    name: "Graph",
    description:
      "Renders interactive charts (bar, line, pie) for data visualization with customizable styling",
    component: Graph,
    propsSchema: graphSchema,
  },
  {
    name: "DataTable",
    description:
      "Displays data from Supabase in a formatted table with columns and rows",
    component: DataTable,
    propsSchema: dataTableSchema,
  },
  // Add more components here
];
```

The example Graph component demonstrates several key features:

- Different prop types (strings, arrays, enums, nested objects)
- Multiple chart types (bar, line, pie)
- Customizable styling (variants, sizes)
- Optional configurations (title, legend, colors)
- Data visualization capabilities

Update the `components` array with any component(s) you want tambo to be able
to use in a response!

You can find more information about the options
[here](https://docs.tambo.co/concepts/generative-interfaces/generative-components)

### Add tools for tambo to use

Tools are defined with `inputSchema` and `outputSchema`:

```typescript
export const tools: TamboTool[] = [
  {
    name: "fetchUsers",
    description: "Fetches all users from the Supabase database",
    tool: async () => {
      const { data, error } = await supabase.from("users").select("*");
      if (error) throw error;
      return data;
    },
    inputSchema: z.object({}),
    outputSchema: z.array(z.record(z.any())),
  },
];
```

This template includes tools to `fetchUsers`, `addUser`, `deleteUser`, and
`getUserCount` connected to Supabase.

Find more information about tools [here.](https://docs.tambo.co/concepts/tools)

### The Magic of Tambo Requires the TamboProvider

Make sure in the TamboProvider wrapped around your app:

```tsx
<TamboProvider
  apiKey={import.meta.env.PUBLIC_TAMBO_API_KEY}
  components={components} // Array of components to control
  tools={tools} // Array of tools it can use
  userToken={userToken} // Supabase session token for thread scoping
>
  <ChatInterface />
</TamboProvider>
```

In this example we do this in the `TamboChat.tsx` component, but you can do
it anywhere in your app that is a client component.

### Voice input

The template includes a `DictationButton` component using the `useTamboVoice`
hook for speech-to-text input.

### Change where component responses are shown

The components used by tambo are shown alongside the message response from
tambo within the chat thread, but you can have the result components show
wherever you like by accessing the latest thread message's `renderedComponent`
field:

```tsx
const { thread } = useTambo();
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

For more detailed documentation, visit [Tambo's official
docs](https://docs.tambo.co).
