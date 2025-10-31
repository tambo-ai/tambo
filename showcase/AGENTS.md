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

---

## Design System Guidelines

### Core Philosophy

- **95% neutral grays** for UI foundation
- **5% brand teal** (`--primary: 157 100% 75%`) for primary actions, focus rings, and active states only
- **If unsure, default to neutral colors.** Brand teal should be rare and intentional.

### Quick Decision Tree

1. **Primary action/CTA?** → `bg-primary text-primary-foreground hover:bg-primary/90`
2. **Focus state?** → `focus-visible:ring-2 focus-visible:ring-ring`
3. **Active navigation?** → `text-primary font-500`
4. **Everything else** → Use neutral colors

### CSS Variables

All colors defined in `/src/app/globals.css`. Reference that file for HSL values.

**Key variables:**

- **Backgrounds**: `--background`, `--card`, `--muted`, `--secondary`, `--container`
- **Text**: `--foreground`, `--muted-foreground`, `--card-foreground`
- **Interactive**: `--primary`, `--primary-foreground`, `--ring`
- **Borders**: `--border`, `--input`
- **Utility**: `--destructive`, `--backdrop`

### Component Patterns

**Buttons:**

- Primary CTA: `bg-primary text-primary-foreground hover:bg-primary/90`
- Secondary: `bg-secondary text-secondary-foreground hover:bg-secondary/80`
- Ghost: `bg-transparent text-foreground hover:bg-muted`
- Destructive: `bg-destructive text-destructive-foreground hover:bg-destructive/90`

**Typography:**

- H1: `text-2xl font-semibold` (only place for font-semibold)
- H2: `text-xl font-500`
- H3/H4: `text-base font-500`
- Body text: `text-foreground` (default font-400)
- Secondary text: `text-muted-foreground`
- Subtle text: `text-foreground/70`
- Table headers: `font-450`
- Strong emphasis: `font-500`
- **Never use `font-bold` (700)** - not part of the design system

**Backgrounds:**

- Page: `bg-background text-foreground`
- Cards: `bg-card text-card-foreground`
- Muted sections: `bg-muted text-muted-foreground`
- Containers: `bg-container`

**Borders:**

- Standard: `border border-border`
- Utility: `border-flat`
- Inputs: `border-input border`

**Focus States:**

- Standard: `focus-visible:ring-2 focus-visible:ring-ring`
- With offset: Add `focus-visible:ring-offset-2` and `focus-visible:outline-none`

**Navigation:**

```tsx
<Link
  className={cn(
    "text-foreground hover:bg-muted",
    "focus-visible:ring-2 focus-visible:ring-ring",
    isActive && "text-primary font-500"
  )}
>
```

### Common Pitfalls

- **Don't use brand color for non-interactive elements** - no teal on decorative elements, body text, or general borders
- **Don't hardcode colors** - use CSS variables via Tailwind (e.g., `bg-primary/10` not `rgba(127, 255, 196, 0.1)`)
- **Don't use `font-bold`** - use `font-500` or `font-semibold` (600) instead
- **Don't create custom color variables** - use existing ones from `globals.css`
- **Don't override with inline styles** - use Tailwind classes

### Accessibility Considerations

When making decisions, keep in mind:

- Text needs 4.5:1 contrast ratio (3:1 for large text)
- Focus states must be visible (use `focus-visible:ring-2 focus-visible:ring-ring`)
- Interactive elements need clear hover states
- Don't rely on color alone to indicate state (add icons, text, etc.)
- Components must work in both light and dark modes
- Use CSS variables for all colors (no hardcoded values)
