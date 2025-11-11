# AGENTS.md - Component Pages

Quick reference for component documentation page patterns.

## Categories

- `(blocks)/` - Full-featured components
- `(message-primitives)/` - Basic building blocks
- `(generative)/` - AI-generated UI
- `(canvas)/` - Canvas-based

## Page Structure

**Container:** `prose max-w-8xl` (never use other widths)

**Sections (in order):**

1. Title (h1) + description (text-lg text-muted-foreground)
2. Examples (h2 mt-12) → ComponentCodePreview components
3. Installation (h2 mt-12) → Wrap InstallationSection in `not-prose`
4. Component API (h2 mt-12) → Props table

## ComponentCodePreview Props

- **Standard:** `previewClassName="p-8"`
- **Full-bleed blocks:** `previewClassName="p-0" minHeight={650} enableFullscreen fullscreenTitle="..."`
- **Chat/forms:** `previewClassName="p-8" minHeight={650}`

## Common Mistakes

- ❌ Manual spacing with prose (let prose handle it naturally)
- ❌ Wrapping h2 in not-prose (keep headings in prose, wrap only custom components)
- ❌ Using both className min-h and minHeight prop (use prop only)

## Adding Pages

1. Create `(category)/[component-name]/page.tsx`
2. Update `/src/lib/navigation.ts` with `isNew: true`
3. Remove `isNew` from previous newest component
4. Add component to `/src/components/ui/` if new
5. Add chat interface to `/src/components/generative/` if needed

## Interactive Examples Pattern

**Structure:** `section` with `space-y-8` containing:

- Optional note callout (rounded-lg border border-border bg-muted/40 p-4)
- Numbered examples (h3: "1. Title", text-lg font-500)
- Example cards (rounded-lg border border-border bg-card p-4)

**For request/response demos:**

- RequestDisclosure component (details with JSON in pre)
- Response display (rounded-md border border-border bg-muted/40 p-3)

## Design Tokens

**Use only:**

- Colors: `bg-muted`, `bg-card`, `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `border-accent`
- Spacing: `space-y-12` (sections), `space-y-8` (examples), `space-y-4` (cards)
- Typography: `text-lg`, `text-sm`, `text-xs`, `font-500`, `font-semibold`

**Callout patterns:**

- Overview: p-6 space-y-4 with lists
- Notes: p-4 with "Note:" heading
- Type docs: border-l-4 border-accent with strong/code

## Rules

- Interactive-first (live functional examples, not static)
- Numbered examples ("1. Title") for multi-example pages
- Wrap interactive sections in `not-prose`, keep markdown headings in prose
- Never use arbitrary widths (stick to max-w-8xl)
