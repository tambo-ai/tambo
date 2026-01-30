# Tambo Hono CRM Template

A minimal CRM starter demonstrating Tambo AI integration with Hono API and MySQL database.

![Tambo Hono CRM Screenshot](screenshot.png)

## Video Demo

[Watch the demo video](demo-video-link-here) - Shows natural language contact management in action.

## What's Included

- **Tambo AI** - Natural language interface for contact management
- **Hono API** - Fast, lightweight backend API
- **MySQL + Drizzle ORM** - Type-safe database operations
- **Next.js 14** - React framework with App Router
- **TypeScript** - Full type safety
- **Tailwind CSS** - Utility-first styling

## Prerequisites

- Node.js 18+
- MySQL database
- [Tambo API key](https://tambo.co)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Setup MySQL database**

   ```sql
   CREATE DATABASE tambo_crm;
   USE tambo_crm;

   CREATE TABLE contacts (
     id INT AUTO_INCREMENT PRIMARY KEY,
     name VARCHAR(255) NOT NULL,
     email VARCHAR(255) NOT NULL,
     company VARCHAR(255),
     notes TEXT
   );
   ```

3. **Configure environment**

   ```bash
   cp .env.example .env.local
   ```

   Update `.env.local` with your credentials:

   ```
   NEXT_PUBLIC_TAMBO_API_KEY=your_tambo_api_key
   DATABASE_HOST=localhost
   DATABASE_USER=root
   DATABASE_PASSWORD=your_password
   DATABASE_NAME=tambo_crm
   ```

4. **Run the application**
   ```bash
   npm run dev
   ```

## Usage

Try these natural language commands:

- "Add John Doe from Microsoft with email john@microsoft.com"
- "Show me all contacts"
- "Find contacts from Tesla"
- "Update John's notes to say he's a VIP customer"

## Tambo Integration

This template demonstrates:

- **Tools** - Database operations via natural language
- **Components** - AI-generated contact displays
- **Real-time updates** - Instant database synchronization

The AI automatically selects the right component and executes the correct database operation based on user intent.
