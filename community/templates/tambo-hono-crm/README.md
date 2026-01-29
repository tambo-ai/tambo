# Tambo Hono CRM Template

A complete CRM template built with Hono API, Drizzle ORM, MySQL, and Tambo generative UI.

## Features

- **Database**: MySQL with Drizzle ORM
- **API**: Hono framework with type-safe routes
- **Validation**: Zod schemas for all inputs
- **TypeScript**: Strict configuration with no `any` types
- **Generative UI**: ContactCard component with Tambo state management
- **Styling**: Tailwind CSS with Lucide icons and glassmorphism design
- **AI Assistant**: CRM-focused system prompt with tool integration

## Setup

### 1. Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp example.env .env.local
```

Update the following variables:

- `NEXT_PUBLIC_TAMBO_API_KEY`: Your Tambo AI API key (get one from [tambo.co](https://tambo.co))
- `DATABASE_URL`: Your MySQL connection string

### 2. Database Setup

Ensure you have MySQL running with the credentials specified in your `.env.local` file. The application will automatically create the `contacts` table on startup.

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the CRM dashboard.

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

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
