# AI Content Studio

A minimal **Next.js + Tambo + Sanity** template for AI-powered content management.

![AI Content Studio Screenshot](screenshot.png)

## What It Does

Manage your Sanity CMS content through natural language conversations. This template demonstrates how to integrate Tambo's generative UI with a headless CMS to create, view, and update content via chat.

## Video Demo

[Watch the demo](VIDEO_LINK_HERE)

## Prerequisites

- **Node.js 18+**
- **Tambo Account**: Get your free API key at [tambo.co/dashboard](https://tambo.co/dashboard)
- **Sanity Account**: Create a project at [sanity.io/manage](https://sanity.io/manage) and get a **Viewer** or **Editor** token

## Setup

1. **Clone the repository:**

   ```bash
   npx create-next-app -e https://github.com/tambo-ai/tambo-template/tree/main/community/templates/sanity-content-studio my-app
   cd my-app
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure Environment:**

   ```bash
   cp example.env.local .env.local
   ```

   Add your keys to `.env.local`:

   ```env
   NEXT_PUBLIC_TAMBO_API_KEY=your_tambo_api_key
   NEXT_PUBLIC_SANITY_PROJECT_ID=your_sanity_project_id
   NEXT_PUBLIC_SANITY_DATASET=production
   SANITY_API_TOKEN=your_sanity_write_token
   NEXT_PUBLIC_SANITY_STUDIO_URL=https://your-studio-url.sanity.studio
   ```

4. **Run the Development Server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to see the app.

## What's Included

- **Next.js 15**: App Router and Server Actions
- **Tambo SDK**: Generative UI and AI Chat
- **Sanity Client**: Headless CMS integration
- **Tailwind CSS 4**: Styling and Typography

## Tambo Integration

We strictly use Tambo's official APIs for tool calling and component rendering.

- **Tools Config**: `src/lib/tambo.ts` - Registers `fetchArticles`, `createArticle`, and `updateArticle` tools.
- **Components**: `src/components/tambo/` - Custom UI components (`ArticleCard`, `ArticleList`) registered for AI use.
- **Provider**: `src/app/page.tsx` - Wraps the app with `TamboThreadProvider`.

## License

MIT
