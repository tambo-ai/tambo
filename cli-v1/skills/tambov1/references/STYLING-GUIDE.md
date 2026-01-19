# Styling Guide

Tambo components use Tailwind CSS by default. This guide covers using Tailwind or adapting to other styling systems.

## Default: Tailwind CSS (Recommended)

Tambo's registry components are built with Tailwind. Benefits:

- Consistent with shadcn/ui ecosystem
- Utility-first scales well in chat contexts
- Easy to customize via config
- Works great with AI-generated components

### Check if Tailwind is Installed

**AGENT:** Detect by reading files (don't use bash):

- Read `package.json` → look for `tailwindcss` in dependencies/devDependencies
- Glob for `tailwind.config.*` in project root

### Install Tailwind (if needed)

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Configure `tailwind.config.js`:

```js
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/components/tambo/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

Add to your CSS:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Using Other Styling Systems

Tambo components can be adapted to any CSS approach. The core functionality (schemas, streaming, registration) is styling-agnostic.

### Detecting Your Styling System

**AGENT:** During setup, detect by reading files:

| How to Detect                               | Styling System    |
| ------------------------------------------- | ----------------- |
| Glob for `*.module.css` files               | CSS Modules       |
| Read `package.json` for `styled-components` | styled-components |
| Read `package.json` for `@emotion/styled`   | Emotion           |
| Glob for `*.scss` or `*.sass` files         | Sass/SCSS         |
| Read `package.json` for `sass`              | Sass/SCSS         |
| None of the above                           | Consider Tailwind |

### Adapting Components

When installing Tambo components with a non-Tailwind system:

1. **Install the component** - Get the base code
2. **Identify Tailwind classes** - Look for `className="..."`
3. **Map to your system** - Convert utilities to your approach

### Conversion Examples

**Original (Tailwind):**

```tsx
<div className="max-w-md p-4 rounded-lg border bg-card">
  <h3 className="text-lg font-semibold">{title}</h3>
  <p className="text-sm text-muted-foreground">{subtitle}</p>
</div>
```

**CSS Modules:**

```tsx
import styles from "./MyComponent.module.css";

<div className={styles.container}>
  <h3 className={styles.title}>{title}</h3>
  <p className={styles.subtitle}>{subtitle}</p>
</div>;
```

```css
/* MyComponent.module.css */
.container {
  max-width: 28rem;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border);
  background: var(--card);
}
.title {
  font-size: 1.125rem;
  font-weight: 600;
}
.subtitle {
  font-size: 0.875rem;
  color: var(--muted-foreground);
}
```

**styled-components:**

```tsx
import styled from 'styled-components'

const Container = styled.div`
  max-width: 28rem;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border);
  background: var(--card);
`

const Title = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
`

const Subtitle = styled.p`
  font-size: 0.875rem;
  color: var(--muted-foreground);
`

<Container>
  <Title>{title}</Title>
  <Subtitle>{subtitle}</Subtitle>
</Container>
```

**Vanilla CSS:**

```tsx
<div className="tambo-card">
  <h3 className="tambo-card__title">{title}</h3>
  <p className="tambo-card__subtitle">{subtitle}</p>
</div>
```

```css
.tambo-card {
  max-width: 28rem;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  background: white;
}
.tambo-card__title {
  font-size: 1.125rem;
  font-weight: 600;
}
.tambo-card__subtitle {
  font-size: 0.875rem;
  color: #6b7280;
}
```

## Common Tailwind → CSS Mappings

| Tailwind                | CSS                              |
| ----------------------- | -------------------------------- |
| `p-4`                   | `padding: 1rem`                  |
| `m-2`                   | `margin: 0.5rem`                 |
| `rounded-lg`            | `border-radius: 0.5rem`          |
| `border`                | `border: 1px solid`              |
| `text-sm`               | `font-size: 0.875rem`            |
| `text-lg`               | `font-size: 1.125rem`            |
| `font-semibold`         | `font-weight: 600`               |
| `font-bold`             | `font-weight: 700`               |
| `max-w-md`              | `max-width: 28rem`               |
| `max-w-sm`              | `max-width: 24rem`               |
| `space-y-2`             | `> * + * { margin-top: 0.5rem }` |
| `flex`                  | `display: flex`                  |
| `items-center`          | `align-items: center`            |
| `justify-between`       | `justify-content: space-between` |
| `gap-2`                 | `gap: 0.5rem`                    |
| `animate-pulse`         | `animation: pulse 2s infinite`   |
| `bg-muted`              | `background: var(--muted)`       |
| `text-muted-foreground` | `color: var(--muted-foreground)` |

## Setup Flow Decision

When setting up Tambo, ask the user:

1. **Detect existing system** - Check for Tailwind, CSS Modules, styled-components, etc.

2. **If Tailwind found:**
   - "Tailwind detected. Components will work out of the box."

3. **If other system found:**
   - "Found [CSS Modules/styled-components/etc]. Options:"
   - "1. Add Tailwind alongside (recommended for Tambo components)"
   - "2. Keep your system - you'll need to convert Tailwind classes in components"

4. **If no system found:**
   - "No CSS system detected. Options:"
   - "1. Install Tailwind (recommended)"
   - "2. Use your own approach - you'll convert classes manually"

## Styling Requirements for Gen-UI

Regardless of CSS system, components must:

1. **Constrain width** - Use max-width for chat context
2. **Handle responsiveness** - Work at 300px+ widths
3. **Support loading states** - Skeleton/pulse animations
4. **Use semantic colors** - Support light/dark themes via CSS variables

Example CSS variables for theming:

```css
:root {
  --background: #ffffff;
  --foreground: #0a0a0a;
  --card: #ffffff;
  --border: #e5e7eb;
  --muted: #f3f4f6;
  --muted-foreground: #6b7280;
}

.dark {
  --background: #0a0a0a;
  --foreground: #fafafa;
  --card: #171717;
  --border: #262626;
  --muted: #262626;
  --muted-foreground: #a3a3a3;
}
```

## AI-Generated Components

When AI creates new components via `/create-agent-component`:

- **If Tailwind:** Generate with Tailwind classes (default)
- **If other system:** Generate with placeholder classes and note to convert

Example output for non-Tailwind:

```tsx
// NOTE: Replace className values with your CSS system
// Current classes are Tailwind utilities that need conversion
// See references/STYLING-GUIDE.md for mapping

export function DataCard({ title, value }: DataCardProps) {
  return (
    <div className="max-w-md p-4 rounded-lg border">
      {/* ^ Convert: max-width: 28rem; padding: 1rem; border-radius: 0.5rem; border: 1px solid */}
      <h3 className="text-lg font-semibold">
        {/* ^ Convert: font-size: 1.125rem; font-weight: 600 */}
        {title}
      </h3>
    </div>
  );
}
```
