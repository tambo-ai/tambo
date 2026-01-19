---
name: add-agent-component
description: Add an existing generative UI component from the Tambo registry
argument-hint: { component name }
---

# /add-agent-component {name}

Add a pre-built component from the Tambo registry.

## Arguments

`{name}` - Component name from registry (e.g., `message-thread`, `control-bar`)

## Process

### 1. Check Setup

```bash
npm run tambo status --json
```

If not set up, guide through setup first.

### 2. Check Styling System

**AGENT: You must check this before installing.**

- Read `package.json` → look for `tailwindcss` in dependencies/devDependencies
- Glob for `tailwind.config.*` in project root

- **Tailwind found** → Components work as-is, proceed
- **No Tailwind** → **AGENT:** After installing, read `references/STYLING-GUIDE.md` and help user convert Tailwind classes to their CSS system

### 3. List Available Components

If user didn't specify a component:

```bash
npm run tambo components available --json
```

Show options and help them choose.

### 4. Check If Already Installed

```bash
npm run tambo components installed --json
```

If already installed, inform user and ask if they want to update instead.

### 5. Install Component

```bash
npm run tambo install {name}
```

For multiple components:

```bash
npm run tambo install message-thread message-input control-bar
```

### 6. Preview Without Installing (Optional)

```bash
npm run tambo install {name} --dry-run
```

### 7. Verify Installation

```bash
npm run tambo components installed --json
```

## Available Components

Common components in the registry:

| Component        | Purpose                 |
| ---------------- | ----------------------- |
| `message-thread` | Chat message display    |
| `message-input`  | Chat input with submit  |
| `control-bar`    | Assistant controls      |
| `form`           | Dynamic form generation |
| `graph`          | Data visualization      |
| `map`            | Location display        |

Run `npm run tambo components available --json` for full list.

## Example

Input: `/add-agent-component message-thread`

```bash
# Check status
npm run tambo status --json

# Install
npm run tambo install message-thread

# Verify
npm run tambo components installed --json
```

Output:

```
Installed message-thread to src/components/tambo/message-thread.tsx
Added to component registry in src/components/lib/tambo.ts
```

## Dependencies

Some components depend on others. The CLI handles this automatically:

```bash
npm run tambo install message-thread
# Also installs: message, scrollable-message-container (if needed)
```

## Customizing After Install

Components are installed as source files you can modify:

1. Find at `src/components/tambo/{name}.tsx`
2. Edit as needed
3. Run `/review-agent-component` to validate changes
