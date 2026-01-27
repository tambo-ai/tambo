# Hono Backend Template

A template demonstrating how to integrate Tambo tools with a Hono backend API, showing the pattern for connecting any backend service to Tambo through AI-powered tools.

![Screenshot placeholder - Add your screenshot here]

## Video Demo

[Add video demo link here - upload to GitHub and link in PR description]

## What This Template Demonstrates

This template shows the **backend integration pattern** for connecting Tambo with Hono APIs. It demonstrates how to structure tools that call backend endpoints, handle responses, manage errors, and maintain type safety. The example uses a simple data model to focus on the integration pattern itself.

**Key Integration Patterns:**

- **Tool-to-Backend API calls** - How to structure Tambo tools that call Hono endpoints
- **Type-safe tool definitions** - Using Zod schemas for input/output validation
- **Error handling** - Proper error propagation from backend to AI
- **Component rendering** - Displaying backend data through generative components
- **Full CRUD workflow** - Complete create, read, update, delete operations via AI

This pattern is reusable for any backend API - swap out the data model and endpoints to integrate with your own services.

## Prerequisites

- **Node.js 22+** and **npm 11+**
- **Tambo API Key** - Get yours from [https://tambo.co](https://tambo.co)

## Setup Instructions

1. **Install dependencies:**

   ```bash
   npm install
   npm run setup
   ```

   This installs root dependencies first, then backend and frontend dependencies.

2. **Configure environment:**

   Create a `.env` file in the `frontend/` directory with your Tambo API key:

   ```
   VITE_TAMBO_API_KEY=your-api-key-here
   ```

3. **Start development servers:**

   ```bash
   npm run dev
   ```

   This will start both the backend (port 3001) and frontend (port 5173) concurrently.

4. **Open your browser:**
   Navigate to [http://localhost:5173](http://localhost:5173)

## What's Included

### Backend (Hono)

- **Hono** - Fast, lightweight web framework for building APIs
- **RESTful API** - Example CRUD endpoints demonstrating the integration pattern
- **CORS** - Configured for frontend communication
- **TypeScript** - Full type safety across the stack

### Frontend (Vite + React)

- **Vite** - Fast build tool and dev server
- **React 18** - Modern React with hooks
- **Tambo** - AI-powered component generation and tool execution
- **Zod** - Schema validation for tools and components

### Tambo Integration Pattern

- **4 Tools** - Demonstrating GET, POST, PUT, DELETE operations calling backend APIs
- **1 Component** - BookmarkList component that renders backend data in a card grid
- **Dashboard UI** - Modern sidebar navigation and responsive chat interface

## Usage Examples

Try these commands to see the backend integration in action:

- "Create a bookmark for https://hono.dev with description 'Fast web framework'"
- "Show me all bookmarks"
- "Update the bookmark with title 'Hono' to add tag 'framework'"
- "Delete the bookmark with URL https://example.com"

## Project Structure

```
hono-backend/
├── backend/
│   ├── src/
│   │   ├── index.ts          # Hono server entry point
│   │   ├── routes/
│   │   │   └── bookmarks.ts  # Example API routes
│   │   └── types.ts          # Shared TypeScript types
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── lib/
│   │   │   └── tambo.ts      # Tambo tools calling backend APIs
│   │   ├── components/
│   │   │   ├── tambo/
│   │   │   │   └── BookmarkList.tsx  # Component rendering backend data
│   │   │   ├── Chat.tsx      # Chat interface
│   │   │   └── Sidebar.tsx   # Sidebar navigation
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
└── README.md
```

## Development

- **Backend only:** `npm run dev:backend`
- **Frontend only:** `npm run dev:frontend`
- **Build:** `npm run build`

## Learn More

- [Tambo Documentation](https://docs.tambo.co)
- [Hono Documentation](https://hono.dev)
- [Vite Documentation](https://vitejs.dev)
