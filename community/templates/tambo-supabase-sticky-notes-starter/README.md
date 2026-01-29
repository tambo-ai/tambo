# Tambo + Supabase Sticky Notes

Sticky notes app with natural language CRUD operations powered by Tambo AI and Supabase.

Create, update, and delete sticky notes using conversational AI. Demonstrates Tambo + Supabase integration with Drizzle ORM.

## Features

- Natural language CRUD operations
- Tambo AI component registration
- Supabase database integration
- Drizzle ORM for type-safe schemas
- Real-time updates across clients
- Mobile responsive design

## Demo

![Tambo Supabase Sticky Notes Interface](./public/interface.png)
![Tambo Supabase Sticky Notes Dashboard](./public/sticky-notes.png)

 **Video Demo**: [Watch the Tambo AI interaction](https://github.com/user-attachments/assets/e243f48d-97ce-40af-9631-389e375667a8)

## Get Started

1. Clone and install:

   ```bash
   git clone https://github.com/tambo-ai/tambo-supabase-sticky-notes-starter.git
   cd tambo-supabase-sticky-notes-starter
   npm install
   ```

2. Set up environment:

   ```bash
   cp example.env.local .env.local
   ```

   ```env
   VITE_TAMBO_API_KEY=your_tambo_api_key_here
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project.supabase.co:5432/postgres
   ```

3. Set up database:

   ```bash
   npm run db:push
   ```

   Run in Supabase SQL Editor:

   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE notes;
   ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Public access" ON notes FOR ALL USING (true) WITH CHECK (true);
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

   Open [localhost:5173](http://localhost:5173)

## App structure at a glance

- **Vite + React app**: Main app in `src/App.tsx`.
  - Chat interface on the left (mobile: toggleable view).
  - Canvas with draggable sticky notes on the right.

- **Component registration and chat wiring**: See `src/lib/tambo.ts` and `src/App.tsx`.

- **AI components (created by chat)**: Components the AI can instantiate:
  - `src/components/ui/create-note.tsx`: Create notes with natural language.
  - `src/components/ui/update-note.tsx`: Update note content or color.
  - `src/components/ui/delete-note.tsx`: Delete notes by ID or reference.

- **Draggable note component**: `src/interactables/components/StickyNote.tsx` handles drag-and-drop with real-time position sync.

- **Database setup**:
  - Schema in `src/db/schema.ts` (Drizzle ORM).

- **Component registration**: `src/lib/tambo.ts` - Register AI components with Zod schemas.

- **AI components**: Generate notes from natural language.
  - `src/components/ui/create-note.tsx`
  - `src/components/ui/update-note.tsx`
  - `src/components/ui/delete-note.tsx`

- **Database**:
  - `src/db/schema.ts` - Drizzle ORM schema.
  - `src/lib/supabase.ts` - Supabase client for CRUD and real-time.

### Change database schema

Update `src/db/schema.ts` and run `npm run db:push`.

---

**Built with**: React 19 • TypeScript • Vite • Tambo AI • Supabase • Drizzle ORM • Tailwind CSS


LICENSE: MIT
