# ListViewCard Component

A high-performance, virtualized list component designed for displaying large datasets with smooth scrolling, multiple selection modes, and comprehensive accessibility features.

## Features

- **Virtualization**: Efficiently renders only visible items for smooth performance with 50k+ items
- **Selection Modes**: Support for none, single, and multi-selection with checkboxes
- **Media Support**: Optional avatars, thumbnails, and icons for each item
- **Keyboard Navigation**: Full keyboard support with arrow keys, Home, End, and type-ahead search
- **Accessibility**: ARIA listbox semantics, screen reader support, and proper focus management
- **Pagination**: Load-more functionality for infinite scrolling
- **Customization**: Multiple variants, sizes, and styling options

## Installation

The component is included in the `@tambo-ai/react` package. No additional installation is required.

## Basic Usage

```tsx
import { ListViewCard } from "@tambo-ai/react";

const items = [
  {
    id: "1",
    title: "First Item",
    subtitle: "Description for first item",
    media: {
      type: "avatar",
      src: "https://example.com/avatar1.jpg",
      alt: "User avatar"
    }
  },
  // ... more items
];

function MyComponent() {
  const handleSelect = (selectedIds: string[]) => {
    console.log("Selected:", selectedIds);
  };

  const handleActivate = (id: string) => {
    console.log("Activated:", id);
  };

  return (
    <ListViewCard
      items={items}
      selectionMode="multi"
      showCheckboxes={true}
      onSelect={handleSelect}
      onActivate={handleActivate}
      height={400}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `Array<Item>` | `[]` | Array of items to display |
| `selectionMode` | `'none' \| 'single' \| 'multi'` | `'none'` | Selection behavior |
| `height` | `number \| string` | `400` | Height of the list container |
| `itemHeight` | `number` | `60` | Height of each list item |
| `showCheckboxes` | `boolean` | `false` | Show checkboxes for multi-selection |
| `onSelect` | `(ids: string[]) => void` | `undefined` | Callback when selection changes |
| `onActivate` | `(id: string) => void` | `undefined` | Callback when item is activated |
| `onLoadMore` | `({ cursor }) => Promise<{items, cursor}>` | `undefined` | Load more items callback |
| `className` | `string` | `undefined` | Additional CSS classes |
| `variant` | `'default' \| 'bordered' \| 'elevated'` | `'default'` | Visual variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size variant |

## Item Structure

Each item in the `items` array should have the following structure:

```tsx
interface Item {
  id: string;                    // Unique identifier
  title: string;                 // Primary text to display
  subtitle?: string;             // Optional secondary text
  media?: {                      // Optional media
    type: 'avatar' | 'thumbnail' | 'icon';
    src: string;                 // Source URL or icon character
    alt?: string;                // Alt text for accessibility
  };
}
```

## Selection Modes

### No Selection
```tsx
<ListViewCard
  items={items}
  selectionMode="none"
  onActivate={handleActivate}
/>
```

### Single Selection
```tsx
<ListViewCard
  items={items}
  selectionMode="single"
  onSelect={handleSelect}
  onActivate={handleActivate}
/>
```

### Multi Selection
```tsx
<ListViewCard
  items={items}
  selectionMode="multi"
  showCheckboxes={true}
  onSelect={handleSelect}
  onActivate={handleActivate}
/>
```

## Media Types

### Avatar
```tsx
{
  id: "1",
  title: "User Name",
  subtitle: "user@example.com",
  media: {
    type: "avatar",
    src: "https://example.com/avatar.jpg",
    alt: "User avatar"
  }
}
```

### Thumbnail
```tsx
{
  id: "1",
  title: "Product Name",
  subtitle: "Product description",
  media: {
    type: "thumbnail",
    src: "https://example.com/product.jpg",
    alt: "Product image"
  }
}
```

### Icon
```tsx
{
  id: "1",
  title: "Feature",
  subtitle: "Feature description",
  media: {
    type: "icon",
    src: "🚀",
    alt: "Rocket icon"
  }
}
```

## Keyboard Navigation

- **Arrow Up/Down**: Navigate between items
- **Home**: Jump to first item
- **End**: Jump to last item
- **Enter/Space**: Activate selected item
- **Type-ahead**: Start typing to jump to matching items

## Virtualization

The component automatically virtualizes large datasets, rendering only the items currently visible in the viewport plus a small overscan area. This ensures smooth performance even with tens of thousands of items.

```tsx
// Performance test with 50k items
const largeDataset = Array.from({ length: 50000 }, (_, i) => ({
  id: `item-${i + 1}`,
  title: `Item ${i + 1}`,
  subtitle: `Description for item ${i + 1}`
}));

<ListViewCard
  items={largeDataset}
  height={400}
  itemHeight={50}
/>
```

## Load More Pagination

For infinite scrolling scenarios, use the `onLoadMore` callback:

```tsx
const handleLoadMore = async ({ cursor }: { cursor?: string }) => {
  // Fetch more data from your API
  const response = await fetchMoreItems(cursor);
  
  return {
    items: response.items,
    cursor: response.nextCursor
  };
};

<ListViewCard
  items={items}
  onLoadMore={handleLoadMore}
  height={400}
/>
```

## Variants and Sizes

### Variants
- **default**: Standard border and background
- **bordered**: Thicker border for emphasis
- **elevated**: Adds shadow for depth

### Sizes
- **sm**: Compact padding and text
- **md**: Standard padding and text (default)
- **lg**: Larger padding and text

```tsx
<ListViewCard
  items={items}
  variant="elevated"
  size="lg"
  height={400}
/>
```

## Accessibility

The component follows ARIA best practices:

- **role="listbox"**: Proper semantic role for selection lists
- **aria-multiselectable**: Indicates multi-selection capability
- **aria-selected**: Announces selection state
- **aria-activedescendant**: Indicates currently focused item
- **Keyboard focus**: Full keyboard navigation support
- **Screen reader**: Proper labeling and descriptions

## Performance Considerations

- **Item Height**: Set a consistent `itemHeight` for optimal virtualization
- **Large Datasets**: Use `onLoadMore` for datasets larger than 10k items
- **Media Optimization**: Optimize images and use appropriate sizes
- **Debounced Updates**: The component automatically debounces state updates

## Examples

### User List with Avatars
```tsx
const users = [
  {
    id: "user-1",
    title: "John Doe",
    subtitle: "Software Engineer",
    media: {
      type: "avatar",
      src: "https://i.pravatar.cc/40?u=1",
      alt: "John Doe"
    }
  }
  // ... more users
];

<ListViewCard
  items={users}
  selectionMode="multi"
  showCheckboxes={true}
  variant="bordered"
  height={500}
/>
```

### Product Catalog
```tsx
const products = [
  {
    id: "prod-1",
    title: "Wireless Headphones",
    subtitle: "$199.99 - In Stock",
    media: {
      type: "thumbnail",
      src: "/images/headphones.jpg",
      alt: "Wireless headphones"
    }
  }
  // ... more products
];

<ListViewCard
  items={products}
  selectionMode="single"
  variant="elevated"
  size="lg"
  height={600}
/>
```

### File Browser
```tsx
const files = [
  {
    id: "file-1",
    title: "document.pdf",
    subtitle: "2.3 MB - Modified 2 hours ago",
    media: {
      type: "icon",
      src: "📄",
      alt: "PDF document"
    }
  }
  // ... more files
];

<ListViewCard
  items={files}
  selectionMode="multi"
  showCheckboxes={true}
  height={400}
/>
```

## Troubleshooting

### Performance Issues
- Ensure `itemHeight` is set correctly
- Use `onLoadMore` for very large datasets
- Check for unnecessary re-renders in parent components

### Selection Not Working
- Verify `selectionMode` is not set to "none"
- Check that `onSelect` callback is provided
- Ensure items have unique `id` values

### Keyboard Navigation Issues
- Make sure the component has focus
- Check for conflicting keyboard handlers
- Verify no parent elements are capturing key events

## Related Components

- [Form](/docs/components/form) - For data input and editing
- [Message Thread](/docs/components/message-thread) - For chat-like interfaces
- [Control Bar](/docs/components/control-bar) - For action buttons and controls


