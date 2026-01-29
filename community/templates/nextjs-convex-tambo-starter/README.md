# Next.js + Convex + Tambo Starter

A premium, real-time AI-powered starter template for building intelligent SaaS applications.

## What's Included

- **Next.js 15 (App Router)** - The latest React framework for production-grade apps.
- **Convex** - A real-time database and backend with optimistic updates and native vector search support.
- **Tambo AI** - An AI-native UI toolkit for building conversational interfaces.
- **Tailwind CSS + Framer Motion** - For a premium, smooth, and modern look.
- **Lucide React** - Beautiful icons for your UI.

## Features

- **Real-time Synchronization**: Changes made by the AI are instantly reflected in the UI across all clients.
- **AI Lead Management**: A built-in example demonstrating how the AI can interact with your database using tools.
- **Premium Design**: Dark mode by default, glassmorphism, and smooth animations.

## Prerequisites

- **Tambo API Key**: Get it from [tambo.ai](https://tambo.ai).
- **Convex Deployment**: Create a free project at [convex.dev](https://convex.dev).

## Setup Instructions

1. **Clone the repository** (or use this template).
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Set up environment variables**:
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_TAMBO_API_KEY=your_tambo_key
   CONVEX_DEPLOYMENT=your_convex_deployment
   NEXT_PUBLIC_CONVEX_URL=your_convex_url
   ```
4. **Start the development server**:
   ```bash
   npm run dev
   ```
5. **Start Convex**:
   ```bash
   npx convex dev
   ```

## Tambo Integration

This template demonstrates a deep integration between Tambo AI and a real-time database (Convex).

- **Tool Registration**: Located in `src/components/tambo/LeadManagerTools.ts`. The AI has tools to `addLead` and `updateLeadStatus`, which are directly wired to Convex mutations.
- **Real-time UI**: The `LeadList` component uses Convex's `useQuery` hook to show live updates as the AI modifies the database. Changes are reflected instantly without page reloads.

## Screenshot

<img width="1366" height="641" alt="scrnli_bHU66wVO7wLH4r" src="https://github.com/user-attachments/assets/63011927-58de-4d5a-8a77-71fbd11e52c4" />

## Video Demo

[Link to Video Demo](https://github.com/user-attachments/assets/c4b20ef7-54d4-41d1-8bb5-ea2c0436734c)
