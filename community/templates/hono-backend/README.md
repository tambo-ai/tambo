# Hono Backend Template

A comprehensive template demonstrating how to integrate Tambo AI with a Hono backend API. Shows the complete pattern for connecting AI-powered tools to any backend service through type-safe, well-structured tool definitions.

## Video Demo

**Watch the demo**: https://youtu.be/nUG0nhBf3bc

This video demonstrates the AI interacting with the Hono backend API through Tambo tools, showing bookmark creation, retrieval, updates, and deletion via natural language.

## What This Template Demonstrates

This template shows the **backend integration pattern** for connecting Tambo with Hono APIs. It demonstrates how to structure tools that call backend endpoints, handle responses, manage errors, and maintain type safety across the full stack.

**Core Integration Patterns:**

- **Tool-to-Backend API calls** - How to structure Tambo tools that call Hono endpoints
- **Type-safe tool definitions** - Using Zod schemas for input/output validation
- **Database integration** - SQLite database with prepared statements
- **Middleware architecture** - Logger, error handler, and CORS configuration
- **Error handling** - Proper error propagation from backend to AI
- **Component rendering** - Displaying backend data through generative components
- **Full CRUD workflow** - Complete create, read, update, delete operations via AI
- **Voice input** - Speech-to-text with DictationButton component

This pattern is reusable for any backend API — swap out the data model and endpoints to integrate with your own services.

## Prerequisites

- **Node.js 22+** and **npm 11+**
- **Tambo API Key** - Get yours free from [https://tambo.co/dashboard](https://tambo.co/dashboard)

## Setup Instructions

1. **Clone or download this template:**

   ```bash
   # If using from the tambo repository
   cd tambo/community/templates/hono-backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   npm run setup
   ```

   This installs root dependencies first, then backend and frontend dependencies.

3. **Configure environment variables:**

   **Backend** (create `backend/.env`):

   ```bash
   cp backend/example.env backend/.env
   # Edit backend/.env if you need to change the port (default: 3001)
   ```

   **Frontend** (create `frontend/.env`):

   ```bash
   cp frontend/example.env frontend/.env
   # Edit frontend/.env and add your Tambo API key:
   # VITE_TAMBO_API_KEY=your-api-key-here
   ```

4. **Start development servers:**

   ```bash
   npm run dev
   ```

   This will start both:
   - Backend server on [http://localhost:3001](http://localhost:3001)
   - Frontend dev server on [http://localhost:5173](http://localhost:5173)

5. **Open your browser:**

   Navigate to [http://localhost:5173](http://localhost:5173) and start chatting!

## What's Included

### Backend (Hono + SQLite)

- **Hono** - Ultra-fast, lightweight web framework for building APIs
- **better-sqlite3** - Embedded SQL database with prepared statements
- **RESTful API** - Example CRUD endpoints demonstrating the integration pattern
- **Middleware Stack**:
  - Custom logger for request logging
  - Global error handler
  - CORS configuration
- **TypeScript** - Full type safety across the backend
- **Proper validation** - Input validation with clear error messages

### Frontend (Vite + React + Tambo)

- **Vite** - Fast build tool and dev server with HMR
- **React 18** - Modern React with hooks
- **Tambo AI SDK** - AI-powered component generation and tool execution
- **Voice Input** - DictationButton using `useTamboVoice` hook
- **Zod** - Runtime schema validation for tools and components
- **Tailwind CSS v4** - Utility-first styling with dark mode support

### Tambo Integration

- **4 Tools** - Demonstrating GET, POST, PUT, DELETE operations calling backend APIs:
  - `getBookmarks` - Fetch all bookmarks
  - `createBookmark` - Create a new bookmark
  - `updateBookmark` - Update an existing bookmark
  - `deleteBookmark` - Delete a bookmark by ID

- **2 Components** - Showing different rendering patterns:
  - `BookmarkList` - Displays bookmarks in a responsive card grid
  - `StatsCard` - Shows statistics with optional percentage change and variants

- **Modern UI** - Full-screen responsive chat interface with:
  - Clean message bubbles
  - Loading states with animated typing indicator
  - Voice input button
  - Responsive design

## Usage Examples

Try these commands to see the backend integration in action:

**Create bookmarks:**

- "Create a bookmark for https://hono.dev with description 'Fast web framework'"
- "Add a bookmark for React docs at https://react.dev with tags 'frontend' and 'library'"

**Retrieve bookmarks:**

- "Show me all bookmarks"
- "List all my saved bookmarks"

**Update bookmarks:**

- "Update the Hono bookmark to add tag 'framework'"
- "Change the description of the React bookmark"

**Delete bookmarks:**

- "Delete the bookmark with URL https://example.com"
- "Remove the Hono bookmark"

**Stats (example):**

- "Show me a stat card with title 'Total Bookmarks', value 42, and +12% change"

## Project Structure

```
hono-backend/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Hono server entry point with middleware
│   │   ├── db/
│   │   │   └── database.ts       # SQLite setup with prepared statements
│   │   ├── middleware/
│   │   │   ├── logger.ts         # Request logging middleware
│   │   │   └── error-handler.ts  # Global error handler
│   │   ├── routes/
│   │   │   └── bookmarks.ts      # CRUD API routes
│   │   └── types.ts              # Shared TypeScript types
│   ├── package.json
│   ├── tsconfig.json
│   └── example.env               # Environment template
├── frontend/
│   ├── src/
│   │   ├── App.tsx               # TamboProvider setup with components
│   │   ├── main.tsx              # React entry point
│   │   ├── index.css             # Tailwind + theme variables
│   │   ├── lib/
│   │   │   └── tambo.ts          # Tool definitions calling backend
│   │   └── components/
│   │       ├── Chat.tsx          # Chat interface with voice input
│   │       └── tambo/
│   │           ├── BookmarkList.tsx  # Bookmark grid component
│   │           ├── StatsCard.tsx     # Stat display component
│   │           └── DictationButton.tsx # Voice input button
│   ├── vite.config.ts            # Vite with API proxy to backend
│   ├── tailwind.config.ts        # Tailwind configuration
│   ├── package.json
│   └── example.env               # Environment template
├── package.json                  # Root package with concurrent scripts
├── README.md
└── CLAUDE.md                     # Guidance for Claude Code
```

## Development

**Run both servers:**

```bash
npm run dev
```

**Run individually:**

```bash
npm run dev:backend   # Backend only on port 3001
npm run dev:frontend  # Frontend only on port 5173
```

**Build for production:**

```bash
npm run build         # Builds both
npm run build:backend # Backend only
npm run build:frontend # Frontend only
```

## Architecture Deep Dive

### Backend Flow

1. **HTTP Request** arrives at the Hono server
2. **Middleware chain** executes:
   - Error handler wrapper
   - Logger logs request
   - CORS checks origin
3. **Route handler** processes request:
   - Validates input
   - Queries database with prepared statements
   - Returns JSON response
4. **Logger** logs response status and time
5. **Response** sent to frontend

### Frontend Tool Flow

1. **User** types message or uses voice input
2. **Tambo AI** analyzes intent and selects appropriate tool
3. **Tool function** executes:
   - Builds HTTP request to backend
   - Handles response or error
   - Returns structured data
4. **Tambo** renders component with returned data
5. **User** sees result in chat

### Database Pattern

This template uses **better-sqlite3** with an in-memory database for demonstration. For production:

```typescript
// Change in backend/src/db/database.ts
const db = new Database(join(process.cwd(), "data", "database.sqlite"));
```

Prepared statements provide:

- **Performance** - Statements are compiled once
- **Security** - Protection against SQL injection
- **Type safety** - TypeScript types for queries

## Customization Guide

### Adding a New Tool

1. **Create backend route** in `backend/src/routes/`:

   ```typescript
   export const myRouter = new Hono().get("/", (c) => c.json({ items: [] }));
   ```

2. **Register route** in `backend/src/index.ts`:

   ```typescript
   app.route("/api/my-items", myRouter);
   ```

3. **Create frontend tool** in `frontend/src/lib/tambo.ts`:
   ```typescript
   defineTool({
     name: "getMyItems",
     description: "Fetches items from backend",
     tool: async () => {
       const response = await fetch("/api/my-items");
       if (!response.ok) throw new Error("Failed to fetch");
       return await response.json();
     },
     inputSchema: z.object({}),
     outputSchema: z.object({ items: z.array(z.any()) }),
   });
   ```

### Adding a New Component

1. **Create component** in `frontend/src/components/tambo/`:

   ```typescript
   export const MyComponent = ({ data }: Props) => {
     return <div>{/* render data */}</div>;
   };

   export const MyComponentSchema = z.object({
     data: z.array(z.string()),
   });
   ```

2. **Register in App.tsx**:
   ```typescript
   const components = [
     // ...existing
     {
       name: "MyComponent",
       description: "Displays data in a custom format",
       component: MyComponent,
       propsSchema: MyComponentSchema,
     },
   ];
   ```

### Switching to PostgreSQL or MySQL

Replace `better-sqlite3` with your preferred database:

```bash
cd backend
npm install pg  # or mysql2
```

Update `backend/src/db/database.ts` with your connection logic.

## Troubleshooting

### Backend won't start

- **Check port 3001 is available**: `lsof -i :3001`
- **Verify Node.js version**: `node -v` (should be 22+)
- **Check for TypeScript errors**: `cd backend && npm run build`

### Frontend can't reach backend

- **Verify backend is running**: Check [http://localhost:3001/health](http://localhost:3001/health)
- **Check Vite proxy config** in `frontend/vite.config.ts`:
  ```typescript
  proxy: {
    "/api": {
      target: "http://localhost:3001",
      changeOrigin: true,
    },
  }
  ```
- **Inspect browser console** for CORS or network errors

### Tools not working

- **Check browser console** for errors
- **Verify tool schemas** match backend response format
- **Test backend endpoint directly**:
  ```bash
  curl http://localhost:3001/api/bookmarks
  ```
- **Check Tambo API key** is set correctly in `frontend/.env`

### Database not persisting

- The template uses an **in-memory database** by default
- To persist data, update `backend/src/db/database.ts`:
  ```typescript
  const db = new Database(join(process.cwd(), "data", "database.sqlite"));
  ```
- Create `backend/data/` directory: `mkdir -p backend/data`

### Voice input not working

- **Check browser support**: Voice input requires a modern browser
- **Verify HTTPS or localhost**: Speech APIs require secure context
- **Check microphone permissions**: Browser must have microphone access

## Deployment

### Option 1: Deploy Together (Monorepo)

Build both and serve from single server:

```bash
npm run build
# Serve frontend static files from backend
# Configure backend to serve frontend/dist/
```

### Option 2: Deploy Separately

**Backend** (Railway, Fly.io, or any Node.js host):

```bash
cd backend
npm run build
npm start
# Set environment variables (BACKEND_PORT, etc.)
```

**Frontend** (Vercel, Netlify, or any static host):

```bash
cd frontend
npm run build
# Deploy frontend/dist/
# Set VITE_TAMBO_API_KEY
# Update API URLs to production backend
```

**Important**: Update CORS origins in `backend/src/index.ts` for production domains.

## Learn More

- **[Tambo Documentation](https://docs.tambo.co)** - Complete Tambo AI guide
- **[Hono Documentation](https://hono.dev)** - Hono web framework docs
- **[Vite Documentation](https://vitejs.dev)** - Vite build tool
- **[better-sqlite3](https://github.com/WiseLibs/better-sqlite3)** - SQLite for Node.js

## Contributing

Found a bug or want to improve this template? Open an issue or PR in the main Tambo repository!

## License

MIT - feel free to use this template for your own projects.
