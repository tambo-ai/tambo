# Design Tokens – Usage Guide

## Core Principle

- Neutral by default, brand by exception: target 95% neutral usage across the UI.
- Brand colors appear only when communicating primary calls to action or intentional highlights.
- Every neutral choice must work in both light and dark themes without additional overrides.

## Text Tokens

- **`text-foreground`**: primary copy, headings, labels, and button text on neutral or muted backgrounds. Use whenever content needs maximum contrast.
- **`text-muted-foreground`**: secondary copy such as timestamps, captions, helper text, placeholders, loading states, and passive icons. Never apply it to interactive controls.
- **`text-primary-foreground`**: pair exclusively with `bg-primary` brand surfaces (primary CTAs, brand badges). Do not use on neutral backgrounds.
- **`text-primary`**: legacy accent token. Avoid inside the product UI; reserve it for explicit marketing treatments that have been reviewed.
- **Semantic status colors**: use dedicated success (`text-green-600 dark:text-green-400`), warning (`text-amber-600 dark:text-amber-400`), and error (`text-red-600 dark:text-red-400`) tokens. Never substitute brand colors for status messaging.

## Neutral Icon & Ghost Controls

- Neutral icon buttons and ghost controls use the outline recipe: `border border-border`, `bg-background`, `text-foreground`, `hover:bg-muted`, and a `focus-visible:ring` treatment.
- Do not use `text-muted-foreground` on interactive icons; if an icon looks disabled before hover, the token choice is wrong.
- Keep hover and focus feedback neutral (background shift, ring, subtle shadow). Do not reintroduce brand color on neutral controls.

## Background Tokens

- **`bg-background`**: page bodies and large neutral surfaces.
- **`bg-card`**: elevated containers that sit above the page background.
- **`bg-muted`**: subdued surfaces for secondary panels, code blocks, and neutral interactive elements that should feel low emphasis.
- **`bg-secondary`**: filled neutral controls (segmented toggles, filter chips) that need slightly higher emphasis without brand color. Do not use for icon buttons; they follow the outline recipe above.
- **`bg-primary`**: primary CTAs only. Limit to one or two per page, and always pair with `text-primary-foreground`.

## Borders, Rings, and Focus

- **`border`**: default separators, card outlines, input borders, and dividers.
- **`border-primary` / `ring`**: focus and active states only. Never use them for passive decoration.
- Always provide a `focus-visible:ring` treatment for interactive components that rely on neutral colors so keyboard users get a clear affordance.

## Link Styling

- Inline links default to `text-foreground` with an underline in `decoration-muted-foreground` to keep the pattern neutral.
- Hover states must increase contrast: keep `hover:text-foreground` (never reduce opacity) and shift the underline to `decoration-foreground`.
- Avoid reintroducing brand colors into inline links unless the entire context is a marketing surface that explicitly calls for it.

## Button Patterns

- **Primary CTA buttons**: `bg-primary` + `text-primary-foreground` with neutral hover (`hover:bg-primary/90`). Reserved for the single dominant action in a surface (e.g., message submit).
- **Neutral outline buttons**: `border border-border bg-background text-foreground hover:bg-muted focus-visible:ring-*`. This is the default for message input toolbar actions, secondary form actions, icon buttons, and any neutral affordance that is not the primary CTA.
- **Neutral filled buttons**: `bg-secondary text-foreground hover:bg-secondary/80` only when a control needs more emphasis than the outline pattern (segmented toggles, filter chips). Never combine with icon-only actions.
- **Destructive buttons**: continue using the existing `bg-destructive text-destructive-foreground` patterns for irreversible actions.
- Every button variant must include a `focus-visible:ring` treatment and avoid `text-muted-foreground`.

## Form Inputs

- Inputs, textareas, and selects use `bg-background`, `border`, `text-foreground`, and `placeholder:text-muted-foreground`.
- Focus states rely on `focus-visible:ring`/`focus:border-primary` rather than swapping to brand text colors.
- Inline controls (checkboxes, radio, switch) use the neutral outline recipe by default; only elevate to brand surfaces when mirroring primary CTA intent.
