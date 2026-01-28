Prisma Task Manager (Tambo Template)

A minimal starter template demonstrating how to use Tambo with Prisma to build AI-powered apps where natural language can create and fetch database records and render React components.

This template connects:

Tambo tools

Prisma ORM (SQLite)

API routes

AI-driven component rendering

into a clean, production-style setup.

✨ What This Template Demonstrates

Registering Tambo tools that read/write to a database

Using Prisma with SQLite

Returning structured data from tools

Rendering React components from AI responses

Building a simple chat interface using Tambo hooks

🖼 Screenshot

Add a screenshot of the chat UI showing a task list rendered by Tambo.
(Drag screenshot into PR, copy the GitHub link, and paste here)

🎥 Video Demo

Add a short screen recording showing:

Opening the app

Adding a task via chat

Listing tasks
(Paste GitHub video link here)

🧰 Tech Stack

Next.js (App Router)

Tambo

Prisma ORM

SQLite

Tailwind CSS

📦 Prerequisites

Node.js 18.17+

A Tambo API key

⚙️ Setup

Install dependencies:

npm install


Create environment file:

cp .env.example .env.local


Add your keys in .env.local:

NEXT_PUBLIC_TAMBO_API_KEY=your_key_here
DATABASE_URL="file:./dev.db"


Initialize database:

npx prisma migrate dev


Start dev server:

npm run dev


Open:

http://localhost:3000

🧪 Try It

In chat, type:

Add task Buy milk
Show my tasks


You should see tasks rendered as a UI component.

📁 Project Structure
src/
  app/
    page.tsx            # Landing page
    chat/
      page.tsx
      ChatClient.tsx
      tools.ts
    api/
      tasks/
        route.ts
  components/
    tambo/
      TaskList.tsx
  lib/
    prisma.ts

prisma/
  schema.prisma

💡 Why This Template Exists

This template provides a minimal reference for building database-backed AI apps using Tambo, without extra complexity or multiple integrations.

It is intended as a starting point that can be easily adapted for other schemas, models, and use cases.

✅ .env.example

Create a file named:

.env.example


With:

NEXT_PUBLIC_TAMBO_API_KEY=
DATABASE_URL="file:./dev.db"


