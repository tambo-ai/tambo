# Tambo Database Starter Template

This is a starter Next.js app with Tambo + **Prisma ORM database integration** to get your AI-powered data applications started quickly.

Unlike the standard Next.js template, this starter demonstrates how to integrate a real database with Tambo AI tools, using SQLite locally and providing clear migration paths to PostgreSQL or MySQL for production.

## 🎯 What Makes This Template Different

This template's **primary value** is demonstrating **database integration** with Tambo:

- ✅ **Prisma ORM** with SQLite for local development
- ✅ **Production-ready** database configuration for PostgreSQL/MySQL
- ✅ **Server-side data fetching** via Next.js API routes
- ✅ **Type-safe queries** with Prisma Client
- ✅ **AI-powered data analysis** using Tambo tools
- ✅ **Database migration** management with Prisma Migrate

## Get Started

1. **Install dependencies**

```bash
npm install
```

2. **Set up Tambo**

```bash
npx tambo init
```

Or rename `.env.local.example` to `.env.local` and add your Tambo API key from [tambo.ai/dashboard](https://tambo.ai/dashboard)

3. **Initialize database**

```bash
npx prisma generate
npx prisma migrate dev
npm run seed
```

4. **Start development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app!

## 📊 Database Configuration

### Local Development (SQLite)

By default, this template uses **SQLite** for local development - no setup required!

Your database file is created at `prisma/dev.db` and works immediately after running migrations.

### Production (PostgreSQL or MySQL)

When you're ready for production, switch to PostgreSQL or MySQL:

**Option 1: PostgreSQL (Recommended)**

1. Update `prisma/schema.prisma`:

   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Add connection string to `.env.local`:

   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
   ```

3. Run migrations:
   ```bash
   npx prisma migrate dev
   ```

**Option 2: MySQL**

1. Update `prisma/schema.prisma`:

   ```prisma
   datasource db {
     provider = "mysql"
     url      = env("DATABASE_URL")
   }
   ```

2. Add connection string to `.env.local`:

   ```
   DATABASE_URL="mysql://user:password@localhost:3306/mydb"
   ```

3. Run migrations:
   ```bash
   npx prisma migrate dev
   ```

> **💡 Tip:** The `prisma/schema.prisma` file includes commented examples for all three database providers.

## Customizing

### Database Integration Pattern

This template demonstrates the recommended pattern for database integration with Tambo:

**1. Prisma Schema** (`prisma/schema.prisma`)

Define your data models:

```prisma
model Student {
  id      Int    @id @default(autoincrement())
  name    String
  subject String
  score   Int
}
```

**2. API Routes** (`app/api/students/`)

API routes handle server-side Prisma queries safely:

```typescript
// app/api/students/all/route.ts
export async function GET() {
  const students = await prisma.student.findMany({
    orderBy: { score: "desc" },
  });
  return Response.json(students);
}
```

**3. Tambo Tools** (`tools/studentTools.ts`)

Tools call API routes to fetch data for AI processing:

```typescript
const getAllStudentsTool: TamboTool = {
  name: "getAllStudents",
  description: "Fetch all students with their scores",
  tool: async () => {
    const response = await fetch("/api/students/all");
    return await response.json();
  },
};
```

**Why This Pattern?**

- ✅ Keeps Prisma on the server (can't run in browser)
- ✅ Type-safe end-to-end with Zod schemas
- ✅ Separates data access from AI logic
- ✅ Easy to test and maintain

### Included Tools

- `getAllStudents` - Fetch all student records
- `getLowPerformers` - Filter students below a score threshold
- `getSubjectSummary` - Aggregate performance by subject

Sample data includes 6 students across Math, Science, and History subjects.

### Add Your Own Data Models

1. Update `prisma/schema.prisma` with your models
2. Run `npx prisma migrate dev --name your_migration`
3. Update seed data in `prisma/seed.ts`
4. Run `npm run seed`

### Add More Tambo Tools

1. Create API routes in `app/api/` for data access
2. Define tools in `tools/studentTools.ts`
3. Register tools in `app/providers.tsx`

### Change what components tambo can control

You can register Tambo components in `app/providers.tsx`:

```tsx
<TamboProvider
  apiKey={apiKey}
  tools={tools}
  components={components} // Add your components here
>
  {children}
</TamboProvider>
```

Read more about components at [https://docs.tambo.co/concepts/generative-interfaces/generative-components](https://docs.tambo.co/concepts/generative-interfaces/generative-components)

### Database Commands

```bash
npm run db:generate    # Generate Prisma Client
npm run db:migrate     # Run migrations
npm run db:studio      # Open Prisma Studio (GUI)
npm run seed           # Seed database with sample data
```

## Learn More

- [Tambo Documentation](https://docs.tambo.co/)
- [Tambo Tools](https://docs.tambo.co/concepts/tools)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

**Built with [Tambo AI](https://tambo.co)**
