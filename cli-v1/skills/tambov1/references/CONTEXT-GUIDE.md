# Context & Attachments Guide

Give AI additional context to improve responses and component generation.

## Context Attachments

Attach data to messages so AI has relevant context:

```tsx
import { useTambo } from "@tambo-ai/react";

function ChatWithContext() {
  const { sendMessage, attachContext } = useTambo();

  const handleSendWithContext = async (message: string) => {
    // Attach current page data
    attachContext({
      type: "page-data",
      data: {
        currentPage: window.location.pathname,
        selectedItems: getSelectedItems(),
        userPreferences: getUserPrefs(),
      },
    });

    await sendMessage(message);
  };
}
```

## Context Types

### Static Context (Always Available)

```tsx
const tamboConfig = {
  context: {
    appName: "My Dashboard",
    appVersion: "2.1.0",
    features: ["analytics", "reports", "exports"],
  },
};
```

### Dynamic Context (Per-Message)

```tsx
// Attach right before sending
attachContext({
  type: "selection",
  data: { selectedRows: table.getSelectedRows() },
});
```

### User Context

```tsx
// Include user info for personalization
attachContext({
  type: "user",
  data: {
    name: user.name,
    role: user.role,
    permissions: user.permissions,
  },
});
```

## Custom Context Helpers

Create reusable context providers:

```tsx
// context-helpers.ts
export function getPageContext() {
  return {
    type: "page",
    data: {
      url: window.location.href,
      title: document.title,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    },
  };
}

export function getSelectionContext(selection: Selection) {
  return {
    type: "selection",
    data: {
      count: selection.items.length,
      items: selection.items.slice(0, 10), // Limit for token efficiency
      hasMore: selection.items.length > 10,
    },
  };
}
```

Usage:

```tsx
attachContext(getPageContext());
attachContext(getSelectionContext(currentSelection));
```

## Image Attachments

Attach images for AI to analyze:

```tsx
const { attachImage } = useTambo();

// From file input
const handleFileSelect = (file: File) => {
  attachImage({
    file,
    description: "User uploaded image",
  });
};

// From URL
attachImage({
  url: "https://example.com/chart.png",
  description: "Current sales chart",
});

// From canvas/screenshot
attachImage({
  dataUrl: canvas.toDataURL(),
  description: "Current diagram state",
});
```

## Best Practices

### 1. Keep Context Relevant

```tsx
// Good - specific, useful context
attachContext({
  type: "dashboard",
  data: {
    currentMetric: "revenue",
    dateRange: "last-30-days",
    filters: activeFilters,
  },
});

// Bad - too much irrelevant data
attachContext({
  type: "everything",
  data: entireAppState, // Don't dump entire state
});
```

### 2. Limit Token Usage

```tsx
// Truncate large data
const context = {
  items: items.slice(0, 20), // Limit array size
  summary: text.slice(0, 500), // Limit text length
  hasMore: items.length > 20, // Indicate truncation
};
```

### 3. Use Types for Structure

```tsx
interface DashboardContext {
  type: "dashboard";
  data: {
    currentView: "overview" | "detail" | "comparison";
    selectedMetrics: string[];
    dateRange: { start: string; end: string };
  };
}

attachContext(dashboardContext satisfies DashboardContext);
```

## Component State as Context

Components can expose state to context for follow-ups:

```tsx
import { useTamboComponentContext } from "@tambo-ai/react";

export function DataTable({ data, columns }: DataTableProps) {
  const [selectedRows, setSelectedRows] = useState<Row[]>([]);

  // Expose selection to AI context
  useTamboComponentContext("data-table-selection", {
    selectedCount: selectedRows.length,
    selectedIds: selectedRows.map((r) => r.id),
  });

  return <table>{/* ... */}</table>;
}
```

Now AI knows about selections:

```
User: "Delete the selected rows"
AI: [Knows 3 rows are selected, can act on them]
```

## Initial Messages with Context

Set up conversation with system context:

```tsx
const tamboConfig = {
  initialMessages: [
    {
      role: "system",
      content: `You are helping with a ${appType} application.
        The user is a ${userRole} with access to ${features.join(", ")}.
        Current date: ${new Date().toISOString()}`,
    },
  ],
};
```

## Context in Component Descriptions

Reference expected context in component registration:

```tsx
{
  name: "SalesChart",
  description: `Displays sales data visualization.
    Use when user asks about sales, revenue, or trends.
    Expects context with dateRange and selectedProducts.`,
  component: SalesChart,
  propsSchema: salesChartSchema,
}
```
