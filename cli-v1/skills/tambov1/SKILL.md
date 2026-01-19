---
name: tambov1
description: >
  Build generative UI - React components that AI assistants, copilots, and agents render
  by generating props. Create chat interfaces, AI dashboards, assistant UIs, and dynamic
  components. Convert existing components to be AI-renderable. Review components for proper
  streaming, scaling, and schema design. Uses @tambo-ai/react package for implementation.

  Triggers: AI assistant, copilot UI, agent interface, chat components, AI-rendered UI,
  dynamic React components, assistant components, copilot chat, copilot dashboard, agent UI,
  generative components, generative UI, add component to assistant, update copilot,
  create AI component, build chat interface, assistant can render, AI can generate,
  streaming UI, component the AI renders, chat UI, agent dashboard, AI-powered interface,
  user agent, UI agent, AI tools, MCP integration, model context protocol, local tools,
  interactable components, AI-updateable UI, context attachments, AI context, tool calling.
compatibility: Requires Node.js 18+, React 18+. Uses tambov1 CLI for operations.
allowed-tools: >
  Bash(npm run tambo:*)
  Bash(npm:install --save)
  Bash(npm:list)
  Read
  Write
  Edit
  Glob
  Grep
  WebFetch(docs.tambo.co:*)
---

# Generative UI with Tambo

Build React components that AI assistants render by generating props. Create interfaces that copilots, assistants, and agents can dynamically generate.

**Implementation:** `@tambo-ai/react` package

## Documentation

Fetch these when you need detailed API reference, advanced patterns, or troubleshooting:

- **LLM-optimized docs:** https://docs.tambo.co/llms.txt
- **Full documentation:** https://docs.tambo.co
- **API reference:** https://docs.tambo.co/api

## CLI Reference

All operations go through the `tambov1` CLI:

```bash
npm run tambo help              # Show all commands
npm run tambo <command> --help  # Command-specific help
npm run tambo <command> --json  # Machine-readable output
```

## Tool Safety Rules

**Additive operations (proceed without prompting):**
- `npm run tambo install <component>`
- `npm run tambo status`
- `npm run tambo components available`
- `npm run tambo components installed`
- `npm run tambo auth status`
- `npm install --save <package>`
- Creating new files
- Adding code to existing files

**Destructive operations (ALWAYS ask user first):**
- Deleting files
- Removing code from files
- `npm run tambo update --force` (overwrites local changes)
- Regenerating API keys
- Any `--force` or `--overwrite` flags

Before any destructive operation, ask: "This will [describe change]. Proceed?"

---

## Before Any Operation

Check if generative UI is set up:

```bash
npm run tambo status --json
```

**If not set up**, guide through:
1. Missing auth → `npm run tambo auth login`
2. Missing project → `npm run tambo project create --name "{infer from package.json}"`
3. Missing config → `npm run tambo init config`
4. Missing package → `npm install --save @tambo-ai/react`
5. Check styling system (see below)

Only proceed after prerequisites are met.

## Styling System Detection

**AGENT: You must check the user's styling system before installing components.**

Tambo components use **Tailwind CSS by default** (recommended). Detect styling system by reading files:

**Check for Tailwind:**
- Read `package.json` → look for `tailwindcss` in dependencies/devDependencies
- Glob for `tailwind.config.*` in project root

**Check for other systems:**
- Read `package.json` → look for `styled-components`, `@emotion/styled`, `sass`
- Glob for `*.module.css` files → CSS Modules
- Glob for `*.scss` or `*.sass` files → Sass

**AGENT decision flow:**

1. **Tailwind found** → Components work out of the box, proceed normally
2. **Other system found** → Ask user:
   - "Add Tailwind alongside your current system? (Recommended for Tambo components)"
   - "Keep current system? (You'll need to convert Tailwind classes in installed components)"
3. **No system found** → Ask user:
   - "Install Tailwind? (Recommended)"
   - "Use your own CSS approach? (You'll style components manually)"

**AGENT: If user chooses non-Tailwind**, read `references/STYLING-GUIDE.md` and help convert Tailwind classes to their CSS system after installing components.

---

## Workflow 1: Setup

Initialize generative UI in a new or existing React/Next.js project.

### Triggers
- "add AI assistant", "add copilot", "add chat to my app"
- "set up generative UI", "initialize tambo"
- "AI-powered UI", "assistant interface"

### Check Current State

```bash
npm run tambo status --json
```

Returns:
```json
{
  "authenticated": true,
  "project": { "id": "...", "name": "my-app" },
  "config": { "exists": true, "path": "src/components/lib/tambo.ts" },
  "installedComponents": ["message-thread", "message-input"]
}
```

### New Project

```bash
npm run tambo create-app my-app
cd my-app
npm install
npm run dev
```

### Existing Project

**Step 1: Authenticate**
```bash
npm run tambo auth login
```

**Step 2: Create or select project**
```bash
npm run tambo project list --json
npm run tambo project create --name "my-app" --json
```

**Step 3: Initialize**
```bash
npm run tambo init --yes
```

**Step 4: Install components**
```bash
npm run tambo install message-thread message-input control-bar
```

### Files Created

| File | Purpose |
|------|---------|
| `src/components/lib/tambo.ts` | Component and tool registry |
| `.env.local` | API key (`TAMBO_API_KEY=...`) |
| `src/components/tambo/` | Installed UI components |

---

## Workflow 2: Create Component

Create a new generative UI component from scratch.

### Triggers
- "create a component the AI can render"
- "make a generative UI component"
- "build a component for the assistant"

### Use `/create-agent-component`

See `commands/create-agent-component.md` for the full workflow.

### Quick Pattern

**Step 1: Create component file** at `src/components/tambo/<name>.tsx`:

```tsx
import { z } from "zod"

export const dataCardSchema = z.object({
  title: z.string().describe("Card title"),
  value: z.number().describe("Primary metric value"),
  trend: z.enum(["up", "down", "flat"]).describe("Direction of change"),
})

type DataCardProps = z.infer<typeof dataCardSchema>

export function DataCard({ title, value, trend }: DataCardProps) {
  return (
    <div className="p-4 rounded-lg border bg-card">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  )
}
```

**Step 2: Register** in `src/components/lib/tambo.ts`:

```tsx
{
  name: "DataCard",
  description: "Displays a metric with trend. Use for KPIs, statistics, analytics.",
  component: DataCard,
  propsSchema: dataCardSchema,
}
```

---

## Workflow 3: Add Component

Add an existing component from the registry.

### Triggers
- "add message thread", "install the chat component"
- "add a component to my assistant"

### Use `/add-agent-component`

See `commands/add-agent-component.md` for the full workflow.

### Quick Commands

```bash
# List available
npm run tambo components available --json

# Install
npm run tambo install message-thread message-input

# Check installed
npm run tambo components installed --json
```

---

## Workflow 4: Convert Component

Convert an existing React component to be AI-renderable.

### Triggers
- "make this component work with the AI"
- "convert this to generative UI"
- "AI should be able to render this"

### Use `/convert-agent-component`

See `commands/convert-agent-component.md` and `references/CONVERSION-CHECKLIST.md`.

### Quick Checklist

1. **Add Zod schema** with `.describe()` on all fields
2. **Derive types** from schema: `type Props = z.infer<typeof schema>`
3. **Add defaults** for optional props
4. **Handle partial state** for streaming
5. **Register** in tambo.ts with clear description
6. **Review** with `/review-agent-component`

---

## Workflow 5: Update Component

Sync with registry updates or modify based on feedback.

### Triggers
- "update the chat component"
- "make it more rounded", "add timestamps"
- "sync with latest"

### Update from Registry

```bash
npm run tambo components outdated --json
npm run tambo update message-thread --diff
npm run tambo update message-thread
```

### Modify Based on Feedback

1. Find component: `npm run tambo components installed --json`
2. Edit at `src/components/tambo/<name>.tsx`
3. Update schema in tambo.ts if props changed

---

## Workflow 6: Review Component

Validate a component follows generative UI best practices.

### Triggers
- "review this component for the AI"
- "check if this works with streaming"
- "validate the schema"

### Use `/review-agent-component`

See `commands/review-agent-component.md`.

### Review Checklist

| Check | What to Validate |
|-------|------------------|
| **Scaling** | Fits in chat bubble, responsive, max-width constraints |
| **Schema** | Zod with `.describe()`, proper defaults, optional handling |
| **Streaming** | Handles partial props, loading states, `useTamboComponentState` |
| **Accessibility** | ARIA labels, keyboard nav, semantic HTML |
| **Errors** | Graceful fallbacks for missing/invalid props |
| **Description** | Clear trigger words in registration |

---

## Workflow 7: Configure

Handle API keys, project settings, and authentication.

### Triggers
- "API key", "project settings", "auth issues"

### Commands

```bash
# Auth
npm run tambo auth status --json
npm run tambo auth login
npm run tambo auth logout

# Project
npm run tambo project list --json
npm run tambo project create --name "new-project" --json
npm run tambo project api-key --json
```

### API Key

Goes in `.env.local`:
```
TAMBO_API_KEY=tb_xxxxxxxxxxxx
```

---

## Workflow 8: Add Tools & MCP

Extend AI capabilities with local tools and MCP servers.

### Triggers
- "add a tool the AI can call"
- "connect MCP server", "model context protocol"
- "give AI access to APIs", "tool calling"

### Local Tools

Add tools AI can call in `src/components/lib/tambo.ts`:

```tsx
import { z } from "zod"

const searchTool = {
  name: "search",
  description: "Search the knowledge base for information",
  schema: z.object({
    query: z.string().describe("Search query"),
  }),
  handler: async ({ query }) => {
    const results = await searchKnowledgeBase(query)
    return { results }
  },
}

// Add to config
export const tamboConfig = {
  // ... component registry
  tools: [searchTool],
}
```

### MCP Integration

See `references/TOOLS-MCP-GUIDE.md` for:
- Creating local tools
- Connecting MCP servers
- Handling elicitations
- Tool vs component decision guide

---

## Workflow 9: Interactable Components

Build components that AI can update after initial render.

### Triggers
- "component AI can update", "AI-editable component"
- "live updates from AI", "interactable UI"

### Quick Pattern

```tsx
import { useTamboComponentState } from "@tambo-ai/react"

export function LiveList({ title, initialItems }: Props) {
  const [items, setItems, { isPending }] = useTamboComponentState(
    "live-list-items",  // Unique key - REQUIRED
    initialItems
  )

  return (
    <div className="max-w-md p-4 rounded-lg border">
      <h3>{title}</h3>
      {isPending && <span className="animate-pulse">Updating...</span>}
      <ul>
        {items.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </div>
  )
}
```

See `references/INTERACTABLE-GUIDE.md` for:
- Key uniqueness requirements
- Pending state handling
- User + AI collaborative editing

---

## Quick Reference

| Task | Command |
|------|---------|
| Check status | `npm run tambo status --json` |
| Initialize | `npm run tambo init --yes` |
| Install component | `npm run tambo install <name>` |
| List installed | `npm run tambo components installed --json` |
| List available | `npm run tambo components available --json` |
| Update component | `npm run tambo update <name>` |
| Login | `npm run tambo auth login` |

## Troubleshooting

### "Not authenticated"
```bash
npm run tambo auth login
```

### "No project selected"
```bash
npm run tambo project create --name "my-app"
```

### "Component not found"
```bash
npm run tambo components available --json
```

### Need more help
Fetch: https://docs.tambo.co/llms.txt
