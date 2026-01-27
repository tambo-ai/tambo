# Next.js + Drizzle + PostgreSQL + Better Auth + Tambo

This project demonstrates a robust integration of **Next.js** with **Better Auth** for authentication, **Drizzle ORM** with **PostgreSQL** for database management, and **Tambo** for AI-powered chat functionality.

## Features

- **Authentication**: Secure user authentication using [Better Auth](https://better-auth.com/), supporting Email/Password, Google, and GitHub providers.
- **Database**: Type-safe database interactions with [Drizzle ORM](https://orm.drizzle.team/) and PostgreSQL.
- **AI Integration**: AI chat capabilities powered by [Tambo](https://tambo.co/).
- **UI Components**: Built with Shadcn UI and Tailwind CSS.

## Prerequisites

- Node.js 22.17.0 or later
- PostgreSQL database (local or hosted, e.g., Neon, Supabase)

## Getting Started

### 1. clone the repository & install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory. You can use the `example.env.local` as a reference.

```bash
cp example.env.local .env.local
```

Add the following environment variables:

```env
# Database
DATABASE_URL="postgres://user:password@host:port/dbname"

# Better Auth
BETTER_AUTH_URL="http://localhost:3000" # Base URL of your app
BETTER_AUTH_SECRET="your_random_secret_string" # Generate with `openssl rand -base64 32`

# Social Providers (Optional)
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"

# Tambo AI
TAMBO_API_KEY="your_tambo_api_key"
NEXT_PUBLIC_TAMBO_API_KEY="your_tambo_public_api_key"
```

### 3. Database Setup (Drizzle ORM)

This project uses Drizzle ORM for schema management and migrations.

**Generate Migrations**
If you modify `src/lib/db/schema.ts`, generate the SQL migration files:

```bash
npm run db:generate
```

**Run Migrations**
Apply the generated migrations to your PostgreSQL database:

```bash
npm run db:migrate
```

**Direct Push (Prototyping)**
For quick prototyping without creating migration files (not recommended for production):

```bash
npm run db:push
```

**Visualize Database**
Open Drizzle Studio to inspect and manage your data:

```bash
npm run db:studio
```

### 4. Running the Application

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

- **Auth Configuration**:
  - `src/lib/auth/auth.ts`: Server-side Better Auth configuration (adapters, providers).
  - `src/lib/auth/auth-client.ts`: Client-side Better Auth client.
  - `src/app/api/auth/[...all]/route.ts`: API route handler for auth.

- **Database**:
  - `src/lib/db/index.ts`: Database connection setup.
  - `src/lib/db/schema.ts`: Database schema definitions (User, Session, Account, etc.).
  - `drizzle.config.ts`: Drizzle Kit configuration.

- **Tambo Integration**:
  - The integration relies on the `TamboProvider` wrapping the application (or specific routes), using the Better Auth ID token for user context.

## Better Auth Skills

You can add skills for Better Auth to your project using the following command:

```bash
npx skills add better-auth/skills
```

## Customizing

### Change what components tambo can control

You can see how components are registered with tambo in `src/lib/tambo.ts`:

```tsx
export const components: TamboComponent[] = [
  {
    name: "Graph",
    description:
      "A component that renders various types of charts (bar, line, pie) using Recharts. Supports customizable data visualization with labels, datasets, and styling options.",
    component: Graph,
    propsSchema: graphSchema,
  },
  // Add more components here
];
```

You can install the graph component into any project with:

```bash
npx tambo add graph
```

The example Graph component demonstrates several key features:

- Different prop types (strings, arrays, enums, nested objects)
- Multiple chart types (bar, line, pie)
- Customizable styling (variants, sizes)
- Optional configurations (title, legend, colors)
- Data visualization capabilities

Update the `components` array with any component(s) you want tambo to be able to use in a response!

You can find more information about the options [here](https://docs.tambo.co/concepts/generative-interfaces/generative-components)

### Add tools for tambo to use

Tools are defined with `inputSchema` and `outputSchema`:

```tsx
export const tools: TamboTool[] = [
  {
    name: "globalPopulation",
    description:
      "A tool to get global population trends with optional year range filtering",
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
  // Add more tools here
];
```

Find more information about tools [here.](https://docs.tambo.co/concepts/tools)

### The Magic of Tambo Requires the TamboProvider

Make sure in the TamboProvider wrapped around your app:

```tsx
...
<TamboProvider
  apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
  components={components} // Array of components to control
  tools={tools} // Array of tools it can use
>
  {children}
</TamboProvider>
```

In this example we do this in the `Layout.tsx` file, but you can do it anywhere in your app that is a client component.

### Voice input

The template includes a `DictationButton` component using the `useTamboVoice` hook for speech-to-text input.

### MCP (Model Context Protocol)

The template includes MCP support for connecting to external tools and resources. You can use the MCP hooks from `@tambo-ai/react/mcp`:

- `useTamboMcpPromptList` - List available prompts from MCP servers
- `useTamboMcpPrompt` - Get a specific prompt
- `useTamboMcpResourceList` - List available resources

See `src/components/tambo/mcp-components.tsx` for example usage.

### Change where component responses are shown

The components used by tambo are shown alongside the message response from tambo within the chat thread, but you can have the result components show wherever you like by accessing the latest thread message's `renderedComponent` field:

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

For more detailed documentation, visit [Tambo's official docs](https://docs.tambo.co).

## License

MIT
