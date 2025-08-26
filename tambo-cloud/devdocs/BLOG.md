# Blog Development Guide

A comprehensive guide for developers adding blog posts to the Tambo website.

## How Does It Work?

The blog system uses **Nextra** with **MDX** to process blog posts at build time. Each blog post is an MDX file with frontmatter metadata that gets processed into React components.

```mdx title="example-blog-post.mdx"
---
title: "Your Blog Post Title"
date: "2025-01-15"
description: "A brief description of your post"
tags: ["tag1", "tag2"]
author: "Your Name"
category: "feature"
featured: false
---

<BlogPost title="Your Blog Post Title">Your content here...</BlogPost>
```

## Frontmatter Requirements

Every blog post **must** include these frontmatter fields:

### Required Fields

| Field   | Type     | Description                      | Example                 |
| ------- | -------- | -------------------------------- | ----------------------- |
| `title` | `string` | The main title of your blog post | `"New Feature Release"` |
| `date`  | `string` | Publication date in ISO format   | `"2025-01-15"`          |

### Optional Fields

| Field         | Type           | Description                          | Example                            |
| ------------- | -------------- | ------------------------------------ | ---------------------------------- |
| `description` | `string`       | Brief summary for SEO and previews   | `"Learn about our latest feature"` |
| `tags`        | `string[]`     | Array of relevant tags               | `["feature", "tutorial", "react"]` |
| `author`      | `string`       | Author's name                        | `"John Doe"`                       |
| `category`    | `BlogCategory` | Post category (see categories below) | `"feature"`                        |
| `featured`    | `boolean`      | Whether to feature this post         | `true`                             |

### Valid Categories

```typescript
type BlogCategory =
  | "new" // New features or announcements
  | "feature" // Feature releases or updates
  | "bug fix" // Bug fixes and patches
  | "update" // General updates
  | "event" // Events, hackathons, meetups
  | "tutorial" // How-to guides and tutorials
  | "announcement"; // Company announcements
```

## Blog Components

### Core Components

#### `<BlogPost>`

The main wrapper component for all blog posts. **Always use this as the root component.**

```tsx title="blog-post-usage.mdx"
<BlogPost title="Your Post Title">
  {/* Your content goes here */}
  <h1>Your Content</h1>
  <p>Your paragraphs...</p>
</BlogPost>
```

**Props:**

- `title` (optional): The post title for breadcrumb navigation

### Available MDX Components

The following components are available in your MDX files:

- **Standard HTML**: All standard HTML elements (`<h1>`, `<p>`, `<ul>`, etc.)
- **Markdown**: Standard markdown syntax (`**bold**`, `*italic*`, `[links](url)`)
- **Images**: Standard markdown image syntax or HTML `<img>` tags
- **Code Blocks**: Fenced code blocks with syntax highlighting
- **Math**: KaTeX support for mathematical equations
- **Tables**: GitHub Flavored Markdown table support

## File Structure

### Creating a New Blog Post

1. **Create a new directory** in `apps/web/app/blog/posts/`
2. **Name it with a slug** (e.g., `my-new-feature`)
3. **Add a `page.mdx` file** inside that directory

```
apps/web/app/blog/posts/
├── existing-post/
│ └── page.mdx
└── my-new-feature/ # ← New directory
  └── page.mdx # ← New MDX file
```

### File Naming Convention

- **Directory name**: Use kebab-case (e.g., `my-new-feature`)
- **File name**: Always `page.mdx`
- **URL**: Automatically becomes `/blog/posts/my-new-feature`

## Content Guidelines

### Images and Media

- **Store images** in `apps/web/public/`
- **Use relative paths** starting with `/` (e.g., `/my-image.png`)
- **Optimize images** for web (compress, appropriate dimensions)
- **Include alt text** for accessibility

```mdx
![Alt text describing the image](/path/to/image.png)
```

## Advanced Features

### Syntax Highlighting

Code blocks automatically get syntax highlighting:

````mdx
```typescript
function example() {
  return "This gets highlighted!";
}
```
````

### Math Equations

Use KaTeX for mathematical expressions:

```mdx
Inline math: $E = mc^2$

Block math:

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

### GitHub Flavored Markdown

- **Tables**: Full table support
- **Strikethrough**: `~~strikethrough text~~`
- **Task lists**: `- [x] Completed task`
- **Footnotes**: `[^1]` and `[^1]: footnote content`

### Custom React Components

You can import and use custom React components:

```tsx title="custom-component-usage.mdx"
import { MyCustomComponent } from "@/components/MyCustomComponent";

<BlogPost title="Using Custom Components">
  <MyCustomComponent prop="value" />
</BlogPost>;
```

## Troubleshooting

### Common Issues

**Post not appearing in blog list:**

- Check that frontmatter has required `title` and `date` fields
- Ensure the directory structure is correct
- Verify the `page.mdx` filename

**Images not loading:**

- Confirm image path starts with `/`
- Check that image exists in `public/` directory
- Verify image filename case sensitivity

**Build errors:**

- Check MDX syntax for invalid characters
- Verify all imported components exist
- Check for missing dependencies

### Getting Help

- **Check existing posts** for examples
- **Review the types** in `apps/web/lib/blog/types.ts`
- **Look at components** in `apps/web/components/blog/`
- **Ask the team** for complex issues

## Examples

### Simple Feature Announcement

````mdx title="feature-announcement.mdx"
---
title: "New Streaming API Released"
date: "2025-01-15"
description: "Introducing our new streaming API for real-time data"
tags: ["api", "feature", "streaming"]
author: "Engineering Team"
category: "feature"
featured: true
---

<BlogPost title="New Streaming API Released">
  # New Streaming API Released We're excited to announce the release of our new
  streaming API... ## What's New - Real-time data streaming - WebSocket support
  - Automatic reconnection ## Getting Started ```typescript import{" "}
  {StreamingAPI} from '@tambo/streaming'; const api = new StreamingAPI();
  api.connect(); ```
</BlogPost>
````

---

**Need help?** Check existing blog posts for examples or ask the development team for assistance.
