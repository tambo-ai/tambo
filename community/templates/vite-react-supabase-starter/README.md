# Vite + React + Supabase Starter

A minimal starter template showcasing **Tambo AI's generative UI** with **Supabase** realtime database and **Drizzle ORM**.

## Features

- Natural language note creation, editing, and deletion
- Tambo AI component and tool registration
- Supabase realtime database sync
- Drizzle ORM for type-safe schemas
- Mobile responsive design
- Draggable sticky notes with canvas tabs

## Demo

![Tambo Supabase Sticky Notes Create](./public/create-note-tambo.png)
![Tambo Supabase Sticky Notes Delete](./public//deletion-tambo-note.png)

**Video Demo**: [Watch the Tambo AI interaction](https://github.com/user-attachments/assets/11575ce5-7ede-4270-9f4e-1698b86be3e4)

## Get Started

1. **Clone and install:**

   ```bash
   git clone https://github.com/tambo-ai/vite-react-supabase-starter.git
   cd vite-react-supabase-starter
   npm install
   ```

2. **Set up environment:**

   ```bash
   cp example.env.local .env.local
   ```

   ```env
   VITE_TAMBO_API_KEY=your_tambo_api_key
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:5432/postgres
   ```

3. **Set up database:**

   ```bash
   npm run db:push
   ```

   Then run in Supabase SQL Editor:

   ```sql
   ALTER TABLE sticky_notes ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Public access" ON sticky_notes FOR ALL USING (true) WITH CHECK (true);
   ALTER PUBLICATION supabase_realtime ADD TABLE sticky_notes;
   ```

4. **Start the app:**

   ```bash
   npm run dev
   ```

   Open [localhost:5173](http://localhost:5173)

## Supabase Integration

This template uses Supabase as a **hosted backend**, while remaining a **pure client-side (Vite + React) application with Tambo AI for Generative UI**.

### What Supabase is used for
- PostgreSQL database (notes storage)
- Realtime updates via WebSockets
- Row Level Security (RLS) for safe public access

### What Supabase is NOT used for
- Authentication (not included in this starter)
- File storage / images (not included)

The app communicates with Supabase using the official
`@supabase/supabase-js` client, which works over HTTP and WebSockets and is safe to use in the browser.

## Database & ORM Architecture

This project intentionally separates **schema management** from **runtime data access**.

### Drizzle ORM (Design Time)
Drizzle is used for:
- Defining the database schema in TypeScript
- Type-safe column definitions
- Pushing schema changes to Supabase (`npm run db:push`)

Drizzle does **not** run database queries in the browser.

### Supabase Client (Runtime)
All CRUD and realtime operations are handled via the Supabase client
- Realtime subscriptions for live updates

Direct PostgreSQL connections are not used because this is a client-side application and database credentials must never be exposed in the browser.


## Project Structure

```
src/
├── App.tsx                          # Main app with TamboProvider
├── components/ui/
│   └── components-canvas.tsx        # Canvas with draggable notes
├── interactables/components/
│   └── StickyNote.tsx               # Sticky note component
├── lib/
│   ├── tambo.ts                     # Component + tool registration
│   ├── canvas-storage.ts            # Zustand canvas store
│   ├── supabase.ts                  # Supabase client
│   └── use-supabase-notes.ts        # Realtime sync hook
└── db/
    └── schema.ts                    # Drizzle ORM schema
```

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/tambo.ts` | Register StickyNote component and CRUD tools |
| `src/interactables/components/StickyNote.tsx` | Sticky note with edit/delete actions |
| `src/db/schema.ts` | Drizzle schema for `sticky_notes` table |
| `src/lib/use-supabase-notes.ts` | Realtime subscription hook |

## Modify Schema

Update `src/db/schema.ts` and run:

```bash
npm run db:push
```

---

**Built with**: React 19 • TypeScript • Vite • Tambo AI • Supabase • Drizzle ORM • Tailwind CSS

LICENSE: MIT
