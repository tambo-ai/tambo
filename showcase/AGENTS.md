# AGENTS.md

Detailed guidance for Claude Code agents working with the Showcase package.

## Project Overview

The Showcase (`@tambo-ai/showcase`) is a Next.js application that demonstrates all Tambo AI components and patterns.

## Essential Commands

```bash
npm run dev          # Start Next.js development server
npm run build        # Build for production
npm run lint         # ESLint code checking
npm run test         # Ensure code snippets stay Prettier formatted
npm run format:code  # Format embedded code snippets in showcase with Prettier rules
npm run clean        # Remove .next build artifacts
```

## Key Files and Directories

```
src/
├── app/
│   ├── components/              # Component demo pages
│   │   ├── (blocks)/            # Full-featured components (threads, control bar)
│   │   ├── (message-primitives)/# Basic messaging blocks
│   │   ├── (generative)/        # AI-generated UI (forms, graphs, maps)
│   │   └── (canvas)/            # Canvas-based components
│   └── globals.css              # Design tokens (CSS variables)
├── components/
│   ├── ui/                      # Actual Tambo components being showcased
│   ├── generative/              # AI chat interfaces for demos
│   ├── component-code-preview.tsx  # Preview/code tab system
│   └── installation-section.tsx    # CLI installation component
├── lib/navigation.ts            # Site navigation - update when adding demos
└── providers/                   # Theme and mobile context providers
```

## Critical Development Rules

- **React Strict Mode is disabled** - Required for react-leaflet compatibility
- **All components must be SSR compatible** - This is a Next.js app
- **Use unique context keys for thread isolation** - Each demo needs its own thread context
- **Update `src/lib/navigation.ts` when adding demos**
- **Embedded code snippets must stay Prettier formatted** - Run `npm run format:code` after editing `code={` template strings; CI enforces this with `npm run test`

## Critical Design Rules

- **Never use `text-primary`, `text-secondary`, `text-accent` for text** - These are background colors. Always use `-foreground` variants (e.g., `text-foreground`, `text-muted-foreground`)
- **Never hardcode colors** - Use design tokens from `globals.css` only
- **Never use `font-bold`** - Use `font-500` or `font-semibold` instead
- **Layout: Sidebar is `w-64` fixed, main content uses `md:pl-64` offset**

## Adding New Component Demos

- Add new components in in `src/app/components/(category)/[component-name]/page.tsx`

4. Update the `src/lib/navigation.ts`:
   - **Mark it as new**: Add `isNew: true` to the navigation item
   - **Remove old "new" badges**: Find the previously newest component in that category and remove its `isNew: true` flag

See `src/app/components/AGENTS.md` for detailed page structure patterns.
