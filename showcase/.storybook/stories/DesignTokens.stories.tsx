import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta = {
  title: "Design System/Token Usage",
  parameters: {
    docs: {
      description: {
        component: "Examples of correct and incorrect token usage patterns.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const CorrectTextUsage: Story = {
  render: () => (
    <div className="space-y-4 p-8">
      <h2 className="text-foreground text-xl font-semibold">
        ✅ Correct Text Usage
      </h2>

      <div className="space-y-2">
        <h3 className="text-foreground font-medium">Headings and body text</h3>
        <p className="text-foreground">
          This is body text using text-foreground
        </p>
        <p className="text-muted-foreground">
          This is a caption using text-muted-foreground
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-foreground font-medium">Form Label</label>
        <p className="text-muted-foreground text-sm">Helper text below label</p>
        <input
          className="border rounded px-3 py-2 text-foreground placeholder:text-muted-foreground"
          placeholder="Placeholder text"
        />
      </div>

      <div className="space-y-2">
        <button className="bg-primary text-primary px-4 py-2 rounded">
          Primary CTA (text-primary WITH bg-primary)
        </button>
        <button className="bg-muted text-muted-foreground px-4 py-2 rounded">
          Secondary action (neutral)
        </button>
      </div>
    </div>
  ),
};

export const IncorrectTextUsage: Story = {
  render: () => (
    <div className="space-y-4 p-8 bg-red-50 dark:bg-red-950/20">
      <h2 className="text-red-600 text-xl font-semibold">
        ❌ Incorrect Text Usage (DO NOT USE)
      </h2>

      <div className="space-y-2">
        <h3 className="text-primary font-medium">
          ❌ Heading with text-primary (breaks in dark mode)
        </h3>
        <p className="text-primary">
          ❌ Body text with text-primary (wrong semantic meaning)
        </p>
        <p className="text-secondary">
          ❌ Caption with deprecated text-secondary
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-primary font-medium">
          ❌ Form Label with text-primary
        </label>
        <p className="text-secondary text-sm">
          ❌ Helper text with text-secondary
        </p>
        <input
          className="border rounded px-3 py-2 text-primary placeholder:text-primary"
          placeholder="❌ Placeholder with text-primary"
        />
      </div>

      <div className="space-y-2">
        <button className="bg-muted text-primary px-4 py-2 rounded">
          ❌ text-primary without bg-primary
        </button>
      </div>
    </div>
  ),
};

export const InteractiveStates: Story = {
  render: () => (
    <div className="space-y-4 p-8">
      <h2 className="text-foreground text-xl font-semibold">
        Interactive State Patterns
      </h2>

      <div className="space-y-2">
        <h3 className="text-foreground font-medium">
          ✅ Correct Button Patterns
        </h3>
        <button className="bg-primary text-primary hover:bg-primary/90 px-4 py-2 rounded">
          Primary Action
        </button>
        <button className="bg-muted text-muted-foreground hover:bg-muted/80 px-4 py-2 rounded">
          Secondary Action
        </button>
        <button className="text-muted-foreground hover:text-foreground px-4 py-2">
          Ghost Button
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-foreground font-medium">
          ✅ Loading States (Always Neutral)
        </h3>
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-foreground font-medium">
          ✅ Status Colors (Hardcoded Semantic)
        </h3>
        <p className="text-green-600 dark:text-green-400">Success message</p>
        <p className="text-red-600 dark:text-red-400">Error message</p>
        <p className="text-amber-600 dark:text-amber-400">Warning message</p>
      </div>
    </div>
  ),
};
