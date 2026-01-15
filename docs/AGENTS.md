# AGENTS.md

Detailed guidance for Claude Code agents working with the Docs package.

## Project Overview

The Docs package (`@tambo-ai/docs`) is a Next.js application serving as the official Tambo AI documentation site. Built with Fumadocs, it provides comprehensive guides, API reference, and interactive examples.

## Essential Commands

```bash
# Development
npm run dev          # Start dev server with Turbo mode
npm run build        # Build for production
npm run start        # Start production server
npm run postinstall  # Process MDX files (automatic)
npm run postbuild    # Generate sitemap (automatic)
```

## Architecture Overview

### Fumadocs Structure

- **MDX Processing**: `source.config.ts` - Schema validation and processing
- **Content System**: `src/lib/source.ts` - Page tree and navigation
- **Layout**: Fumadocs provides documentation layout with sidebar
- **Routing**: Dynamic routing via `[[...slug]]/page.tsx`

### Content Organization

- **Docs**: `content/docs/` - All MDX documentation files
- **Navigation**: `meta.json` files define sidebar structure
- **Assets**: `public/assets/docs/` - Images, videos, demos
- **Components**: Interactive Tambo components in docs

### Key Features

- MDX-based content with React components
- Auto-generated navigation from folder structure
- Interactive Tambo component examples
- Mermaid diagram support
- Search functionality
- GitHub integration

## Key Files and Directories

- `content/docs/` - Documentation content (MDX)
- `src/components/mdx/` - Custom MDX components
- `src/components/tambo/` - Tambo component implementations
- `src/lib/tambo.ts` - Component registration for interactive docs
- `source.config.ts` - Fumadocs configuration
- `src/app/layout.config.tsx` - Base layout configuration

## Development Patterns

### Adding Documentation

1. Create MDX file with frontmatter (title, description, icon)
2. Update relevant `meta.json` for navigation
3. Add assets to `public/assets/docs/` if needed
4. Test locally with `npm run dev`

### Adding Interactive Components

1. Create component in `src/components/tambo/`
2. Register in `src/lib/tambo.ts`
3. Use in MDX content directly
4. Ensure SSR compatibility

### Content Guidelines

- Use proper MDX syntax with code highlighting
- Include working examples users can copy
- Maintain consistent heading structure
- Optimize images and include alt text

#### SEO and heading structure

- Use exactly one H1 per page that clearly describes the main topic (for example, "Tambo CLI overview" instead of just "Overview").
- Structure sections as `H1 -> H2 -> H3` wherever possible. Avoid jumping straight to H3/H4 without an H2.
- Make sure primary key phrases for the page appear in the H1 (or first H2) and in the opening paragraph.
- Prefer descriptive headings over generic ones. Replace bare headings like "Overview" or "Introduction" with topic-aware variants such as "User authentication in Tambo".
- Keep headings scannable and short (aim for 3-7 words), and avoid repeating the exact same phrase across multiple headings on a single page.
- Follow our existing product naming conventions (for example, "Tambo AI" and "Tambo Cloud") when including product names in headings so SEO signals stay consistent.
- When configuring agents or templates to generate docs, bake these heading and keyword rules into your prompts/system messages so automated output follows the same standard.

## Documentation Structure and Patterns

### Site Organization Philosophy

The documentation follows a **progressive disclosure** pattern - starting with quick wins (quickstart), moving through core concepts, then diving into specifics. This structure mirrors the user's learning journey.

#### Information Architecture

In general, try to fit changes into the following categories. If you can't find a good fit, suggest a new category but ask the user for confirmation.

1. **Getting Started** - Immediate value with working examples
   - Quickstart: Template installation and first interactions
   - Integration: Adding Tambo to existing projects
   - Component basics: Understanding registration patterns

2. **Concepts** - Core architectural understanding (components, threads, tools, context)
   - Components: Registration, schemas, lifecycle, interactables
   - Message Threads: Sending messages, responses, history management, status tracking
   - Tools: Function calling, schemas, orchestration
   - Model Context Protocol: Overview (what is MCP, connection architectures - server-side vs client-side comparison, server namespacing, rich content support, quick start), Features (tools, prompts, resources, elicitations, sampling - all explained with user experience examples)
   - User Authentication: OAuth providers, session management, context keys
   - Additional Context: Configuration, custom helpers, context attachments, dynamic control, system messages (thread-level instructions), resources (local and MCP, @ mention syntax, user-controlled context inclusion)

3. **Best Practices** - Guidance for production implementations
   - Component data props optimization
   - Performance considerations
   - Error handling patterns
   - Security best practices

4. **API Reference** - Technical specifications
   - React hooks: Complete signatures, parameters, return values
   - TypeScript interfaces and types
   - Provider configurations

5. **CLI** - Command-line tooling documentation
   - Commands: add, create-app, init, list, migrate, update, upgrade
   - Configuration: Project setup, customization options
   - Workflows: Development patterns, component management
   - Global options: Flags and environment variables

6. **Models** - Configuration and customization
   - Custom LLM parameters: Temperature, max tokens, model selection
   - Labels: Organizing and categorizing interactions
   - Reasoning Models: Advanced thinking/reasoning capabilities for OpenAI and Gemini models
   - Provider-specific configurations

7. **Examples & Templates** - Real-world implementations
   - Chat starter applications
   - Integration examples (Supabase MCP client)
   - Use case demonstrations
   - Community templates and patterns

Please update the `Information Architecture` section in the AGENTS.md file to reflect changes when you make them. Keeping this up to date is VERY IMPORTANT.

### Navigation Patterns (`meta.json`)

```json
{
  "title": "Section Name",
  "pages": [
    "index",
    "---Subsection Name---", // Section separators using ---
    "...subfolder", // Include entire subfolder
    "specific-page" // Individual pages
  ]
}
```

**Rules:**

- Use `---Section Name---` for visual separators in sidebar
- Use `...foldername` to include all pages from a subfolder
- Order pages by learning progression, not alphabetically
- Keep section titles concise (2-3 words max)

### Content Writing Patterns

#### Frontmatter Standards

```yaml
---
title: Page Title (descriptive, not technical)
description: Clear, actionable description under 160 characters
icon: LucideIconName # Optional, use relevant Lucide React icons
---
```

**Rules:**

- Title should be user-focused, not implementation-focused
- Description should complete: "This page helps you..."
- Icons enhance navigation but aren't required

#### Content Structure Template

```mdx
# Brief opening paragraph explaining what this achieves

## Core concept/pattern (if applicable)

Brief explanation with code example

## Step-by-step implementation

### Step 1: Clear action

### Step 2: Clear action

### Step 3: Clear action

## Advanced usage/customization (if applicable)

## Troubleshooting/Common issues (if applicable)
```

#### Writing Voice and Tone

- **Direct and Practical**: Focus on what users need to accomplish
- **Present Tense**: "Tambo allows you to..." not "Tambo will allow..."
- **Active Voice**: "Register components with Tambo" not "Components are registered"
- **Conversational but Professional**: Use "you" and "your app"
- **Outcome-Focused**: Start sections with what the user achieves

#### Code Examples Philosophy

**Always show complete, runnable examples:**

```tsx
// ✅ Complete context
import { TamboProvider } from "@tambo-ai/react";
import { z } from "zod";

const components = [
  {
    name: "WeatherCard",
    description: "Shows current weather for a city",
    component: WeatherCard,
    propsSchema: z.object({
      city: z.string(),
      temperature: z.number(),
    }),
  },
];

export function App() {
  return (
    <TamboProvider components={components}>
      <Chat />
    </TamboProvider>
  );
}
```

**Rules:**

- Include necessary imports
- Show complete examples users can copy-paste
- Use realistic prop names and values
- Include error handling where relevant
- Prefer TypeScript over JavaScript
- Do not include styling in the code examples.
- Keep code examples minimal and to the point.

### Interactive Elements

#### Learn More Cards

Use the `<LearnMore>` component for cross-references:

```mdx
import LearnMore from "@/components/learn-more";

<LearnMore
  title="Component Registration"
  description="Learn how to register components with Tambo"
  href="/concepts/components"
  icon={ComponentIcon} // Optional
/>
```

#### Image Guidelines

Always use ImageZoom for better UX:

```mdx
import { ImageZoom } from "fumadocs-ui/components/image-zoom";

<ImageZoom
  src="/assets/docs/example.gif"
  alt="Descriptive alt text"
  width={500}
  height={500}
  style={{ border: "2px solid #e5e7eb", borderRadius: "8px", width: "80%" }}
/>
```

**Image Standards:**

- Use descriptive alt text
- Add subtle borders and rounded corners
- Keep width at 80% for responsive design
- Optimize GIFs and images for web
- Store in `/public/assets/docs/`

#### Code Block Enhancements

Use titles for context:

```bash title="Install dependencies"
npm install @tambo-ai/react
```

### Content Consistency Patterns

#### CLI Documentation Style

- Show command first: `npx tambo add form`
- Explain what it does in practical terms
- List available options/components
- Include realistic examples
- Show automatic behaviors (dependency installation, etc.)

#### API/Hook Documentation Style

- Lead with the practical use case
- Show the hook signature
- Provide complete implementation example
- Explain key parameters and return values
- Include common patterns and edge cases

#### Concept Pages Structure

- **Index page**: High-level overview with links to specifics
- **Implementation pages**: Step-by-step guides
- **Advanced pages**: Optimization and customization
- Cross-link related concepts extensively

### Asset Management

#### File Naming

- Use descriptive, kebab-case names: `recipe-card-example.gif`
- Include context: `quickstart-demo.mp4` not `demo.mp4`
- Version large changes: `component-registration-v2.png`

### MDX Component Usage

#### Available Components

- **ImageZoom**: All images should use this
- **LearnMore**: Cross-references and next steps
- **Mermaid**: Diagrams and flow charts
- **defaultMdxComponents**: Tabs, Callouts, Code blocks with syntax highlighting

#### Custom Components

When adding custom components:

1. Create in `src/components/`
2. Register in `src/mdx-components.tsx`
3. Ensure SSR compatibility
4. Follow accessibility guidelines

## Important Development Rules

### Page Management

Never delete doc pages that exist on main. This breaks external links.

Instead, remove the page from `meta.json` (delists from nav) and replace content with pointers to the new/better pages. Old URLs keep working, users find current content.

### General Rules

- All components must be SSR compatible
- Maintain frontmatter for all MDX files
- Keep meta.json navigation updated
- Follow progressive disclosure in content organization
- Use complete, runnable code examples
- Include descriptive alt text for all images
- Cross-reference related concepts extensively
- Test all examples work in latest template
- Ensure mobile responsiveness
- Use ImageZoom for all documentation images
