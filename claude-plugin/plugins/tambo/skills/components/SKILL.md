---
name: Tambo Components
description: Use this skill when creating Tambo components - both generative (AI creates on-demand) and interactable (pre-placed, AI updates). Triggers on "TamboComponent", "withInteractable", "propsSchema", "register component", "generative component", "interactable", "pre-placed component".
---

# Tambo Components

Two ways to use components with Tambo: **generative** (AI creates on-demand) and **interactable** (pre-placed, AI updates).

## Generative Components

AI dynamically selects and renders these in response to user messages.

```tsx
import { TamboProvider, TamboComponent } from "@tambo-ai/react";
import { z } from "zod";

const WeatherCardSchema = z.object({
  city: z.string().describe("City name"),
  temperature: z.number().describe("Temperature in Celsius"),
  condition: z.string().describe("Weather condition"),
});

const components: TamboComponent[] = [
  {
    name: "WeatherCard",
    component: WeatherCard,
    description:
      "Displays weather for a city. Use when user asks about weather.",
    propsSchema: WeatherCardSchema,
  },
];

<TamboProvider apiKey={apiKey} components={components}>
  <App />
</TamboProvider>;
```

### Generative Key Points

- **propsSchema**: Zod object with `.describe()` on each field
- **description**: Tells AI when to use the component
- **Streaming**: Props start `undefined`, make them optional or handle gracefully
- Use `z.infer<typeof Schema>` for TypeScript props type

## Interactable Components

Pre-place in your UI; AI can observe and update props via natural language.

```tsx
import { withInteractable } from "@tambo-ai/react";
import { z } from "zod";

const NoteSchema = z.object({
  title: z.string().describe("Note title"),
  content: z.string().describe("Note content"),
  color: z.enum(["white", "yellow", "blue"]).optional(),
});

function Note({ title, content, color = "white" }: Props) {
  return (
    <div style={{ backgroundColor: color }}>
      <h3>{title}</h3>
      <p>{content}</p>
    </div>
  );
}

export const InteractableNote = withInteractable(Note, {
  componentName: "Note",
  description: "A note with editable title, content, and color",
  propsSchema: NoteSchema,
});
```

### Interactable How It Works

1. **Auto-registration**: Component registers when mounted
2. **Context sending**: Current props automatically visible to AI
3. **Tool registration**: Update tools registered automatically
4. **Bidirectional**: User edits and AI updates both work

### When to Use Each

| Generative                 | Interactable                 |
| -------------------------- | ---------------------------- |
| AI creates on-demand       | You pre-place in UI          |
| One-time render            | Persistent across session    |
| Props generated once       | AI can update props          |
| Chat responses, dashboards | Settings, forms, task boards |
