# Compound Component Examples

## Complete Example: ReasoningInfo Component

A full implementation showing all patterns working together.

### File Structure

```
reasoning-info/
├── index.tsx
├── root/
│   ├── reasoning-info-root.tsx
│   └── reasoning-info-context.tsx
├── trigger/
│   └── reasoning-info-trigger.tsx
├── content/
│   └── reasoning-info-content.tsx
├── steps/
│   └── reasoning-info-steps.tsx
└── status-text/
    └── reasoning-info-status-text.tsx
```

### Context

```tsx
// reasoning-info-context.tsx
import * as React from "react";

interface ReasoningInfoContextValue {
  reasoning: string[];
  durationMs: number | null;
  isExpanded: boolean;
  setExpanded: (expanded: boolean) => void;
}

const ReasoningInfoContext =
  React.createContext<ReasoningInfoContextValue | null>(null);

export function useReasoningInfoContext() {
  const context = React.useContext(ReasoningInfoContext);
  if (!context) {
    throw new Error(
      "ReasoningInfo components must be used within ReasoningInfo.Root",
    );
  }
  return context;
}

export { ReasoningInfoContext };
```

### Root

```tsx
// reasoning-info-root.tsx
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { ReasoningInfoContext } from "./reasoning-info-context";

interface ReasoningInfoRootProps extends React.HTMLAttributes<HTMLDivElement> {
  message: { reasoning?: string[]; reasoningDurationMS?: number };
  defaultExpanded?: boolean;
  asChild?: boolean;
}

export const ReasoningInfoRoot = React.forwardRef<
  HTMLDivElement,
  ReasoningInfoRootProps
>(({ message, defaultExpanded = false, asChild, children, ...props }, ref) => {
  const [isExpanded, setExpanded] = React.useState(defaultExpanded);
  const reasoning = message.reasoning ?? [];
  const durationMs = message.reasoningDurationMS ?? null;

  // Don't render if no reasoning
  if (reasoning.length === 0) return null;

  const Comp = asChild ? Slot : "div";

  return (
    <ReasoningInfoContext.Provider
      value={{ reasoning, durationMs, isExpanded, setExpanded }}
    >
      <Comp
        ref={ref}
        data-state={isExpanded ? "open" : "closed"}
        data-slot="reasoning-info-root"
        {...props}
      >
        {children}
      </Comp>
    </ReasoningInfoContext.Provider>
  );
});
ReasoningInfoRoot.displayName = "ReasoningInfo.Root";
```

### Trigger

```tsx
// reasoning-info-trigger.tsx
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { useReasoningInfoContext } from "../root/reasoning-info-context";

interface ReasoningInfoTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const ReasoningInfoTrigger = React.forwardRef<
  HTMLButtonElement,
  ReasoningInfoTriggerProps
>(({ asChild, onClick, ...props }, ref) => {
  const { isExpanded, setExpanded } = useReasoningInfoContext();
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      type="button"
      aria-expanded={isExpanded}
      data-state={isExpanded ? "open" : "closed"}
      data-slot="reasoning-info-trigger"
      onClick={(e) => {
        setExpanded(!isExpanded);
        onClick?.(e);
      }}
      {...props}
    />
  );
});
ReasoningInfoTrigger.displayName = "ReasoningInfo.Trigger";
```

### Content (Collapsible)

```tsx
// reasoning-info-content.tsx
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { useReasoningInfoContext } from "../root/reasoning-info-context";

interface ReasoningInfoContentProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  forceMount?: boolean;
}

export const ReasoningInfoContent = React.forwardRef<
  HTMLDivElement,
  ReasoningInfoContentProps
>(({ asChild, forceMount, children, ...props }, ref) => {
  const { isExpanded } = useReasoningInfoContext();
  const Comp = asChild ? Slot : "div";

  if (!forceMount && !isExpanded) return null;

  return (
    <Comp
      ref={ref}
      data-state={isExpanded ? "open" : "closed"}
      data-slot="reasoning-info-content"
      hidden={!isExpanded}
      {...props}
    >
      {children}
    </Comp>
  );
});
ReasoningInfoContent.displayName = "ReasoningInfo.Content";
```

### Steps (with Render Prop)

```tsx
// reasoning-info-steps.tsx
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { useReasoningInfoContext } from "../root/reasoning-info-context";

export interface ReasoningInfoStepsRenderProps {
  steps: string[];
  showStepNumbers: boolean;
}

interface ReasoningInfoStepsProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  asChild?: boolean;
  render?: (props: ReasoningInfoStepsRenderProps) => React.ReactNode;
  children?: React.ReactNode | (props: ReasoningInfoStepsRenderProps) => React.ReactNode;;
}

export const ReasoningInfoSteps = React.forwardRef<
  HTMLDivElement,
  ReasoningInfoStepsProps
>(({ asChild, render, children, ...props }, ref) => {
  const { reasoning } = useReasoningInfoContext();
  const Comp = asChild ? Slot : "div";

  const renderProps: ReasoningInfoStepsRenderProps = {
    steps: reasoning,
    showStepNumbers: reasoning.length > 1,
  };

  const content = render ? render(renderProps) : children;

  return (
    <Comp ref={ref} data-slot="reasoning-info-steps" {...props}>
      {content}
    </Comp>
  );
});
ReasoningInfoSteps.displayName = "ReasoningInfo.Steps";
```

### Status Text

```tsx
// reasoning-info-status-text.tsx
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { useReasoningInfoContext } from "../root/reasoning-info-context";

interface ReasoningInfoStatusTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  asChild?: boolean;
}

export const ReasoningInfoStatusText = React.forwardRef<
  HTMLSpanElement,
  ReasoningInfoStatusTextProps
>(({ asChild, ...props }, ref) => {
  const { durationMs } = useReasoningInfoContext();
  const Comp = asChild ? Slot : "span";

  const text = durationMs
    ? `Thought for ${(durationMs / 1000).toFixed(1)}s`
    : "Thinking...";

  return (
    <Comp ref={ref} data-slot="reasoning-info-status-text" {...props}>
      {text}
    </Comp>
  );
});
ReasoningInfoStatusText.displayName = "ReasoningInfo.StatusText";
```

### Namespace Export

```tsx
// index.tsx
"use client";

import { ReasoningInfoContent } from "./content/reasoning-info-content";
import { ReasoningInfoRoot } from "./root/reasoning-info-root";
import { ReasoningInfoStatusText } from "./status-text/reasoning-info-status-text";
import { ReasoningInfoSteps } from "./steps/reasoning-info-steps";
import { ReasoningInfoTrigger } from "./trigger/reasoning-info-trigger";

export const ReasoningInfo = {
  Root: ReasoningInfoRoot,
  Trigger: ReasoningInfoTrigger,
  StatusText: ReasoningInfoStatusText,
  Content: ReasoningInfoContent,
  Steps: ReasoningInfoSteps,
};

// Re-export types
export type { ReasoningInfoRootProps } from "./root/reasoning-info-root";
export type { ReasoningInfoStepsRenderProps } from "./steps/reasoning-info-steps";
```

---

## Usage Examples

### Basic Usage

```tsx
<ReasoningInfo.Root message={message} defaultExpanded={true}>
  <ReasoningInfo.Trigger className="flex items-center gap-1 text-xs">
    <ReasoningInfo.StatusText />
    <ChevronDown className="h-3 w-3" />
  </ReasoningInfo.Trigger>
  <ReasoningInfo.Content className="mt-2 rounded bg-muted p-3">
    <ReasoningInfo.Steps className="space-y-2">
      {({ steps }) => (
          {steps.map((step, i) => (
            <div key={i} className="text-sm text-muted-foreground">
              {step}
            </div>
          ))}
      )}}
    </ReasoningInfo.Steps>
  </ReasoningInfo.Content>
</ReasoningInfo.Root>
```

### Styled Differently (AI Elements Style)

```tsx
<ReasoningInfo.Root message={message} defaultExpanded={true}>
  <ReasoningInfo.Trigger className="mb-2 flex cursor-pointer items-center gap-1 text-xs text-muted-foreground">
    <ReasoningInfo.StatusText />
    <ChevronDown className="h-3 w-3 transition-transform data-[state=open]:rotate-180" />
  </ReasoningInfo.Trigger>
  <ReasoningInfo.Content className="mb-3 rounded-2xl bg-background/50 p-2">
    <ReasoningInfo.Steps
      render={({ steps }) => (
        <div className="space-y-1 text-xs">
          {steps.map((step, i) => (
            <div key={i} className="text-muted-foreground">
              {step}
            </div>
          ))}
        </div>
      )}
    />
  </ReasoningInfo.Content>
</ReasoningInfo.Root>
```

### With Custom Element (asChild)

```tsx
<ReasoningInfo.Root message={message}>
  <ReasoningInfo.Trigger asChild>
    <MyCustomButton variant="ghost" size="sm">
      <ReasoningInfo.StatusText />
    </MyCustomButton>
  </ReasoningInfo.Trigger>
</ReasoningInfo.Root>
```

### CSS-Only Styling with Data Attributes

```css
/* Style based on state */
[data-slot="reasoning-info-trigger"] {
  cursor: pointer;
  transition: color 0.2s;
}

[data-slot="reasoning-info-trigger"]:hover {
  color: var(--foreground);
}

[data-slot="reasoning-info-trigger"][data-state="open"] svg {
  transform: rotate(180deg);
}

[data-slot="reasoning-info-content"][data-state="closed"] {
  display: none;
}

[data-slot="reasoning-info-content"][data-state="open"] {
  animation: slideDown 0.2s ease-out;
}
```
