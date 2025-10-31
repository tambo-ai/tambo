# Design Tokens - Usage Guide

## Core Principle: Neutral by Default, Brand by Exception

95% of your UI should use neutral tokens. Brand colors are for intentional interactive elements only.

## Token Hierarchy

### Text Tokens

#### Content Text (Use for 95% of text)

**`text-foreground`**

- Primary body text
- Headings
- Button labels on colored backgrounds
- Any text that should maintain contrast in light/dark themes

```tsx
// ✅ Correct usage
<p className="text-foreground">Body text</p>
<h1 className="text-foreground">Heading</h1>
<label className="text-foreground">Form Label</label>
```

**`text-muted-foreground`**

- Secondary information
- Captions and descriptions
- Placeholder text
- Icons in neutral contexts
- Timestamps
- Loading states

```tsx
// ✅ Correct usage
<p className="text-muted-foreground">Posted 2 hours ago</p>
<input placeholder="Enter text..." className="placeholder:text-muted-foreground" />
<FileIcon className="text-muted-foreground" />
```

#### Interactive Text (Use sparingly - <5% of text)

**`text-primary`**

- **ONLY** on `bg-primary` backgrounds
- **NEVER** on default/white/transparent backgrounds
- **NEVER** for content text, labels, or placeholders

```tsx
// ✅ Correct usage
<button className="bg-primary text-primary">
  Call to Action
</button>

// ❌ WRONG - text-primary without bg-primary
<label className="text-primary">Form Label</label>
<p className="text-primary">Body text</p>
<input placeholder="..." className="placeholder:text-primary" />
```

**`text-secondary`**

- **DEPRECATED** - Do not use
- Replaced by `text-muted-foreground` for neutral contexts
- Replaced by hardcoded semantic colors for status

```tsx
// ❌ NEVER use text-secondary
<p className="text-secondary">Caption</p>

// ✅ Use text-muted-foreground instead
<p className="text-muted-foreground">Caption</p>
```

#### Status Text (Use for semantic states)

**Hardcoded Semantic Colors**

- Success: `text-green-600 dark:text-green-400`
- Error: `text-red-600 dark:text-red-400`
- Warning: `text-amber-600 dark:text-amber-400`

```tsx
// ✅ Correct usage
<p className="text-green-600 dark:text-green-400">
  Success message
</p>

// ❌ WRONG - using text-primary for status
<p className="text-primary">Success message</p>
```

### Background Tokens

#### Neutral Backgrounds

**`bg-background`**

- Page/app background
- Card backgrounds in most contexts

**`bg-muted`**

- Interactive neutral elements (buttons, inputs)
- Hover states for neutral actions
- Code blocks
- Secondary cards

```tsx
// ✅ Correct usage - neutral button
<button className="bg-muted text-muted-foreground hover:bg-muted/80">
  Secondary Action
</button>
```

**`bg-card`**

- Elevated content containers
- Distinct from page background

#### Brand Backgrounds

**`bg-primary`**

- Primary CTAs only
- Must use with `text-primary`
- Sparingly used (1-2 per page)

```tsx
// ✅ Correct usage
<button className="bg-primary text-primary hover:bg-primary/90">
  Primary CTA
</button>

// ❌ WRONG - bg-primary without text-primary
<button className="bg-primary text-foreground">
  Button
</button>
```

### Border Tokens

**`border`**

- Default borders (inputs, cards, dividers)
- Neutral element separation

**`border-primary`**

- Focus states on form inputs
- Active states on interactive elements
- Never for static decorative borders

## Common Patterns

### Form Elements

```tsx
// ✅ Correct
<div>
  <label className="text-foreground">Email</label>
  <p className="text-muted-foreground">We'll never share your email</p>
  <input
    className="border text-foreground placeholder:text-muted-foreground"
    placeholder="you@example.com"
  />
</div>

// ❌ WRONG
<div>
  <label className="text-primary">Email</label>
  <p className="text-secondary">We'll never share your email</p>
  <input
    className="border text-primary placeholder:text-secondary"
    placeholder="you@example.com"
  />
</div>
```

### Interactive Elements

```tsx
// ✅ Primary action
<button className="bg-primary text-primary hover:bg-primary/90">
  Submit
</button>

// ✅ Secondary action
<button className="bg-muted text-muted-foreground hover:bg-muted/80">
  Cancel
</button>

// ❌ WRONG - text-primary without bg-primary
<button className="bg-muted text-primary">
  Submit
</button>
```

### Loading States

```tsx
// ✅ Always neutral
<div className="text-muted-foreground">
  <Spinner className="animate-spin" />
  Loading...
</div>

// ❌ WRONG - loading should never be branded
<div className="text-primary">
  <Spinner className="animate-spin" />
  Loading...
</div>
```

## Migration Guide

### Finding Issues

```bash
# Find all text-primary usage
grep -r "text-primary" --include="*.tsx" --include="*.ts"

# Find all text-secondary usage
grep -r "text-secondary" --include="*.tsx" --include="*.ts"
```

### Common Replacements

| Old Pattern                | New Pattern                         | Context                |
| -------------------------- | ----------------------------------- | ---------------------- |
| `text-primary`             | `text-foreground`                   | Labels, headings       |
| `text-secondary`           | `text-muted-foreground`             | Captions, descriptions |
| `placeholder:text-primary` | `placeholder:text-muted-foreground` | Input placeholders     |
| `text-primary` (icon)      | `text-muted-foreground`             | Neutral icons          |
| `hover:text-primary`       | `hover:text-foreground`             | Non-CTA hover states   |

### Testing Changes

After migration:

1. Test in light theme
2. Test in dark theme
3. Test in high contrast mode
4. Verify text remains readable
5. Check that brand colors only appear on intentional CTAs

## Validation Checklist

- [ ] TOKENS.md created with all patterns documented
- [ ] ESLint rule added to catch text-primary misuse
- [ ] Storybook examples show correct vs incorrect usage
- [ ] Migration guide includes search/replace patterns
- [ ] All developers have read and acknowledged token rules
- [ ] Design system documentation updated
