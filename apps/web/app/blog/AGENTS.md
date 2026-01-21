# Blog AGENTS.md

This file provides detailed guidance for AI agents working with the Tambo blog system.

## Technology Stack

**MDX Processing:**

- **Nextra v4.6.0** - Primary MDX framework that handles blog post compilation and metadata extraction
- **remark-mdx-frontmatter** - Exports frontmatter as JavaScript variables (NEWLY ADDED)
- **rehype-pretty-code** - Syntax highlighting (currently configured, may have issues)
- **rehype-katex** - Math equation rendering
- **remark-gfm** - GitHub Flavored Markdown support
- **@theguild/remark-mermaid** - Diagram support

**Frontend:**

- Next.js 15 App Router
- React 18
- Tailwind CSS with @tailwindcss/typography
- Client-side filtering/sorting (BlogPage is "use client")

**Configuration:**

- MDX config in `next.config.mjs` (lines 144-165)
- Syntax highlighting theme: github-light/dark
- keepBackground: false (custom styling required)

## File Structure

```
apps/web/app/blog/
├── layout.tsx                    # Blog layout with header/footer
├── page.tsx                      # Blog list page (server component)
├── posts/
│   ├── tambo-hack/page.mdx
│   ├── tambo-with-tambo/page.mdx
│   ├── mcp-sampling-support/page.mdx
│   └── ai-powered-spreadsheet/page.mdx  # UPDATED: Uses new frontmatter pattern
├── CLAUDE.md                     # Pointer file
├── AGENTS.md                     # This file
└── IMPLEMENTATION_PLAN.md        # Detailed implementation notes

apps/web/components/blog/
├── blog-page.tsx                 # Client component with search/filter/sort
├── blog-post.tsx                 # Individual post wrapper (UPDATED)
├── blog-post-wrapper.tsx         # NEW: Auto-inject frontmatter
├── blog-header.tsx
├── list/
│   ├── blog-filters.tsx          # Category filters
│   ├── blog-search.tsx           # Search input
│   └── blog-sort.tsx             # Sort dropdown
└── shared/
    ├── blog-card.tsx             # Post card component
    ├── blog-badge.tsx            # Category badge
    └── featured-post-card.tsx    # Featured post display

apps/web/lib/blog/
├── constants.ts                  # GRADIENTS, CATEGORY_COLORS, CATEGORY_DISPLAY_MAP
├── types.ts                      # BlogCategory, BlogPostListItem, etc.
├── defaults.ts                   # DEFAULT author and authorImage
└── get-posts.ts                  # Uses Nextra's getPageMap() API
```

## How Blog Posts Work

### Post Discovery

1. Nextra scans `app/blog/posts/` directory
2. `getPageMap("/blog/posts")` in `lib/get-posts.ts` returns all posts
3. `normalizePages()` extracts frontmatter and metadata
4. Posts rendered via `app/blog/page.tsx` calling `BlogPage` component

### Frontmatter Pattern (NEW - RECOMMENDED)

**Using Automatic Frontmatter Injection:**

```mdx
---
title: "Post Title"
date: "October 30, 2025"
description: "Brief description"
author: "Author Name"
---

import { BlogPostWithFrontmatter as BlogPost } from "@/components/blog/blog-post-wrapper";

export default function Layout(props) {
  return <BlogPost meta={frontmatter}>{props.children}</BlogPost>;
}

Your content here...
```

**Old Pattern (Still Supported):**

```mdx
---
title: "Post Title"
date: "2025-10-30"
description: "Brief description"
author: "Author Name"
---

<BlogPost title="Post Title" author="Author Name" date="October 30, 2025">

Your content here...

</BlogPost>
```

### How Automatic Frontmatter Works

1. **remark-mdx-frontmatter** plugin (configured in `next.config.mjs`) parses YAML frontmatter
2. Plugin exports it as: `export const frontmatter = { title: "...", ... }`
3. The exported `frontmatter` variable is available throughout the MDX file
4. Layout function accesses `frontmatter` and passes it to wrapper component
5. `BlogPostWithFrontmatter` receives frontmatter via `meta` prop
6. Wrapper passes it to `BlogPost` component which renders title, author, date

### MDX Components

Custom components available in MDX via `mdx-components.tsx`:

- `<BlogPost>` - Wraps post content with layout, breadcrumbs, title, author/date
- `<ImageZoom>` - Zoomable images
- Standard HTML elements with custom Tailwind styling

## Current Issues

### 1. Code Syntax Highlighting Not Working

Despite `rehype-pretty-code` being configured, code blocks may lack highlighting. Possible causes:

- Styling not applied (keepBackground: false requires custom CSS)
- Theme not loading correctly
- MDX components not rendering code blocks properly

### 2. Over-Engineering for 3 Posts

- Complex search/filter/sort functionality unnecessary
- Client-side state management adds overhead
- Post count calculations per category overkill

### 3. Performance Issues

- `/public/tambo-bg.png` is 563KB (used on every card)
- Background images use CSS instead of Next.js Image component
- Entire BlogPage is "use client" just for filters

## Best Practices

### Adding New Posts

1. Create new directory: `app/blog/posts/{slug}/`
2. Add `page.mdx` with frontmatter
3. Use new pattern with layout function (see above)
4. Images go in `/public/` or alongside MDX file
5. Use code blocks with language: ``tsx` or ``bash`

### Code Blocks

Use fenced code blocks with language identifier:

````markdown
```tsx
export function Example() {
  return <div>Hello</div>;
}
```
````

### Styling

- Tailwind utilities for layout
- Custom MDX component styling in `mdx-components.tsx`
- Code block styling should be in global CSS (if keepBackground: false)

## Recent Changes (October 2025)

### ✅ Automatic Frontmatter Injection

**What Changed:**

- Installed `remark-mdx-frontmatter` plugin
- Updated `next.config.mjs` to use the plugin
- Updated `BlogPost` component to accept `frontmatter` prop
- Created `BlogPostWithFrontmatter` wrapper component
- Migrated `ai-powered-spreadsheet/page.mdx` to new pattern

**Why:**

- Eliminates duplication of title, author, date between frontmatter and component props
- Follows DRY principle - define metadata once
- Reduces maintenance burden and potential for inconsistencies

**Migration Status:**

- ✅ `ai-powered-spreadsheet/page.mdx` - Uses new pattern
- ⏳ `tambo-hack/page.mdx` - Can be migrated
- ⏳ `tambo-with-tambo/page.mdx` - Can be migrated
- ⏳ `mcp-sampling-support/page.mdx` - Can be migrated

## Known Dependencies

- `nextra` - v4.6.0
- `remark-mdx-frontmatter` - v4.0.0+ (newly added)
- `rehype-pretty-code` - Syntax highlighting
- `rehype-katex` - Math rendering
- `remark-gfm` - GitHub Flavored Markdown

## Development Commands

```bash
npm run dev              # Start dev server (localhost:8260)
npm run build            # Build for production
npm run lint             # Check code quality
npm run check-types      # TypeScript type checking
```

## Related Files

- `/apps/web/next.config.mjs` - Nextra and rehype plugin configuration
- `/apps/web/mdx-components.tsx` - Custom MDX component definitions
- `/apps/web/components/blog/blog-post.tsx` - Main blog post wrapper
- `/apps/web/components/blog/blog-post-wrapper.tsx` - Frontmatter injection wrapper (NEW)
- `/apps/web/styles/globals.css` - Global styles (check for code block CSS)
- `/apps/web/app/blog/IMPLEMENTATION_PLAN.md` - Detailed technical documentation
