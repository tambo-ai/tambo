# AI Content Studio

A minimal **Next.js + Tambo + Sanity** template for AI-powered content management.

![AI Content Studio Screenshot](screenshot.png)

## What It Does

Manage your Sanity CMS content through natural language conversations:

- **"Show me all articles"** → Displays a grid of your Sanity content
- **"Create an article about AI trends"** → Drafts and saves new content
- **"Show only drafts"** → Filters content by status

## Video Demo

[Watch the demo](VIDEO_LINK_HERE)

## Prerequisites

- Node.js 18+
- [Tambo API key](https://tambo.co/dashboard) (free)
- [Sanity project](https://sanity.io/manage) with API token

## Setup

1. Clone and install:

```bash
cd community/templates/sanity-content-studio
npm install
```

2. Copy environment variables:

```bash
cp example.env.local .env.local
```

3. Add your keys to `.env.local`:

```env
NEXT_PUBLIC_TAMBO_API_KEY=your-tambo-key
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your-write-token
```

4. Create the article schema in Sanity Studio:

```js
// In your Sanity schema
export default {
  name: 'article',
  title: 'Article',
  type: 'document',
  fields: [
    { name: 'title', type: 'string' },
    { name: 'slug', type: 'slug', options: { source: 'title' } },
    { name: 'excerpt', type: 'text' },
    { name: 'body', type: 'text' },
    { name: 'status', type: 'string', options: { list: ['draft', 'published'] } },
    { name: 'publishedAt', type: 'datetime' }
  ]
}
```

5. Start development:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## What's Included

| Technology | Purpose |
|------------|---------|
| **Next.js 15** | React framework |
| **Tambo AI** | Generative UI SDK |
| **Sanity** | Headless CMS |
| **Tailwind CSS 4** | Styling |

## Tambo Integration

### Components

- `ArticleCard` - Single article display
- `ArticleList` - Grid/list of articles
- `ContentPreview` - Rich markdown preview

### Tools

- `fetchArticles` - Query Sanity content
- `createArticle` - Create new drafts
- `updateArticle` - Update existing content

See `src/lib/tambo.ts` for the full configuration.

## License

MIT
