# AGENTS.md

Detailed guidance for Claude Code agents working with the Showcase package.

## Project Overview

The Showcase (`@tambo-ai/showcase`) is a Next.js application that demonstrates all Tambo AI components and patterns. It serves as both a component library browser and an interactive testing ground for generative UI capabilities.

## Essential Commands

```bash
# Development
npm run dev          # Start Next.js development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # ESLint code checking
npm run clean        # Remove .next build artifacts
```

## Architecture Overview

### Component Demonstration System

- **Demo Pages**: `src/app/components/` - Individual component showcases
- **Interactive Examples**: Live AI chat interfaces for each component type
- **UI Components**: `src/components/ui/` - Actual Tambo components
- **Generative Interfaces**: `src/components/generative/` - AI-powered chat demos

### Navigation Structure

- **Blocks**: Full message thread components and control systems
- **Message Primitives**: Basic messaging building blocks
- **Generative**: AI-generated forms, graphs, maps, input fields
- **Canvas**: Interactive canvas-based components

### Key Features

- Live component registration and AI interaction
- Context-isolated threads for each component type
- Dark/light theme support with custom styling
- Responsive design with mobile-specific providers

## Key Files and Directories

- `src/app/components/` - Component demonstration pages
- `src/components/generative/` - AI chat interface implementations
- `src/components/ui/` - Tambo component implementations
- `src/lib/navigation.ts` - Site navigation structure
- `src/providers/` - Theme and mobile context providers
- `src/styles/showcase-theme.css` - Custom theming system

## Development Patterns

### Adding New Component Demos

1. Create page in `src/app/components/`
2. Implement chat interface in `src/components/generative/`
3. Add component to `src/components/ui/`
4. Update navigation in `src/lib/navigation.ts`

### Theme System

- CSS custom properties for theming
- Dark mode via `next-themes`
- Custom Sentient font integration
- Tailwind CSS with showcase-specific styles

## Important Development Rules

- React Strict Mode disabled (react-leaflet compatibility)
- All components must be SSR compatible
- Use unique context keys for thread isolation
- Follow existing demo patterns for consistency
- Include interactive examples for all components

## Design Token Guidance

- Default to `text-foreground` and `text-muted-foreground` for UI copy; reserve `text-primary` for elements on `bg-primary`.
- Reference the Storybook story `Design System/Token Usage` for canonical correct vs incorrect examples.
- Treat any `text-secondary` usage in demos as a blocker and migrate to neutral tokens before shipping.
