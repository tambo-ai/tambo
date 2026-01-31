# Tambo Event Starter

A starter template for building AI-powered event websites with Tambo. Features a conversational chat interface that dynamically renders UI components for event information.

![Template Screenshot](screenshot.png)

## Demo Video

<!-- Add your demo video link here -->
[Watch Demo Video](YOUR_DEMO_VIDEO_URL)

## What's Included

- **Next.js 15** - React framework with App Router
- **Tambo AI** - Generative UI for chat-based interactions
- **TypeScript** - Full type safety with Zod schemas
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations

## Features

- Conversational AI assistant for event information
- 10+ pre-built event components (schedule, speakers, tickets, etc.)
- Dynamic component rendering based on user queries
- Streaming responses with real-time updates
- Mobile-responsive design

## Prerequisites

- Node.js 18+
- Tambo AI API key ([get one here](https://tambo.ai))

## Setup

1. **Clone and install**

```bash
cd community/templates/tambo-event-starter
npm install
```

2. **Configure environment**

```bash
cp .env.example .env.local
```

Add your Tambo API key to `.env.local`:

```
NEXT_PUBLIC_TAMBO_API_KEY=your_api_key_here
```

3. **Start development server**

```bash
npm run dev
```

4. **Open** [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js App Router
├── components/
│   ├── chat/               # Chat interface
│   ├── tambo/              # Tambo-registered components
│   └── ui/                 # Base UI components
├── lib/
│   ├── mock-data/          # Sample event data
│   └── tambo/              # Component & tool registrations
├── providers/              # Tambo context provider
└── types/                  # TypeScript types & Zod schemas
```

## Tambo Integration

This template demonstrates:

- **Component Registration** - 10+ components with Zod schemas
- **Tool Definitions** - Data fetching tools using `defineTool`
- **Context Helpers** - Event-specific context for the AI
- **Streaming** - Real-time component rendering

### Example Queries

Try asking the AI assistant:
- "Who are the speakers?"
- "Show me the schedule"
- "What tickets are available?"
- "Where is the venue?"

## Customization

Replace the mock data in `src/lib/mock-data/index.ts` with your actual event information.

### Google Maps Integration

The VenueMap component includes a placeholder for Google Maps. To enable it:
1. Get a Google Maps Embed API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Replace `YOUR_API_KEY` in `src/components/tambo/VenueMap.tsx`

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run lint      # Run ESLint
```

## License

MIT
