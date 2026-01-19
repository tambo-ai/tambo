# Interactable Components Guide

Build components that AI can update after initial render.

## What Are Interactable Components?

Normal generative UI: AI renders component once with generated props.

Interactable components: AI can update component state in follow-up messages.

```
User: "Show me a todo list"
AI: [Renders TodoList with initial items]

User: "Add 'Buy groceries' to the list"
AI: [Updates the same TodoList - adds item]
```

## useTamboComponentState

The key hook for interactable components:

```tsx
import { useTamboComponentState } from "@tambo-ai/react";

export function TodoList({ title, initialItems }: TodoListProps) {
  const [items, setItems, { isPending }] = useTamboComponentState(
    "todo-list-items", // Unique key
    initialItems, // Initial value
  );

  return (
    <div className="max-w-md p-4 rounded-lg border">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        {isPending && (
          <span className="text-xs text-muted-foreground animate-pulse">
            AI updating...
          </span>
        )}
      </div>
      <ul className="mt-2 space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Key Requirements

### 1. Unique Keys (CRITICAL)

Every `useTamboComponentState` needs a unique key:

```tsx
// Good - descriptive, unique keys
useTamboComponentState("user-profile-settings", settings);
useTamboComponentState("dashboard-metrics-v2", metrics);
useTamboComponentState(`chart-${chartId}`, chartData);

// Bad - generic, collision-prone
useTamboComponentState("data", data);
useTamboComponentState("items", items);
```

If two components use the same key, they'll share state (usually a bug).

### 2. Show Pending State

Always indicate when AI is updating:

```tsx
const [data, setData, { isPending }] = useTamboComponentState(key, initial);

return (
  <div className={isPending ? "opacity-50" : ""}>
    {isPending && <Spinner />}
    {/* content */}
  </div>
);
```

### 3. Schema for Updates

Define what AI can update:

```tsx
export const todoListSchema = z.object({
  title: z.string().describe("List title"),
  initialItems: z.array(z.string()).describe("Initial todo items"),
})

// In registration, add updateableFields
{
  name: "TodoList",
  description: "Interactive todo list. AI can add, remove, or modify items after render.",
  component: TodoList,
  propsSchema: todoListSchema,
  updateableFields: ["items"],  // AI knows it can update 'items'
}
```

## When to Use Interactables

| Use Case              | Pattern                  |
| --------------------- | ------------------------ |
| List that AI modifies | `useTamboComponentState` |
| Form AI fills in      | `useTamboComponentState` |
| Chart AI updates      | `useTamboComponentState` |
| Static display        | Regular props (no hook)  |
| One-time render       | Regular props (no hook)  |

## Example: Editable Notes

```tsx
import { z } from "zod";
import { useTamboComponentState } from "@tambo-ai/react";

export const notesSchema = z.object({
  title: z.string().describe("Note title"),
  initialContent: z.string().describe("Initial note content"),
});

type NotesProps = z.infer<typeof notesSchema>;

export function Notes({ title, initialContent }: NotesProps) {
  const [content, setContent, { isPending }] = useTamboComponentState(
    `notes-${title.toLowerCase().replace(/\s+/g, "-")}`,
    initialContent,
  );

  return (
    <div className="max-w-lg p-4 rounded-lg border">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{title}</h3>
        {isPending && (
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
            AI editing...
          </span>
        )}
      </div>
      <div className="prose prose-sm">{content}</div>
    </div>
  );
}
```

Registration:

```tsx
{
  name: "Notes",
  description: "Editable notes component. AI can update content. Use for documentation, summaries, or any text AI should modify.",
  component: Notes,
  propsSchema: notesSchema,
}
```

## User + AI Editing

For components where both user and AI can edit:

```tsx
export function CollaborativeList({ title, initialItems }: Props) {
  const [items, setItems, { isPending }] = useTamboComponentState(
    "collab-list",
    initialItems,
  );
  const [newItem, setNewItem] = useState("");

  // User adds item
  const handleUserAdd = () => {
    if (newItem.trim()) {
      setItems([...items, newItem.trim()]);
      setNewItem("");
    }
  };

  // AI updates via setItems automatically

  return (
    <div className="max-w-md p-4 rounded-lg border">
      <h3 className="font-semibold">{title}</h3>
      {isPending && <span>AI updating...</span>}

      <ul className="mt-2 space-y-1">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>

      {/* User input */}
      <div className="mt-4 flex gap-2">
        <input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Add item..."
          className="flex-1 px-2 py-1 border rounded"
        />
        <button
          onClick={handleUserAdd}
          className="px-3 py-1 bg-primary text-primary-foreground rounded"
        >
          Add
        </button>
      </div>
    </div>
  );
}
```

## Common Patterns

### Counter/Numeric State

```tsx
const [count, setCount] = useTamboComponentState("page-counter", 0);

// AI can: setCount(count + 1), setCount(0), etc.
```

### Toggle State

```tsx
const [isEnabled, setIsEnabled] = useTamboComponentState(
  "feature-toggle",
  false,
);

// AI can: setIsEnabled(true), setIsEnabled(false)
```

### Object State

```tsx
const [settings, setSettings] = useTamboComponentState("user-settings", {
  theme: "light",
  notifications: true,
});

// AI can update individual fields:
// setSettings({ ...settings, theme: "dark" })
```
