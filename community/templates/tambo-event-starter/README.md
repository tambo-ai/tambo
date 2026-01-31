# Tambo Event Starter# AI Event Website TemplateThis is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).



A starter template for building AI-powered event websites with Tambo. Features a conversational chat interface that dynamically renders UI components for event information.



![Template Screenshot](screenshot.png)A production-ready event website template powered by Tambo AI for dynamic, conversational user experiences.## Getting Started



## Demo Video



<!-- Add your demo video link here -->## Quick StartFirst, run the development server:

[Watch Demo Video](YOUR_DEMO_VIDEO_URL)



## What's Included

```bash```bash

- **Next.js 15** - React framework with App Router

- **Tambo AI** - Generative UI for chat-based interactions# Install dependenciesnpm run dev

- **TypeScript** - Full type safety with Zod schemas

- **Tailwind CSS** - Utility-first stylingnpm install# or

- **Framer Motion** - Smooth animations

yarn dev

## Features

# Add your Tambo API key to .env.local# or

- Conversational AI assistant for event information

- 10+ pre-built event components (schedule, speakers, tickets, etc.)echo "NEXT_PUBLIC_TAMBO_API_KEY=your_key_here" > .env.localpnpm dev

- Dynamic component rendering based on user queries

- Streaming responses with real-time updates# or

- Mobile-responsive design

# Start the development serverbun dev

## Prerequisites

npm run dev```

- Node.js 18+

- Tambo AI API key ([get one here](https://tambo.ai))```



## SetupOpen [http://localhost:3000](http://localhost:3000) with your browser to see the result.



1. **Clone and install**Open [http://localhost:3000](http://localhost:3000) to view the website.

   ```bash

   cd community/templates/tambo-event-starterYou can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

   npm install

   ```## Documentation



2. **Configure environment**This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

   ```bash

   cp .env.example .env.localSee the [docs folder](./docs/README.md) for complete documentation including:

   ```

   ## Learn More

   Add your Tambo API key to `.env.local`:

   ```- Setup instructions

   NEXT_PUBLIC_TAMBO_API_KEY=your_api_key_here

   ```- Customization guideTo learn more about Next.js, take a look at the following resources:



3. **Start development server**- Component reference

   ```bash

   npm run dev- Deployment options- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.

   ```

- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

4. **Open** [http://localhost:3000](http://localhost:3000)

## Features

## Project Structure

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

```

src/- AI-powered chat interface for event information

├── app/                    # Next.js App Router

├── components/- Dynamic UI component rendering## Deploy on Vercel

│   ├── chat/               # Chat interface

│   ├── tambo/              # Tambo-registered components- Pre-built event components (schedule, speakers, tickets, etc.)

│   └── ui/                 # Base UI components

├── lib/- Modern stack: Next.js 15, TypeScript, Tailwind CSSThe easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

│   ├── mock-data/          # Sample event data

│   └── tambo/              # Component & tool registrations

├── providers/              # Tambo context provider

└── types/                  # TypeScript types & Zod schemas## LicenseCheck out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

```



## Tambo IntegrationMIT


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

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run lint      # Run ESLint
npm run typecheck # Run TypeScript check
```

## License

MIT
