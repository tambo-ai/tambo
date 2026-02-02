# Drizzle + Supabase Template

AI-powered database operations through natural language using Drizzle ORM and Supabase.

### Demo Screenshot

<img width="754" height="484" alt="demo" src="https://github.com/user-attachments/assets/10bdf1e5-6845-4aeb-baae-143e6ee4d078" />

### Demo Video

[Watch Demo Video](https://github.com/user-attachments/assets/ec09a08f-4463-41e4-85c3-a3cd2d899224)

### What This Demonstrates

This template shows how to integrate **Drizzle ORM** with **Supabase Postgres** in a Tambo application, enabling users to query and modify database records through natural language conversations.

## Prerequisites

You'll need:

1. **Node.js** and npm
2. **Supabase account** (free tier available) - [supabase.com](https://supabase.com)
3. **Tambo setup** - Run `npx tambo init` after installing
4. **LLM API key**

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

- Go to [supabase.com](https://supabase.com) and create a new project
- Wait for database provisioning (~2 minutes)

### 3. Get your Supabase credentials

Navigate to your project settings:

- **Database URL**: Settings → Database → Connection String (select "URI" mode)
- **Project URL**: Settings → API → Project URL
- **Anon Key**: Settings → API → anon public key

### 4. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local` with your credentials:

```env
NEXT_PUBLIC_TAMBO_API_KEY=get-from-next-step
DATABASE_URL=postgresql://postgres.[ref]:[password]@[host]:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Initialize Tambo

```bash
npx tambo init
```

Choose **Cloud** (free tier) or **Self-hosted**, then copy the API key to `.env.local`

### 6. Run database migrations

```bash
npm run db:generate (generates migration files from schema changes)
```

```bash
npm run db:migrate
```

This creates the `tasks` table in your Supabase database.

### 7. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start chatting!

## Try It Out

Ask the AI:

- **"Show me all my tasks"**
- **"Create a task called 'Review pull requests' with high priority"**
- **"Add a new task: Deploy to production, status in_progress, priority high"**
- **"Show me all high priority tasks"**

## What's Included

- **Next.js** - React framework with App Router and TypeScript strict mode
- **Tambo** - Generative UI framework for AI-powered components
- **Drizzle ORM** - Type-safe database queries and migrations
- **Supabase** - Postgres database with real-time capabilities
- **shadcn/ui** - Accessible, customizable UI components

## How It Works

The template includes:

### Tambo Tools (AI Functions)

- **`queryTasks`** - Fetches tasks from database with optional filters (status, priority)
- **`insertTask`** - Creates new tasks with validation

### Tambo Components

- **`DataTable`** - Displays task results in a styled table with color-coded status and priority badges

### Database Schema

```typescript
tasks table:
  - id (uuid)
  - title (text)
  - description (text, nullable)
  - status (enum: 'todo' | 'in_progress' | 'done')
  - priority (enum: 'low' | 'medium' | 'high')
  - createdAt (timestamp)
```

When you chat with the AI:

1. Tambo analyzes your message intent
2. Calls the appropriate tool (`queryTasks` or `insertTask`)
3. Renders the `DataTable` component with results
4. Displays data with styled badges for status and priority

## Project Structure

```
src/
├── actions/
│   └── db-actions.ts          # Server Actions for database operations
├── components/
│   ├── tambo/
│   │   └── data-table.tsx     # Table component with styled badges
│   └── ui/                    # shadcn/ui components
├── lib/
│   ├── db/
│   │   ├── schema.ts          # Drizzle schema definitions
│   │   └── index.ts           # Database client
│   └── tambo.ts               # Tambo tools and components registration
└── app/                       # Next.js App Router pages

drizzle/
└── migrations/                # Auto-generated SQL migrations
```

## Extending This Template

Want to add more tables? Follow this pattern:

### 1. Update the schema

Edit `src/lib/db/schema.ts`:

```typescript
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  inStock: boolean("in_stock").default(true),
});
```

### 2. Generate and run migration

```bash
npm run db:generate
npm run db:migrate
```

### 3. Create Server Actions

Add to `src/actions/db-actions.ts`:

```typescript
export async function queryProducts() { ... }
export async function insertProduct() { ... }
```

### 4. Build a component

Create `src/components/tambo/product-table.tsx` following the `data-table.tsx` pattern.

### 5. Register with Tambo

Add tools and component to `src/lib/tambo.ts` following the existing examples.

The AI will now understand and interact with your products table!

## Learn More

- [Tambo Documentation](https://docs.tambo.co)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Supabase Docs](https://supabase.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
