# Next.js + Tambo + Prisma Database Starter

AI-powered database operations with Tambo's intelligent chat interface and Prisma's type-safe database client.

## 🚀 Quick Start

```bash
npm install
cp .env.example .env.local
# Add your Tambo API key to .env.local
npm run db:push
npm run dev
```

Visit `http://localhost:3000` and start chatting with your database!

## 💬 Try These Prompts

- "Create a note called Ship Tambo template with content Ready to deploy"
- "Show all notes"
- "Add a note about meeting tomorrow with details Discuss project roadmap"

## 🛠 What's Included

- **[Next.js 14](https://nextjs.org/)** - React framework with App Router
- **[Tambo](https://tambo.co/)** - AI chat interface with tool integration
- **[Prisma](https://prisma.io/)** - Type-safe database client and ORM
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[TypeScript](https://typescriptlang.org/)** - Full type safety
- **[Zod](https://zod.dev/)** - Schema validation for Tambo tools

## 🗄️ Database Support

**Default (SQLite):**
```bash
npm run db:push
npm run dev
```

**PostgreSQL:**
```bash
# Update prisma/schema.prisma provider to "postgresql"
DATABASE_URL="postgresql://user:password@host:5432/database"
npx prisma migrate dev --name init
npm run dev
```

**MySQL:**
```bash
# Update prisma/schema.prisma provider to "mysql"  
DATABASE_URL="mysql://user:password@host:3306/database"
npx prisma migrate dev --name init
npm run dev
```

## 🏗️ Architecture

### Tambo Tools
- **createNote** - Creates new notes with title and content
- **listNotes** - Retrieves and displays all notes

### Database Schema
```prisma
model Note {
  id        String   @id @default(cuid())
  note      String   // Title
  content   String   // Content
  createdAt DateTime @default(now())
}
```

## 🎨 Design

Clean, responsive interface inspired by the [official Tambo template](https://github.com/tambo-ai/tambo-template) with:
- Neutral color palette
- Consistent spacing and typography
- Mobile-responsive layout
- Accessible design patterns

## 📚 Learn More

- [Tambo Documentation](https://docs.tambo.co)
- [Prisma Documentation](https://prisma.io/docs)
- [Official Tambo Template](https://github.com/tambo-ai/tambo-template)

---

**Built with ❤️ using [Tambo](https://tambo.co)**
