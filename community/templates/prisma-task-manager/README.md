📌 Prisma Task Manager (Tambo Starter Template)

A minimal starter template demonstrating how to use Tambo with Prisma to build AI-powered applications where natural language can create and fetch database records and render React components.

This template connects:

🧠 Tambo tools

🗄️ Prisma ORM (SQLite)

🔌 API routes

🧩 AI-driven component rendering

into a clean, production-style setup.

✨ What This Template Demonstrates

Registering Tambo tools that read and write to a database

Using Prisma with SQLite for persistence

Returning structured data from tools

Rendering React components from AI responses

Building a simple chat interface using Tambo hooks

🖼 Screenshot
<img width="1920" height="991" alt="FireShot Capture 031 -  -  localhost" src="https://github.com/user-attachments/assets/e3c4b76c-590d-4e14-b364-3ab85db90ac7" />
<img width="1920" height="991" alt="FireShot Capture 032 -  -  localhost" src="https://github.com/user-attachments/assets/52d4669a-1409-4f64-b3ad-8b2e6aba3144" />



🎥 Video Demo


https://github.com/user-attachments/assets/4cf82124-dc12-4836-9068-ff45bb7b1c15



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
1️⃣ Install dependencies
npm install

2️⃣ Create environment file
cp .env.example .env.local

3️⃣ Add your keys in .env.local
NEXT_PUBLIC_TAMBO_API_KEY=your_key_here
DATABASE_URL="file:./dev.db"

4️⃣ Initialize database
npx prisma migrate dev

5️⃣ Start dev server
npm run dev

6️⃣ Open in browser
http://localhost:3000

🧪 Try It

In the chat, type:

Add task Buy milk
Show my tasks


You should see tasks rendered as a UI component.

📁 Project Structure
src/
  app/
    page.tsx              # Landing page
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

This template provides a minimal reference for building database-backed AI applications using Tambo without extra complexity or multiple integrations.

It is intended as a starting point that can be easily adapted for:

Different schemas

Additional models

Other CRUD-style AI workflows

✅ .env.example

Create a file named:

.env.example


With the following contents:

NEXT_PUBLIC_TAMBO_API_KEY=
DATABASE_URL="file:./dev.db"
