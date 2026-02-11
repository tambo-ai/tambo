---
name: component-rendering
description: Handles Tambo component streaming, loading states, and persistent state. Use when implementing streaming UI feedback, tracking prop streaming status, managing partial props, or persisting component state across sessions with useTamboStreamStatus or useTamboComponentState.
---

# Component Rendering

Handles streaming props and persistent component state.

## Quick Start

```tsx
const { streamStatus, propStatus } = useTamboStreamStatus<Props>();

if (streamStatus.isPending) return <Skeleton />;
if (streamStatus.isStreaming) return <LoadingIndicator />;
```

## Stream Status

Track overall and per-prop streaming status:

```tsx
import { useTamboStreamStatus } from "@tambo-ai/react";

function MyComponent({ title, items }: Props) {
  const { streamStatus, propStatus } = useTamboStreamStatus<Props>();

  // Global status
  if (streamStatus.isPending) return <Skeleton />;
  if (streamStatus.isStreaming) return <LoadingIndicator />;
  if (streamStatus.isError) return <Error message={streamStatus.streamError} />;

  // Per-prop status
  return (
    <h2 className={propStatus.title?.isStreaming ? "animate-pulse" : ""}>
      {title}
    </h2>
  );
}
```

### StreamStatus Properties

| Property      | Description                      |
| ------------- | -------------------------------- |
| `isPending`   | No tokens received yet           |
| `isStreaming` | Active streaming in progress     |
| `isSuccess`   | All props finished without error |
| `isError`     | Fatal error occurred             |
| `streamError` | Error object if failed           |

### PropStatus (per-prop)

| Property      | Description                  |
| ------------- | ---------------------------- |
| `isPending`   | No tokens for this prop yet  |
| `isStreaming` | Prop has partial content     |
| `isSuccess`   | Prop finished streaming      |
| `error`       | Error for this prop (if any) |

## Component State

Make state visible to AI and persist across sessions:

```tsx
import { useTamboComponentState, useTamboStreamStatus } from "@tambo-ai/react";

function EditableCard({ title: streamedTitle }: { title?: string }) {
  const [title, setTitle, { isPending, flush }] = useTamboComponentState(
    "title",
    "",
  );
  const { streamStatus } = useTamboStreamStatus();

  return (
    <input
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      disabled={streamStatus.isStreaming || isPending}
    />
  );
}
```

### useTamboComponentState API

```tsx
const [value, setValue, meta] = useTamboComponentState(
  key, // Unique state key within the component
  initialValue, // Initial value if no server state
  debounceTime, // Debounce ms (default: 500)
);
```

| Return           | Description                                 |
| ---------------- | ------------------------------------------- |
| `value`          | Current state value                         |
| `setValue`       | Update state (supports updater functions)   |
| `meta.isPending` | Server sync in progress                     |
| `meta.error`     | Sync error (if any)                         |
| `meta.flush`     | Immediately flush pending debounced updates |

### setValue Patterns

```tsx
// Direct value
setTitle("New title");

// Updater function
setCount((prev) => prev + 1);
```

### When to Use Component State

- User-editable content AI should see
- Form inputs requiring persistence
- State that survives page reloads
- Streaming props that user can modify after generation

## Streaming Best Practices

1. **Make props optional** in Zod schema:

   ```tsx
   z.object({
     title: z.string().optional().describe("Card title"),
     items: z.array(z.string()).optional(),
   });
   ```

2. **Show skeletons** for missing data, not errors

3. **Use optional chaining**: `items?.map(...)`

4. **Disable interactions** until `streamStatus.isSuccess`
