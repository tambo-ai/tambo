# Student Performance Analytics with Tambo AI

![Dashboard Screenshot](https://github.com/user-attachments/assets/a92105b4-b710-4151-8248-45b93c3e48bb)

**🎥 [Demo Video](https://github.com/user-attachments/assets/95335842-6884-45a6-8c68-f35a6323650d)** - Watch the AI-powered analytics in action

A Next.js starter template for AI-powered student performance analytics using **Tambo AI**, **Prisma ORM**, and **Generative UI**. Analyze student data, identify low performers, and generate insights in real-time.

## 🎯 Features

- ✅ **AI-Powered Analytics** - Use Tambo generative UI to query student data naturally
- ✅ **Database Integration** - Prisma ORM with SQLite (local) and PostgreSQL/MySQL (production)
- ✅ **Student Performance Tools** - Fetch all students, identify low performers, aggregate by subject
- ✅ **Type-Safe API Routes** - Server-side data access with Zod validation
- ✅ **Real-Time Data** - Seed sample data and run migrations instantly
- ✅ **Extensible Database Setup** - Easy migration from SQLite to PostgreSQL/MySQL

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Tambo

Get your API key from [tambo.ai/dashboard](https://tambo.ai/dashboard), then:

```bash
npx tambo init
```

Or manually add to `.env.local`:

```env
NEXT_PUBLIC_TAMBO_API_KEY=your_api_key_here
```

### 3. Initialize Database

```bash
npx prisma generate
npx prisma migrate dev
npm run seed
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

## 📊 How It Works

### Data Architecture

```
Tambo AI (Frontend)
    ↓
Generative UI Components
    ↓
Tambo Tools (Natural Language Interface)
    ↓
API Routes (app/api/students/)
    ↓
Prisma Client (Type-Safe ORM)
    ↓
SQLite (Local) / PostgreSQL (Production)
```

### Student Performance Tools

The template includes three pre-built Tambo tools:

| Tool                | Description                    | Use Case                  |
| ------------------- | ------------------------------ | ------------------------- |
| `getAllStudents`    | Fetch all students with scores | Overview and analysis     |
| `getLowPerformers`  | Get students below threshold   | Identify at-risk students |
| `getSubjectSummary` | Aggregate scores by subject    | Subject-level insights    |

Ask Tambo naturally: _"Show me all students with low Math scores"_ or _"Which subject needs the most attention?"_

## 🛠️ Database Configuration

### Development (SQLite)

Default setup - no configuration needed. Database file: `prisma/dev.db`

### Production (PostgreSQL Recommended)

Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Add to `.env.local`:

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
```

Run migrations:

```bash
npx prisma migrate deploy
```

## 📚 Project Structure

```
student-eval-tambo/
├── app/
│   ├── api/students/          # API routes for data access
│   │   ├── all/               # Fetch all students
│   │   ├── low-performers/    # Filter by score threshold
│   │   └── subject-summary/   # Aggregate by subject
│   ├── globals.css            # Tailwind styles
│   ├── layout.tsx             # Root layout with Tambo provider
│   └── page.tsx               # Main page
├── lib/
│   └── prisma.ts              # Prisma Client singleton
├── prisma/
│   ├── schema.prisma          # Database models
│   ├── seed.ts                # Sample data
│   └── migrations/            # Migration history
├── tools/
│   └── studentTools.ts        # Tambo tool definitions
└── package.json
```

## 🔧 Common Tasks

### Add New Data Models

1. Update `prisma/schema.prisma`:

```prisma
model YourModel {
  id    Int     @id @default(autoincrement())
  name  String
}
```

2. Create migration:

```bash
npx prisma migrate dev --name add_your_model
```

3. Update seed in `prisma/seed.ts` and run:

```bash
npm run seed
```

### Create New Tambo Tool

1. Add API route in `app/api/` (e.g., `app/api/your-endpoint/route.ts`)
2. Define tool in `tools/studentTools.ts`:

```typescript
const yourTool: TamboTool = {
  name: "yourTool",
  description: "What this tool does",
  tool: async () => {
    const response = await fetch("/api/your-endpoint");
    return await response.json();
  },
};
```

3. Register in `app/providers.tsx` in the tools array

### Database Commands

```bash
npm run db:generate    # Generate Prisma Client
npm run db:migrate     # Run migrations
npm run db:studio      # Open Prisma Studio (GUI)
npm run seed           # Seed database
```

## 📖 Learn More

- [Tambo AI Docs](https://docs.tambo.co/)
- [Tambo Tools](https://docs.tambo.co/concepts/tools)
- [Prisma Documentation](https://www.prisma.io/docs)

## 📝 Environment Setup

Create `.env.local` in the root directory:

```env
# Tambo API Key
NEXT_PUBLIC_TAMBO_API_KEY=your_api_key_here

# Optional: For production database
# DATABASE_URL=postgresql://...
```

## 🎓 Sample Data

The template seeds 6 students across three subjects:

- **Math**: Alex (95), Jordan (72), Sam (88)
- **Science**: Casey (85), Morgan (68)
- **History**: Taylor (92)

Run `npm run seed` to populate the database with sample data.

## 🚀 Deployment

This template works with standard Next.js deployment platforms such as Vercel. Ensure required environment variables are configured.

---

**Happy building with Tambo AI! 🎉**
