# Tambo Hono CRM Template

A complete CRM template built with Hono API, Drizzle ORM, better-sqlite3, and Tambo generative UI.

## Features

- **Database**: SQLite with Drizzle ORM
- **API**: Hono framework with type-safe routes
- **Validation**: Zod schemas for all inputs
- **TypeScript**: Strict configuration with no `any` types
- **Generative UI**: ContactCard component with Tambo state management
- **Styling**: Tailwind CSS with Lucide icons and glassmorphism design
- **AI Assistant**: CRM-focused system prompt with tool integration

## Components

### ContactCard

A professional, minimalist CRM card component that displays:

- Contact name with user icon
- Email address with mail icon
- Company (optional) with building icon
- Notes (optional) with file text icon

The component uses Tambo's streaming props for live updates as the AI generates content.

## Tools

### add_contact

An AI tool that saves new contacts to the database:

- Extracts contact details from natural language
- Validates input with Zod schemas
- Makes API calls to store contacts
- Provides success/error feedback

## AI System

The CRM assistant is configured with a specialized system prompt that:

- Focuses on contact management tasks
- Automatically uses the add_contact tool when users provide contact details
- Always renders ContactCard components to confirm successful operations

## API Endpoints

- `GET /api/contacts` - Fetch all contacts
- `POST /api/contacts` - Create a new contact

## Database Schema

```typescript
contacts {
  id: number (auto-increment)
  name: string (required)
  email: string (required)
  company: string (optional)
  notes: string (optional)
}
```

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
