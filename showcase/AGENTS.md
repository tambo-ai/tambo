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

### Color System Philosophy

The Showcase design system is built on a **neutral gray foundation** with **strategic brand color accents**:

- **Neutral Grays**: Professional, documentation-friendly palette for 95% of the UI
- **Brand Teal**: Strategic use of `#7FFFC4` (hsl(157 100% 75%)) for primary actions and focus states ONLY
- **Single Theme System**: Unified HSL-based color system that works in both light and dark modes
- **Accessibility First**: WCAG AA contrast requirements for all text and interactive elements

#### Brand Color Usage

The teal brand color (`--primary: 157 100% 75%`) should be used **sparingly** and **strategically**:

✅ **Use for:**

- Primary action buttons (CTAs)
- Focus rings (`:focus-visible` states)
- Active navigation indicators
- Key interactive state highlights

❌ **Do NOT use for:**

- General backgrounds
- Body text
- Borders (except active states)
- Decorative elements
- Non-interactive UI components

### CSS Variable Reference

All color values are defined in `/src/app/globals.css` using HSL format for consistency and theme-ability.

#### Background & Surfaces (NEUTRAL)

| Variable               | Light Mode                  | Dark Mode               | Purpose                      |
| ---------------------- | --------------------------- | ----------------------- | ---------------------------- |
| `--background`         | `0 0% 100%` (white)         | `50 2% 9%` (near black) | Main page background         |
| `--foreground`         | `240 10% 3.9%` (near black) | `0 0% 98%` (near white) | Primary text color           |
| `--card`               | `0 0% 100%`                 | `50 2% 9%`              | Card backgrounds             |
| `--card-foreground`    | `240 10% 3.9%`              | `0 0% 98%`              | Text on cards                |
| `--popover`            | `0 0% 100%`                 | `240 10% 3.9%`          | Popover/dropdown backgrounds |
| `--popover-foreground` | `240 10% 3.9%`              | `0 0% 98%`              | Text in popovers             |

#### Primary Actions (BRAND TEAL)

| Variable               | Light Mode                | Dark Mode        | Purpose                   |
| ---------------------- | ------------------------- | ---------------- | ------------------------- |
| `--primary`            | `157 100% 75%` (#7FFFC4)  | `0 0% 98%`       | Primary button background |
| `--primary-foreground` | `186 94% 13%` (dark teal) | `240 5.9% 10%`   | Text on primary buttons   |
| `--ring`               | `157 100% 75%`            | `240 4.9% 83.9%` | Focus ring color          |

#### Secondary/Muted Colors (NEUTRAL)

| Variable                 | Light Mode       | Dark Mode        | Purpose                     |
| ------------------------ | ---------------- | ---------------- | --------------------------- |
| `--secondary`            | `240 4.8% 95.9%` | `240 3.7% 15.9%` | Secondary button background |
| `--secondary-foreground` | `240 5.9% 10%`   | `0 0% 98%`       | Text on secondary buttons   |
| `--muted`                | `240 4.8% 95.9%` | `240 3.7% 15.9%` | Muted backgrounds           |
| `--muted-foreground`     | `240 3.8% 46.1%` | `240 5% 64.9%`   | Muted/secondary text        |
| `--accent`               | `240 4.8% 95.9%` | `240 3.7% 15.9%` | Accent backgrounds          |
| `--accent-foreground`    | `240 5.9% 10%`   | `0 0% 98%`       | Text on accents             |

#### Borders & Inputs (NEUTRAL)

| Variable   | Light Mode     | Dark Mode        | Purpose               |
| ---------- | -------------- | ---------------- | --------------------- |
| `--border` | `240 5.9% 90%` | `240 3.7% 15.9%` | Standard border color |
| `--input`  | `240 5.9% 90%` | `240 3.7% 15.9%` | Input border color    |

#### Utility Colors

| Variable                   | Light Mode       | Dark Mode        | Purpose                            |
| -------------------------- | ---------------- | ---------------- | ---------------------------------- |
| `--container`              | `240 4.8% 95.9%` | `240 3.7% 15.9%` | Container backgrounds              |
| `--backdrop`               | `240 3.7% 15.9%` | `0 0% 98%`       | Modal overlay backdrop             |
| `--destructive`            | `0 84.2% 60.2%`  | `0 62.8% 30.6%`  | Destructive actions (delete, etc.) |
| `--destructive-foreground` | `0 0% 98%`       | `0 0% 98%`       | Text on destructive buttons        |

#### Sidebar Colors (NEUTRAL)

| Variable               | Light Mode       | Dark Mode        | Purpose                  |
| ---------------------- | ---------------- | ---------------- | ------------------------ |
| `--sidebar-background` | `0 0% 100%`      | `50 2% 7%`       | Sidebar background       |
| `--sidebar-foreground` | `240 5.3% 26.1%` | `240 4.8% 95.9%` | Sidebar text             |
| `--sidebar-primary`    | `240 5.9% 10%`   | `0 0% 98%`       | Sidebar primary elements |
| `--sidebar-accent`     | `240 4.8% 95.9%` | `240 3.7% 15.9%` | Sidebar hover states     |
| `--sidebar-border`     | `220 13% 91%`    | `240 3.7% 15.9%` | Sidebar borders          |

### Design Rules for Developers

#### When to Use Primary Color (Brand Teal)

✅ **Primary Buttons & CTAs:**

```tsx
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Get Started
</Button>
```

✅ **Focus Rings:**

```tsx
<input className="focus-visible:ring-2 focus-visible:ring-ring" />
```

✅ **Active Navigation:**

```tsx
<NavLink className="data-[active=true]:text-primary">Home</NavLink>
```

#### When to Use Neutral Colors

✅ **90% of Your UI Should Use Neutrals:**

**Backgrounds:**

```tsx
// Page background
<div className="bg-background text-foreground" />

// Card backgrounds
<div className="bg-card text-card-foreground" />

// Muted sections
<div className="bg-muted text-muted-foreground" />

// Secondary surfaces
<div className="bg-secondary text-secondary-foreground" />
```

**Text Colors:**

```tsx
// Primary text
<p className="text-foreground" />

// Secondary/muted text
<p className="text-muted-foreground" />

// 70% opacity for subtle text
<p className="text-foreground/70" />
```

**Borders:**

```tsx
// Standard borders
<div className="border border-border" />

// Utility class for consistent borders
<div className="border-flat" /> {/* Uses .border-flat utility */}
```

#### Typography Contrast Requirements

**WCAG AA Standards:**

- Normal text (16px+): Minimum 4.5:1 contrast ratio
- Large text (24px+): Minimum 3:1 contrast ratio
- Interactive elements: Minimum 3:1 contrast ratio

**Approved Text Color Combinations:**

Light Mode:

- `text-foreground` on `bg-background` ✅
- `text-muted-foreground` on `bg-background` ✅
- `text-foreground` on `bg-muted` ✅
- `text-primary-foreground` on `bg-primary` ✅

Dark Mode:

- Same variables automatically adapt ✅

### Common Patterns

#### Button Styling Patterns

```tsx
// Primary action button (uses brand teal)
<button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Primary Action
</button>

// Secondary button (neutral)
<button className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
  Secondary Action
</button>

// Muted/ghost button (neutral)
<button className="bg-transparent text-foreground hover:bg-muted">
  Ghost Button
</button>

// Destructive button
<button className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
  Delete
</button>
```

#### Text Color Patterns

```tsx
// Primary heading
<h1 className="text-foreground font-bold">Main Heading</h1>

// Secondary heading
<h2 className="text-foreground/90 font-semibold">Subheading</h2>

// Body text
<p className="text-foreground">Regular paragraph text.</p>

// Muted/caption text
<p className="text-muted-foreground">Secondary information.</p>

// Subtle text (70% opacity)
<p className="text-foreground/70">Tertiary information.</p>
```

#### Background Patterns

```tsx
// Page layout
<div className="bg-background min-h-screen">
  {/* Card component */}
  <div className="bg-card rounded-lg p-6">
    <h2 className="text-card-foreground">Card Title</h2>
  </div>

  {/* Muted section */}
  <div className="bg-muted p-4">
    <p className="text-muted-foreground">Muted content area</p>
  </div>

  {/* Container background */}
  <div className="bg-container rounded-md p-3">
    <span className="text-foreground">Container content</span>
  </div>
</div>
```

#### Border Patterns

```tsx
// Standard border
<div className="border border-border rounded-lg" />

// Border with utility class
<div className="border-flat rounded-lg" />

// Input with border
<input className="border-input border rounded-md focus:ring-2 focus:ring-ring" />
```

#### Focus State Patterns

```tsx
// Standard focus ring (uses brand teal in light mode)
<button className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
  Focusable Element
</button>

// Focus within container
<div className="focus-within:ring-2 focus-within:ring-ring">
  <input />
</div>
```

### What NOT to Do

#### ❌ Don't Add Teal/Cyan to Non-Interactive Elements

```tsx
// WRONG: Using brand color for decorative elements
<div className="bg-primary/10 border-primary">
  <p className="text-primary">Non-interactive content</p>
</div>

// RIGHT: Use neutral colors
<div className="bg-muted border-border">
  <p className="text-foreground">Non-interactive content</p>
</div>
```

#### ❌ Don't Create Custom Color Variables

```css
/* WRONG: Creating custom colors outside the system */
:root {
  --my-custom-teal: 180 100% 50%;
  --my-custom-gray: 200 10% 40%;
}

/* RIGHT: Use existing variables */
:root {
  --primary: 157 100% 75%; /* Already defined */
  --muted-foreground: 240 3.8% 46.1%; /* Already defined */
}
```

#### ❌ Don't Use Hardcoded RGBA Values

```tsx
// WRONG: Hardcoded color values
<div style={{ backgroundColor: 'rgba(127, 255, 196, 0.1)' }}>
  Content
</div>

// RIGHT: Use CSS variables with Tailwind
<div className="bg-primary/10">
  Content
</div>
```

#### ❌ Don't Reintroduce Dual-Theme Complexity

```css
/* WRONG: Creating separate theme variations */
:root[data-theme="professional"] {
  --primary: 200 100% 50%;
}

:root[data-theme="creative"] {
  --primary: 280 100% 70%;
}

/* RIGHT: Use the single unified theme system */
/* Light/dark modes are already handled in globals.css */
```

#### ❌ Don't Override Component Styles Arbitrarily

```tsx
// WRONG: Inline styles that break the system
<Button style={{ backgroundColor: '#00FFFF', color: '#FF00FF' }}>
  Custom Button
</Button>

// RIGHT: Use className with existing utilities
<Button className="bg-primary text-primary-foreground">
  Primary Button
</Button>
```

### Component Examples

#### Correct Example: Neutral Card Component

```tsx
export function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <div className="bg-card border-flat rounded-lg p-6 hover:bg-muted/50 transition-colors">
      <h3 className="text-card-foreground font-semibold text-lg mb-2">
        {title}
      </h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
```

**Why this is correct:**

- Uses `bg-card` for card background (neutral)
- Uses `border-flat` utility for consistent borders
- Uses `text-card-foreground` for heading (neutral)
- Uses `text-muted-foreground` for body text (neutral)
- Hover state uses `bg-muted/50` (neutral)
- No brand colors used (this is not an interactive CTA)

#### Correct Example: Primary CTA Button

```tsx
export function CTAButton({ children, onClick }: CTAButtonProps) {
  return (
    <button
      onClick={onClick}
      className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
    >
      {children}
    </button>
  );
}
```

**Why this is correct:**

- Uses `bg-primary` for primary action (brand teal)
- Uses `text-primary-foreground` for readable text on teal
- Uses `focus-visible:ring-ring` for teal focus ring
- Hover state uses `bg-primary/90` for subtle darkening
- This is an interactive CTA, appropriate for brand color usage

#### Correct Example: Navigation with Active State

```tsx
export function NavItem({ label, isActive, href }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "px-4 py-2 rounded-md transition-colors",
        "text-foreground hover:bg-muted",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isActive && "bg-muted text-primary font-medium",
      )}
    >
      {label}
    </Link>
  );
}
```

**Why this is correct:**

- Default text is `text-foreground` (neutral)
- Hover state is `hover:bg-muted` (neutral background)
- Active state uses `text-primary` (brand teal) to indicate current page
- Focus ring uses `ring-ring` (brand teal)
- Minimal but strategic use of brand color

#### Correct Example: Form Input

```tsx
export function TextInput({ label, ...props }: TextInputProps) {
  return (
    <div className="space-y-2">
      <label className="text-foreground font-medium text-sm">{label}</label>
      <input
        {...props}
        className="w-full bg-background border-input border rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-shadow"
      />
    </div>
  );
}
```

**Why this is correct:**

- Label uses `text-foreground` (neutral)
- Input background is `bg-background` (neutral)
- Border uses `border-input` (neutral)
- Placeholder uses `text-muted-foreground` (neutral)
- Focus ring uses `ring-ring` (brand teal) for interactivity
- Only the focus state gets brand color

### Quick Decision Tree

When adding or modifying UI elements, ask yourself:

1. **Is this element interactive and a primary action?**
   - YES → Consider using `bg-primary` or `text-primary`
   - NO → Continue to step 2

2. **Is this element in a focus state?**
   - YES → Use `ring-ring` for focus ring
   - NO → Continue to step 3

3. **Is this element active/selected in navigation?**
   - YES → Consider using `text-primary` for active indicator
   - NO → Continue to step 4

4. **For everything else:**
   - Use neutral colors: `background`, `foreground`, `muted`, `card`, `border`, etc.

**Remember**: If you're unsure, default to neutral colors. Brand teal should be rare and intentional.

### Accessibility Checklist

Before committing components, verify:

- [ ] Text has minimum 4.5:1 contrast ratio (use browser dev tools)
- [ ] Focus states are visible with `focus-visible:ring-2 focus-visible:ring-ring`
- [ ] Interactive elements have clear hover states
- [ ] Color is not the only indicator of state (use icons, text, etc.)
- [ ] All text uses CSS variables (no hardcoded colors)
- [ ] Component works in both light and dark modes

### Key Files Reference

- **Color Definitions**: `/src/app/globals.css` (lines 10-76 for :root, 78-123 for .dark)
- **Tailwind Config**: `/tailwind.config.ts` (color mapping to CSS variables)
- **Component Library**: Refer to existing components in `/src/components` for patterns

### Summary

**The Golden Rule**: Use neutral grays for 95% of your UI. Reserve brand teal for primary actions, focus states, and active navigation indicators only.

By following these guidelines, you'll maintain a consistent, professional, and accessible design system that scales with the application.
