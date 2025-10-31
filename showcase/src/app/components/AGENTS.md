# AGENTS.md - Component Documentation Pages

Guidance for working with component documentation pages in the showcase.

## Directory Structure

```
components/
├── (blocks)/                    # Full-featured components
│   ├── control-bar/
│   ├── message-thread-collapsible/
│   ├── message-thread-full/
│   └── message-thread-panel/
├── (message-primitives)/        # Basic building blocks
│   ├── message/
│   ├── message-input/
│   ├── thread-content/
│   └── thread-history/
├── (generative)/                # AI-generated UI
│   ├── form/
│   ├── graph/
│   ├── input-fields/
│   └── map/
└── (canvas)/                    # Canvas-based
    └── canvas-space/
```

## Standard Page Structure

Every component documentation page follows this pattern:

```tsx
import { ComponentCodePreview } from "@/components/component-code-preview";
import { InstallationSection } from "@/components/installation-section";
import { YourComponent } from "@/components/ui/your-component";

export default function YourComponentPage() {
  return (
    <div className="prose max-w-6xl">
      {/* Title & Description */}
      <h1>Component Name</h1>
      <p className="text-lg text-muted-foreground">
        Brief description of what this component does.
      </p>

      {/* Examples Section */}
      <h2 className="mt-12">Examples</h2>

      <ComponentCodePreview
        title="Basic Usage"
        component={<YourComponent />}
        code={`import { YourComponent } from "@tambo-ai/react";

export function Demo() {
  return <YourComponent prop="value" />;
}`}
        previewClassName="p-8"
      />

      {/* Installation */}
      <h2 className="mt-12">Installation</h2>

      <div className="not-prose">
        <InstallationSection cliCommand="npx tambo add your-component" />
      </div>

      {/* Component API */}
      <h2 className="mt-12">Component API</h2>

      <h3>YourComponent</h3>

      <table>
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>prop1</td>
            <td>string</td>
            <td>-</td>
            <td>Description</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
```

## ComponentCodePreview Patterns

**Standard components:**

```tsx
<ComponentCodePreview
  component={<YourComponent />}
  code={`...`}
  previewClassName="p-8" // 2rem padding
/>
```

**Full-bleed block components:**

```tsx
<ComponentCodePreview
  component={<MessageThread />}
  code={`...`}
  previewClassName="p-0" // No padding
  minHeight={650}
  enableFullscreen
  fullscreenTitle="Message Thread"
/>
```

**Chat/form interfaces:**

```tsx
<ComponentCodePreview
  component={<FormChat />}
  code={`...`}
  previewClassName="p-8"
  minHeight={650} // Enough space for interaction
/>
```

## Common Mistakes

```tsx
// ❌ WRONG: Manual spacing with prose
<div className="prose">
  <div className="flex flex-col gap-8">
    <h1 className="mb-4">Title</h1>
  </div>
</div>

// ✅ RIGHT: Let prose handle spacing
<div className="prose">
  <h1>Title</h1>
  <h2 className="mt-12">Section</h2>
</div>

// ❌ WRONG: Wrapping h2 in not-prose
<section className="not-prose mt-12">
  <h2 className="text-xl font-500 mb-4">Installation</h2>
  <InstallationSection />
</section>

// ✅ RIGHT: Keep h2 in prose, wrap only InstallationSection
<>
  <h2 className="mt-12">Installation</h2>
  <div className="not-prose">
    <InstallationSection />
  </div>
</>

// ❌ WRONG: Mixing height in className and prop
<ComponentCodePreview
  previewClassName="p-0 min-h-[650px]"
  minHeight={650}
/>

// ✅ RIGHT: Use minHeight prop only
<ComponentCodePreview
  previewClassName="p-0"
  minHeight={650}
/>
```

## Adding New Component Pages

1. Create directory in appropriate category: `(blocks)`, `(message-primitives)`, `(generative)`, or `(canvas)`
2. Add `page.tsx` following the standard structure above
3. Update `/src/lib/navigation.ts` to add the page to sidebar navigation
4. If it's a new component, add implementation to `/src/components/ui/`
5. If it needs a chat interface, add to `/src/components/generative/`
